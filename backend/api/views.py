from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import CustomUser, Match, Swipe, Message
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    DatingProfileSerializer,
    SwipeActionSerializer,
    MatchListSerializer,
    MessageSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

class PotentialMatchesView(generics.ListAPIView):
    serializer_class = DatingProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        swiped_ids = Swipe.objects.filter(actor=user).values_list('target_id', flat=True)
        return CustomUser.objects.exclude(
            id__in=swiped_ids
        ).exclude(
            id=user.id
        ).exclude(
            role='admin'
        ).order_by('?')

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