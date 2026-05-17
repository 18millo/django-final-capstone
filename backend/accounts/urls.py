from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('google/', views.GoogleAuthView.as_view(), name='google-auth'),
    path('set-username/', views.SetUsernameView.as_view(), name='set-username'),
    path('password-reset/', views.PasswordResetView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('me/following/', views.FollowingListView.as_view(), name='following-list'),
    path('me/followers/', views.FollowersListView.as_view(), name='followers-list'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.PublicProfileView.as_view(), name='public-profile'),
    path('users/<int:user_id>/follow/', views.FollowUserView.as_view(), name='follow-user'),
    path('users/<int:user_id>/unfollow/', views.UnfollowUserView.as_view(), name='unfollow-user'),
    path('site-content/<slug:key>/', views.SiteContentView.as_view(), name='site-content'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', views.UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all/', views.MarkAllNotificationsReadView.as_view(), name='notification-read-all'),
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:user_id>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:user_id>/send/', views.SendMessageView.as_view(), name='conversation-send'),
]
