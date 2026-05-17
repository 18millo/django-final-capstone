from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt

from .models import User, SiteContent, Follow, Notification, Message
from .serializers import (
    RegisterSerializer, LoginSerializer, GoogleAuthSerializer,
    SetUsernameSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer, UserSerializer, SiteContentSerializer,
    PublicUserSerializer, FollowSerializer, NotificationSerializer, MessageSerializer,
    ConversationSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            info = id_token.verify_oauth2_token(
                serializer.validated_data['credential'],
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        email = info.get('email')
        google_id = info.get('sub')
        name = info.get('name', '')

        try:
            user = User.objects.get(email=email)
            if not user.google_id:
                user.google_id = google_id
                user.save()
            is_new = False
        except User.DoesNotExist:
            user = User.objects.create(
                email=email,
                google_id=google_id,
                display_name=name,
                is_active=True,
            )
            is_new = True

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'is_new_google_user': is_new and not user.username,
        })


class SetUsernameView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SetUsernameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.username = serializer.validated_data['username']
        request.user.save()
        return Response(UserSerializer(request.user).data)


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            token = RefreshToken.for_user(user)
            reset_token = str(token.access_token)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
            send_mail(
                subject='Password Reset - CombatHub',
                message=f'Click here to reset your password: {reset_link}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass

        return Response({'message': 'If an account with that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = jwt.decode(
                serializer.validated_data['token'],
                settings.SECRET_KEY,
                algorithms=['HS256'],
            )
            user = User.objects.get(pk=payload['user_id'])
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password reset successful.'})
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.filter(is_active=True).exclude(role='admin')
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_active=True).exclude(role='admin')
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            target = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

        Follow.objects.get_or_create(follower=request.user, following=target)
        Notification.objects.create(
            recipient=target,
            actor=request.user,
            notification_type='follow',
            message=f'{request.user.username or request.user.email} started following you.',
        )

        actor_name = request.user.username or request.user.email or 'Someone'
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{target.id}_notifications',
                {
                    'type': 'notify_follow',
                    'actor': request.user.id,
                    'actor_name': actor_name,
                }
            )
        except Exception:
            pass

        return Response({'detail': f'Following {target.username or target.email}'})


class UnfollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            target = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = Follow.objects.filter(follower=request.user, following=target).delete()
        if deleted:
            return Response({'detail': f'Unfollowed {target.username or target.email}'})
        return Response({'detail': 'Not following this user'}, status=status.HTTP_400_BAD_REQUEST)


class FollowingListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return User.objects.filter(followers__follower=self.request.user)


class FollowersListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return User.objects.filter(following__following=self.request.user)


class SiteContentView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, key):
        try:
            content = SiteContent.objects.get(key=key)
            return Response(SiteContentSerializer(content).data)
        except SiteContent.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, read=False).count()
        return Response({'count': count})


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.read = True
            notif.save()
            return Response({'detail': 'marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, read=False).update(read=True)
        return Response({'detail': 'all marked as read'})


class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        sent = Message.objects.filter(sender=user).values_list('recipient_id', flat=True)
        received = Message.objects.filter(recipient=user).values_list('sender_id', flat=True)
        user_ids = set(list(sent) + list(received))
        conversations = []
        for uid in user_ids:
            partner = User.objects.filter(id=uid).first()
            if not partner:
                continue
            last = Message.objects.filter(
                models.Q(sender=user, recipient=partner) | models.Q(sender=partner, recipient=user)
            ).first()
            unread = Message.objects.filter(sender=partner, recipient=user, read=False).count()
            avatar = None
            try:
                if partner.profile.avatar:
                    avatar = partner.profile.avatar.url
            except:
                pass
            conversations.append({
                'user_id': partner.id,
                'username': partner.username or partner.display_name or partner.email,
                'avatar': avatar,
                'last_message': last.content[:100] if last else '',
                'last_message_time': last.created_at if last else None,
                'unread': unread,
            })
        conversations.sort(key=lambda c: c['last_message_time'] or '', reverse=True)
        return Response(conversations)


class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            partner = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        messages = Message.objects.filter(
            models.Q(sender=request.user, recipient=partner) | models.Q(sender=partner, recipient=request.user)
        )[:100]
        Message.objects.filter(sender=partner, recipient=request.user, read=False).update(read=True)
        return Response(MessageSerializer(messages, many=True).data)


class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            recipient = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        msg = Message.objects.create(
            sender=request.user,
            recipient=recipient,
            content=content,
        )
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
