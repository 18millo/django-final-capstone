from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt
import pyotp

from django.shortcuts import get_object_or_404
from .models import User, SiteContent, Follow, Notification, Message, Post, PostLike, PostComment, GalleryItem, GalleryLike, GalleryComment, PostCommentLike, Bookmark, Report, BlockedUser
from .serializers import (
    RegisterSerializer, LoginSerializer, GoogleAuthSerializer,
    SetUsernameSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer, UserSerializer, SiteContentSerializer,
    PublicUserSerializer, FollowSerializer, NotificationSerializer, MessageSerializer,
    ConversationSerializer, TotpSetupSerializer, TotpVerifySerializer, TotpLoginSerializer,
    AccessCodeLoginSerializer, RetrieveAccessCodeSerializer, generate_access_code, resolve_avatar,
    PostSerializer, PostCommentSerializer,
    GalleryItemSerializer, GalleryCommentSerializer,
    BookmarkSerializer, ReportSerializer, BlockedUserSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


ACCESS_CODE_ROLES = {'vendor', 'coach', 'gym_owner'}


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        user = serializer.instance
        tokens = get_tokens_for_user(user)

        profile = user.profile
        profile.accepted_terms = True
        profile.accepted_terms_at = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ip:
            ip = ip.split(',')[0].strip()
            import hashlib
            profile.accepted_terms_ip = hashlib.sha256(ip.encode()).hexdigest()
        profile.save()

        from .moderation import flag_content
        flag_content(user, 'user', user.id, user.username or '')

        resp = {
            'user': UserSerializer(user).data,
            'tokens': tokens,
        }

        if user.role in ACCESS_CODE_ROLES:
            code = user.profile.vendor_access_code
            resp['vendor_access_code'] = code
            try:
                send_mail(
                    subject='Your CombatHub Access Code',
                    message=(
                        f'Hi {user.username or user.email},\n\n'
                        f'Your access code for your {user.role.replace("_", " ")} account is:\n\n'
                        f'   {code}\n\n'
                        f'Keep this code safe. You will need it to sign in.\n\n'
                        f'If you ever lose this code, you can retrieve it at:\n'
                        f'{settings.FRONTEND_URL}/retrieve-access-code\n\n'
                        f'- The CombatHub Team'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                pass

        return Response(resp, status=status.HTTP_201_CREATED)



class RegenerateAccessCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RetrieveAccessCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        new_code = generate_access_code()
        user.profile.vendor_access_code = new_code
        user.profile.save()

        try:
            send_mail(
                subject='Your New CombatHub Access Code',
                message=(
                    f'Hi {user.username or user.email},\n\n'
                    f'Your access code has been reset. Your new code is:\n\n'
                    f'   {new_code}\n\n'
                    f'Keep this code safe. You will need it to sign in.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'detail': f'New access code sent to {user.email}.'})
        except Exception as e:
            return Response(
                {'error': 'Failed to send email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if not user.is_active:
            return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        if user.role in ACCESS_CODE_ROLES and user.profile.vendor_access_code:
            return Response({
                'requires_access_code': True,
                'email': user.email,
            })

        if user.totp_enabled:
            return Response({
                'requires_2fa': True,
                'email': user.email,
            })

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


class AccessCodeVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AccessCodeLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if not user.is_active:
            return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        if user.totp_enabled:
            return Response({
                'requires_2fa': True,
                'email': user.email,
            })

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


class RetrieveAccessCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RetrieveAccessCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        code = user.profile.vendor_access_code

        try:
            send_mail(
                subject='Your CombatHub Access Code',
                message=(
                    f'Hi {user.username or user.email},\n\n'
                    f'Your access code for your {user.role.replace("_", " ")} account is:\n\n'
                    f'   {code}\n\n'
                    f'Keep this code safe. You will need it to sign in.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'detail': f'Access code sent to {user.email}.'})
        except Exception as e:
            return Response(
                {'error': 'Failed to send email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TotpSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TotpSetupSerializer

    def post(self, request):
        user = request.user
        if user.totp_enabled:
            return Response({'error': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.save()

        issuer = 'CombatHub'
        uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)

        return Response({
            'secret': secret,
            'uri': uri,
        })


class TotpVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.totp_enabled:
            return Response({'error': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.totp_secret:
            return Response({'error': 'No TOTP secret found. Call /auth/2fa/setup/ first.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TotpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(serializer.validated_data['code'], valid_window=1):
            return Response({'error': 'Invalid code. Try again.'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = True
        user.save()

        return Response({
            'detail': '2FA enabled successfully.',
            'totp_enabled': True,
        })


class TotpLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TotpLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


class TotpDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.totp_enabled:
            return Response({'error': '2FA is not enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TotpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(serializer.validated_data['code'], valid_window=1):
            return Response({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_secret = ''
        user.totp_enabled = False
        user.save()

        return Response({'detail': '2FA disabled.'})


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
                fail_silently=False,
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
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['username', 'display_name', 'role', 'profile__bio']
    ordering_fields = ['follower_count', 'created_at', 'username']
    ordering = ['-follower_count']
    filterset_fields = ['role']

    def get_queryset(self):
        user = self.request.user
        return (User.objects.filter(is_active=True)
                .exclude(role='admin')
                .select_related('profile')
                .annotate(
                    _follower_count=Count('followers', distinct=True),
                    _following_count=Count('following', distinct=True),
                )
                .prefetch_related(
                    Prefetch('followers',
                        queryset=Follow.objects.filter(follower=user),
                        to_attr='_user_followers'
                    )
                ))

    def get_serializer_context(self):
        return {'request': self.request}


class CoachListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (User.objects.filter(is_active=True, role='coach')
                .select_related('profile')
                .annotate(
                    _follower_count=Count('followers', distinct=True),
                    _following_count=Count('following', distinct=True),
                )
                .prefetch_related(
                    Prefetch('followers',
                        queryset=Follow.objects.filter(follower=user),
                        to_attr='_user_followers'
                    )
                ))

    def get_serializer_context(self):
        return {'request': self.request}


class VendorListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (User.objects.filter(is_active=True, role='vendor')
                .select_related('profile')
                .annotate(
                    _follower_count=Count('followers', distinct=True),
                    _following_count=Count('following', distinct=True),
                ))

    def get_serializer_context(self):
        return {'request': self.request}


class VendorDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            user = (User.objects
                    .select_related('profile')
                    .annotate(
                        _follower_count=Count('followers', distinct=True),
                        _following_count=Count('following', distinct=True),
                    )
                    .get(pk=pk, role='vendor', is_active=True))
        except User.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=404)

        from products.serializers import ProductListSerializer
        products = user.products.all()
        product_serializer = ProductListSerializer(products, many=True, context={'request': request})

        return Response({
            'vendor': PublicUserSerializer(user, context={'request': request}).data,
            'products': product_serializer.data,
        })


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (User.objects.filter(is_active=True)
                .exclude(role='admin')
                .select_related('profile')
                .annotate(
                    _follower_count=Count('followers', distinct=True),
                    _following_count=Count('following', distinct=True),
                )
                .prefetch_related(
                    Prefetch('followers',
                        queryset=Follow.objects.filter(follower=user),
                        to_attr='_user_followers'
                    )
                ))

    def get_serializer_context(self):
        return {'request': self.request}


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role == 'vendor':
            return Response({'error': 'Vendors cannot follow users'}, status=status.HTTP_403_FORBIDDEN)

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
            if channel_layer:
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
        if request.user.role == 'vendor':
            return Response({'error': 'Vendors cannot unfollow users'}, status=status.HTTP_403_FORBIDDEN)

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
            online = False
            try:
                avatar = resolve_avatar(partner.profile, request)
                if partner.profile.last_seen and (timezone.now() - partner.profile.last_seen).total_seconds() < 60:
                    online = True
            except:
                pass
            conversations.append({
                'user_id': partner.id,
                'username': partner.username or partner.display_name or partner.email,
                'avatar': avatar,
                'last_message': last.content[:100] if last else '',
                'last_message_time': last.created_at if last else None,
                'unread': unread,
                'online': online,
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
        view_once = request.data.get('view_once', False)
        image_file = request.FILES.get('image', None)
        if not content and not image_file:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        msg = Message.objects.create(
            sender=request.user,
            recipient=recipient,
            content=content or '',
            view_once=bool(view_once),
        )
        if image_file:
            msg.image.save(image_file.name, image_file, save=False)
            msg.save()
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PostListView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.select_related('author__profile').prefetch_related('likes', 'comments')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.select_related('author__profile').prefetch_related('likes', 'comments')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class PostLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        vote_type = request.data.get('vote_type', 'like')
        existing = PostLike.objects.filter(post=post, user=request.user).first()
        if existing:
            if existing.vote_type == vote_type:
                existing.delete()
                return Response({'liked': False, 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})
            else:
                existing.vote_type = vote_type
                existing.save()
                return Response({'liked': vote_type == 'like', 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})
        PostLike.objects.create(post=post, user=request.user, vote_type=vote_type)
        return Response({'liked': vote_type == 'like', 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})


class PostCommentCreateView(generics.CreateAPIView):
    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        serializer.save(author=self.request.user, post=post)

    def get_serializer_context(self):
        return {'request': self.request}


class PostCommentListView(generics.ListAPIView):
    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PostComment.objects.filter(post_id=self.kwargs['post_id'], parent__isnull=True).select_related('author__profile').prefetch_related('replies__author__profile')

    def get_serializer_context(self):
        return {'request': self.request}


class GalleryListView(generics.ListCreateAPIView):
    serializer_class = GalleryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GalleryItem.objects.select_related('user__profile').prefetch_related('likes', 'comments')

    def perform_create(self, serializer):
        if not self.request.user.profile.is_premium:
            raise permissions.exceptions.PermissionDenied(detail='Premium subscription required to upload to gallery')
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class GalleryDetailView(generics.RetrieveAPIView):
    queryset = GalleryItem.objects.select_related('user__profile').prefetch_related('likes', 'comments')
    serializer_class = GalleryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class GalleryLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        item = get_object_or_404(GalleryItem, id=pk)
        vote_type = request.data.get('vote_type', 'like')
        existing = GalleryLike.objects.filter(gallery_item=item, user=request.user).first()
        if existing:
            if existing.vote_type == vote_type:
                existing.delete()
                return Response({'liked': False, 'like_count': item.likes.filter(vote_type='like').count(), 'dislike_count': item.likes.filter(vote_type='dislike').count()})
            else:
                existing.vote_type = vote_type
                existing.save()
                return Response({'liked': vote_type == 'like', 'like_count': item.likes.filter(vote_type='like').count(), 'dislike_count': item.likes.filter(vote_type='dislike').count()})
        GalleryLike.objects.create(gallery_item=item, user=request.user, vote_type=vote_type)
        return Response({'liked': vote_type == 'like', 'like_count': item.likes.filter(vote_type='like').count(), 'dislike_count': item.likes.filter(vote_type='dislike').count()})


class GalleryCommentCreateView(generics.CreateAPIView):
    serializer_class = GalleryCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        item = get_object_or_404(GalleryItem, id=self.kwargs['pk'])
        serializer.save(user=self.request.user, gallery_item=item)

    def get_serializer_context(self):
        return {'request': self.request}


class GalleryCommentListView(generics.ListAPIView):
    serializer_class = GalleryCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GalleryComment.objects.filter(gallery_item_id=self.kwargs['pk'], parent__isnull=True).select_related('user__profile').prefetch_related('replies__user__profile')

    def get_serializer_context(self):
        return {'request': self.request}


class SearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        q = request.GET.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        users = User.objects.filter(models.Q(username__icontains=q) | models.Q(display_name__icontains=q) | models.Q(email__icontains=q))[:5]
        user_data = [{'id': u.id, 'username': u.username or u.display_name, 'type': 'user', 'avatar': resolve_avatar(u.profile, request)} for u in users]

        posts = Post.objects.filter(content__icontains=q).prefetch_related('likes')[:5]
        post_data = [{'id': p.id, 'content': p.content[:100], 'type': 'post', 'author': p.author.username or p.author.display_name} for p in posts]

        gallery = GalleryItem.objects.filter(caption__icontains=q)[:5]
        gallery_data = [{'id': g.id, 'caption': g.caption[:100], 'type': 'gallery', 'image': resolve_avatar(g.user.profile, request) if g.user.profile.avatar else None} for g in gallery]

        from products.models import Product
        products = Product.objects.filter(models.Q(name__icontains=q) | models.Q(brand__icontains=q) | models.Q(description__icontains=q))[:5]
        product_data = [{'id': p.id, 'name': p.name, 'type': 'product', 'brand': p.brand, 'price': str(p.price), 'image': (p.images[0] if p.images else None)} for p in products]

        return Response({'users': user_data, 'posts': post_data, 'gallery': gallery_data, 'products': product_data})


class BookmarkToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        post_id = request.data.get('post_id')
        gallery_id = request.data.get('gallery_id')
        product_id = request.data.get('product_id')
        if post_id:
            post = get_object_or_404(Post, id=post_id)
            bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
            if not created:
                bookmark.delete()
                return Response({'bookmarked': False})
            return Response({'bookmarked': True})
        if gallery_id:
            item = get_object_or_404(GalleryItem, id=gallery_id)
            bookmark, created = Bookmark.objects.get_or_create(user=request.user, gallery_item=item)
            if not created:
                bookmark.delete()
                return Response({'bookmarked': False})
            return Response({'bookmarked': True})
        if product_id:
            bookmark, created = Bookmark.objects.get_or_create(user=request.user, product_id=product_id)
            if not created:
                bookmark.delete()
                return Response({'bookmarked': False})
            return Response({'bookmarked': True})
        return Response({'error': 'No target provided'}, status=400)


class BookmarkListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        bookmarks = Bookmark.objects.filter(user=request.user).select_related('post', 'gallery_item')[:20]
        data = []
        for b in bookmarks:
            item = {'id': b.id, 'type': 'post' if b.post else 'gallery' if b.gallery_item else 'product', 'created_at': b.created_at}
            if b.post:
                item['post_id'] = b.post.id
                item['content'] = b.post.content[:100]
            elif b.gallery_item:
                item['gallery_id'] = b.gallery_item.id
                item['caption'] = b.gallery_item.caption
            else:
                item['product_id'] = b.product_id
            data.append(item)
        return Response(data)


class CreateReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        reason = request.data.get('reason')
        description = request.data.get('description', '')
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        if not reason or not target_type or not target_id:
            return Response({'error': 'Missing required fields'}, status=400)
        kwargs = {'reporter': request.user, 'reason': reason, 'description': description}
        target_model = {'post': Post, 'post_comment': PostComment, 'gallery_item': GalleryItem, 'gallery_comment': GalleryComment}
        if target_type in target_model:
            obj = get_object_or_404(target_model[target_type], id=target_id)
            kwargs[target_type] = obj
        else:
            from products.models import ProductComment
            obj = get_object_or_404(ProductComment, id=target_id)
            kwargs['product_comment'] = obj
        report = Report.objects.create(**kwargs)
        return Response({'id': report.id, 'status': 'pending'}, status=201)


class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, user_id):
        blocked = get_object_or_404(User, id=user_id)
        if blocked == request.user:
            return Response({'error': 'Cannot block yourself'}, status=400)
        block, created = BlockedUser.objects.get_or_create(blocker=request.user, blocked=blocked)
        if not created:
            block.delete()
            return Response({'blocked': False})
        return Response({'blocked': True})


class BlockedUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        blocked = BlockedUser.objects.filter(blocker=request.user).select_related('blocked')
        data = [{'id': b.blocked.id, 'username': b.blocked.username or b.blocked.display_name or b.blocked.email} for b in blocked]
        return Response(data)


class MessageEditView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, pk):
        msg = get_object_or_404(Message, id=pk, sender=request.user)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content required'}, status=400)
        msg.content = content
        msg.save()
        from .serializers import MessageSerializer
        return Response(MessageSerializer(msg).data)


class MessageDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        msg = get_object_or_404(Message, id=pk, sender=request.user)
        msg.content = '[deleted]'
        msg.save()
        return Response(status=204)


class MessageViewOnceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        msg = get_object_or_404(Message, id=pk, recipient=request.user, view_once=True)
        if msg.viewed:
            return Response({'viewed': True, 'content': '[View once message has been viewed and is no longer available]'})
        msg.viewed = True
        msg.save(update_fields=['viewed'])
        from .serializers import MessageSerializer
        return Response(MessageSerializer(msg, context={'request': request}).data)


class CoachDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'coach':
            return Response({'error': 'Only coaches can access this'}, status=403)
        followers = User.objects.filter(following__following=user)
        total_followers = followers.count()
        recent_followers = followers.order_by('-following__created_at')[:5]
        from .serializers import PublicUserSerializer
        return Response({
            'total_followers': total_followers,
            'total_posts': Post.objects.filter(author=user).count(),
            'recent_followers': PublicUserSerializer(recent_followers, many=True, context={'request': request}).data,
        })


class VendorDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'vendor':
            return Response({'error': 'Only vendors can access this'}, status=403)
        from products.models import Product
        products = Product.objects.filter(vendor=user)
        total_products = products.count()
        low_stock = products.filter(stock__lte=5)
        return Response({
            'total_products': total_products,
            'low_stock_count': low_stock.count(),
            'low_stock_products': list(low_stock.values('id', 'name', 'stock', 'price')),
        })
