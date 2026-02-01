import json
import select
from django.db import transaction, connection
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, Match, Message, Swipe
from .serializers import (
    CustomTokenObtainPairSerializer,
    DatingProfileSerializer,
    MatchListSerializer,
    MessageSerializer,
    SwipeActionSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from .utils import build_tag_vector, cosine, distance_km, reverse_geocode_city
from .utils_embeddings import dot, refresh_profile_embedding_async

WEIGHT_TAGS = 0.1
WEIGHT_COSINE = 0.4
WEIGHT_EMBEDDING = 0.5
MATCH_THRESHOLD = 0.6
MAX_CANDIDATES = 5000
TOP_RESULTS = 50
DB_NOTIFY_CHANNEL = "chat_updates"

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        user = serializer.save()
        self._update_location(user)
        transaction.on_commit(lambda: refresh_profile_embedding_async(user.id))

    def _update_location(self, user):
        if user.latitude is not None and user.longitude is not None:
            user.city, user.country = reverse_geocode_city(user.latitude, user.longitude)
            user.save(update_fields=["city", "country"])

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        initial_bio = serializer.instance.bio
        user = serializer.save()

        self._update_location_if_needed(user)

        if "description" in serializer.validated_data and user.bio != initial_bio:
            transaction.on_commit(lambda: refresh_profile_embedding_async(user.id))

    def _update_location_if_needed(self, user):
        if user.latitude and user.longitude:
            user.city, user.country = reverse_geocode_city(user.latitude, user.longitude)
            user.save(update_fields=["city", "country"])

class PotentialMatchesView(generics.ListAPIView):
    serializer_class = DatingProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        current_user = request.user
        candidates = self._get_candidates(current_user)
        candidates = self._filter_by_distance(current_user, candidates)
        candidates = self._filter_by_age(current_user, candidates)

        scored_candidates = self._score_candidates(current_user, candidates)

        sorted_candidates = sorted(
            scored_candidates,
            key=lambda item: (item["priority"], item["score"]),
            reverse=True
        )

        return Response(sorted_candidates[:TOP_RESULTS])

    def _get_candidates(self, user):
        swiped_ids = Swipe.objects.filter(actor=user).values_list("target_id", flat=True)
        queryset = CustomUser.objects.exclude(id__in=swiped_ids).exclude(id=user.id).exclude(role=CustomUser.Role.ADMIN)

        if user.interested_in:
            queryset = queryset.filter(gender__in=user.interested_in)

        return list(queryset.filter(interested_in__contains=[user.gender])[:MAX_CANDIDATES])

    def _filter_by_age(self, user, candidates):
        if user.age is None:
            return candidates

        max_diff = getattr(user, "max_age_diff", None)
        if max_diff is None:
            return candidates

        min_age = user.age - max_diff
        max_age = user.age + max_diff

        return [
            c for c in candidates
            if c.age is not None and min_age <= c.age <= max_age
        ]

    def _filter_by_distance(self, user, candidates):
        if user.latitude is None or user.longitude is None:
            return candidates

        max_dist = user.max_distance
        return [
            c for c in candidates
            if c.latitude and c.longitude and
               distance_km(user.latitude, user.longitude, c.latitude, c.longitude) <= max_dist
        ]

    def _score_candidates(self, user, candidates):
        liked_me_ids = set(
            Swipe.objects.filter(target=user, action=Swipe.Action.LIKE)
            .values_list("actor_id", flat=True)
        )

        all_tags = (user.tags or []) + [tag for c in candidates for tag in (c.tags or [])]
        vocab = sorted(set(all_tags))
        user_vector = build_tag_vector(user.tags, vocab)

        scored = []
        for candidate in candidates:
            score_data = self._calculate_single_score(user, user_vector, candidate, vocab)

            is_liked_by_candidate = candidate.id in liked_me_ids
            priority = 1 if (is_liked_by_candidate and score_data['final'] >= MATCH_THRESHOLD) else 0

            scored.append({
                "score": round(score_data['final'], 4),
                "priority": priority,
                "liked_me": is_liked_by_candidate,
                "common": score_data['common'],
                "cosine": round(score_data['cosine'], 4),
                "emb": round(score_data['emb'], 4),
                "user": self.get_serializer(candidate).data,
            })
        return scored

    def _calculate_single_score(self, user, user_vector, candidate, vocab):
        common_count = len(set(user.tags or []) & set(candidate.tags or []))
        cosine_score = cosine(user_vector, build_tag_vector(candidate.tags, vocab))

        emb_score = 0.0
        if user.profile_embedding is not None and candidate.profile_embedding is not None:
            emb_score = dot(user.profile_embedding, candidate.profile_embedding)

        final_score = (
                WEIGHT_TAGS * common_count +
                WEIGHT_COSINE * cosine_score +
                WEIGHT_EMBEDDING * emb_score
        )

        return {
            "final": final_score,
            "common": common_count,
            "cosine": cosine_score,
            "emb": emb_score
        }

class SwipeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SwipeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_id = serializer.validated_data['target_id']
        action = serializer.validated_data['action']

        if request.user.id == target_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        target = get_object_or_404(CustomUser, id=target_id)

        self._record_swipe(request.user, target, action)
        is_match = self._check_match(request.user, target, action)

        return Response({"is_match": is_match}, status=status.HTTP_200_OK)

    def _record_swipe(self, actor, target, action):
        Swipe.objects.update_or_create(
            actor=actor,
            target=target,
            defaults={'action': action}
        )

    def _check_match(self, actor, target, action):
        if action != Swipe.Action.LIKE:
            return False

        has_liked_back = Swipe.objects.filter(
            actor=target, target=actor, action=Swipe.Action.LIKE
        ).exists()

        if has_liked_back:
            existing_match = Match.objects.filter(users=actor).filter(users=target).first()

            if not existing_match:
                match = Match.objects.create()
                match.users.add(actor, target)

            return True

        return False

class MyMatchesView(generics.ListAPIView):
    serializer_class = MatchListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Match.objects.filter(users=self.request.user, is_active=True).distinct()

class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        match = get_object_or_404(Match, id=self.kwargs['match_id'])
        if self.request.user not in match.users.all():
            return Message.objects.none()
        return Message.objects.filter(match=match)

    def perform_create(self, serializer):
        match = get_object_or_404(Match, id=self.kwargs['match_id'])
        if self.request.user not in match.users.all():
            raise permissions.PermissionDenied()
        serializer.save(sender=self.request.user, match=match)

class GlobalChatStreamView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = StreamingHttpResponse(
            self._event_stream(request),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    def _event_stream(self, request):
        last_msg = Message.objects.order_by('-id').first()
        last_id = last_msg.id if last_msg else 0
        connection.ensure_connection()

        with connection.cursor() as cursor:
            cursor.execute(f"LISTEN {DB_NOTIFY_CHANNEL}")

        while True:
            if select.select([connection.connection], [], [], 15) == ([], [], []):
                yield ": keep-alive\n\n"
            else:
                connection.connection.poll()
                while connection.connection.notifies:
                    connection.connection.notifies.pop(0)

                new_messages = Message.objects.filter(
                    match__users=request.user,
                    id__gt=last_id
                ).exclude(sender=request.user).order_by('id')

                for msg in new_messages:
                    data = MessageSerializer(msg, context={'request': request}).data
                    data['match_id'] = msg.match.id
                    yield f"data: {json.dumps(data)}\n\n"
                    last_id = msg.id