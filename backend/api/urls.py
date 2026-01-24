from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    RegisterView,
    UserProfileView,
    PotentialMatchesView,
    SwipeView,
    MyMatchesView,
    MessageListView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('user/profile/', UserProfileView.as_view(), name='profile'),

    path('dating/feed/', PotentialMatchesView.as_view(), name='potential_matches'),
    path('dating/swipe/', SwipeView.as_view(), name='swipe'),
    path('dating/matches/', MyMatchesView.as_view(), name='my_matches'),

    path('chat/<int:match_id>/messages/', MessageListView.as_view(), name='match_messages'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)