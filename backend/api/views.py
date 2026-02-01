import math
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.http import StreamingHttpResponse
import json
import time
from .models import CustomUser, Match, Swipe, Message
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    DatingProfileSerializer,
    SwipeActionSerializer,
    MatchListSerializer,
    MessageSerializer,
    CustomTokenObtainPairSerializer
)
from .utils import cosine, build_tag_vector, reverse_geocode_city, distance_km
from .utils_embeddings import refresh_profile_embedding, dot, refresh_profile_embedding_async
from django.db import transaction



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        user = serializer.save()

        if user.latitude is not None and user.longitude is not None:
            city, country = reverse_geocode_city(user.latitude, user.longitude)
            user.city = city
            user.country = country
            user.save(update_fields=["city", "country"])

        transaction.on_commit(lambda: refresh_profile_embedding_async(user.id))


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()

        if user.latitude is not None and user.longitude is not None:
            city, country = reverse_geocode_city(user.latitude, user.longitude)
            user.city = city
            user.country = country
            user.save(update_fields=["city", "country"])

        transaction.on_commit(lambda: refresh_profile_embedding_async(user.id))


class PotentialMatchesView(generics.ListAPIView):
    serializer_class = DatingProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        me = self.request.user
        swiped_ids = Swipe.objects.filter(actor=me).values_list("target_id", flat=True)

        qs = CustomUser.objects.exclude(id__in=swiped_ids).exclude(id=me.id).exclude(role="admin")

        if me.interested_in:
            qs = qs.filter(gender__in=me.interested_in)

        qs = qs.filter(interested_in__contains=[me.gender])

        return qs

    def list(self, request, *args, **kwargs):
        me = request.user
        me_emb = me.profile_embedding
        max_km = 20

        candidates = list(self.get_queryset()[:5000])

        # --- filtr odległości ---
        if me.latitude is not None and me.longitude is not None:
            filtered = []
            for c in candidates:
                if c.latitude is None or c.longitude is None:
                    continue  # nie znamy pozycji -> nie pokazujemy
                d = distance_km(me.latitude, me.longitude, c.latitude, c.longitude)
                if d <= max_km:
                    filtered.append(c)
            candidates = filtered

        # --- vocab ---
        all_tags = []
        all_tags.extend(me.tags or [])
        for c in candidates:
            all_tags.extend(c.tags or [])
        vocab = sorted(set(all_tags))

        me_vector = build_tag_vector(me.tags, vocab)

        scored_candidates = []
        for c in candidates:
            common_tags_count = len(set(me.tags or []) & set(c.tags or []))
            cosine_score = cosine(me_vector, build_tag_vector(c.tags, vocab))

            emb_score = 0.0
            if me_emb is not None and c.profile_embedding is not None:
                emb_score = dot(me_emb, c.profile_embedding)

            final_score = (
                    0.1 * common_tags_count +
                    0.4 * cosine_score +
                    0.5 * emb_score
            )

            scored_candidates.append({
                "score": round(final_score, 4),
                "common": common_tags_count,
                "cosine": round(cosine_score, 4),
                "emb": round(emb_score, 4),
                "user": self.get_serializer(c).data,
            })

        scored_candidates.sort(key=lambda item: item["score"], reverse=True)
        return Response(scored_candidates[:50])

class SwipeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SwipeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_id = serializer.validated_data['target_id']
        action = serializer.validated_data['action']
        target = get_object_or_404(CustomUser, id=target_id)

        if request.user.id == target.id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        swipe, created = Swipe.objects.get_or_create(
            actor=request.user,
            target=target,
            defaults={'action': action}
        )

        if not created:
            swipe.action = action
            swipe.save()

        is_match = False
        if action == Swipe.LIKE:
            has_liked_back = Swipe.objects.filter(
                actor=target,
                target=request.user,
                action=Swipe.LIKE
            ).exists()

            if has_liked_back:
                if not Match.objects.filter(users=request.user).filter(users=target).exists():
                    match = Match.objects.create()
                    match.users.add(request.user, target)
                    is_match = True

        return Response({"is_match": is_match}, status=status.HTTP_200_OK)

class MyMatchesView(generics.ListAPIView):
    serializer_class = MatchListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Match.objects.filter(users=self.request.user, is_active=True).distinct()

class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        match_id = self.kwargs['match_id']
        match = get_object_or_404(Match, id=match_id)
        if self.request.user not in match.users.all():
            return Message.objects.none()
        return Message.objects.filter(match=match)

    def perform_create(self, serializer):
        match_id = self.kwargs['match_id']
        match = get_object_or_404(Match, id=match_id)
        if self.request.user not in match.users.all():
            raise permissions.PermissionDenied()
        serializer.save(sender=self.request.user, match=match)

class GlobalChatStreamView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        def event_stream():
            last_msg = Message.objects.order_by('-id').first()
            last_id = last_msg.id if last_msg else 0

            while True:
                new_messages = Message.objects.filter(
                    match__users=request.user,
                    id__gt=last_id
                ).exclude(sender=request.user).order_by('id')

                for msg in new_messages:
                    data = MessageSerializer(msg, context={'request': request}).data
                    data['match_id'] = msg.match.id
                    yield f"data: {json.dumps(data)}\n\n"
                    last_id = msg.id

                time.sleep(1)
                yield ": keep-alive\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        return response