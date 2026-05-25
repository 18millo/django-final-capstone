from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status, generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt
import pyotp

from django.shortcuts import get_object_or_404
from common.permissions import IsSeller, IsPremium, IsAdmin
from .models import User, SiteContent, Follow, Notification, Message, Post, PostLike, PostComment, GalleryItem, GalleryLike, GalleryComment, PostCommentLike, Bookmark, Report, BlockedUser, PaymentInfo, PhoneVerificationCode, Group, GroupMember, GroupMessage
from .sms import send_sms
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
    GroupSerializer, GroupMemberSerializer, GroupMessageSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


ACCESS_CODE_ROLES = {'coach', 'gym_owner'}


def notify_admins_access_code(action, user, code):
    try:
        admins = User.objects.filter(is_staff=True, is_active=True)
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                actor=user,
                notification_type=Notification.Type.ACCESS_CODE_SENT,
                message=f'Access code {action} for {user.role.replace("_", " ")} {user.email}: {code}',
            )
    except Exception:
        pass


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
                notify_admins_access_code('created', user, code)
            except Exception:
                pass

        return Response(resp, status=status.HTTP_201_CREATED)


class SendEmailVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'detail': 'Email already verified', 'email_verified': True})
        from .models import EmailVerificationCode
        EmailVerificationCode.objects.filter(user=user, type='signup', is_used=False).update(is_used=True)
        code_obj = EmailVerificationCode.generate(user, 'signup')
        try:
            send_mail(
                subject='Verify your CombatHub email',
                message=(
                    f'Hi {user.username or user.email},\n\n'
                    f'Your email verification code is:\n\n'
                    f'   {code_obj.code}\n\n'
                    f'Enter this code on the verification page to confirm your email address.\n'
                    f'This code expires in 10 minutes.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'detail': 'Verification code sent to your email.'})
        except Exception:
            return Response({'error': 'Failed to send verification email. Try again.'}, status=500)


class VerifyEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        if not code:
            return Response({'error': 'Verification code is required'}, status=400)
        user = request.user
        if user.email_verified:
            return Response({'detail': 'Email already verified', 'email_verified': True})
        from .models import EmailVerificationCode
        code_obj = EmailVerificationCode.objects.filter(
            user=user, code=code, type='signup', is_used=False
        ).first()
        if not code_obj:
            return Response({'error': 'Invalid or expired code'}, status=400)
        if code_obj.is_expired:
            code_obj.is_used = True
            code_obj.save(update_fields=['is_used'])
            return Response({'error': 'Code has expired. Request a new one.'}, status=400)
        code_obj.is_used = True
        code_obj.save(update_fields=['is_used'])
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        return Response({'detail': 'Email verified!', 'email_verified': True})


class ChangeEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('email', '').strip()
        if not new_email:
            return Response({'error': 'Email is required'}, status=400)
        if User.objects.filter(email=new_email).exclude(id=request.user.id).exists():
            return Response({'error': 'This email is already in use'}, status=400)
        user = request.user
        user.email = new_email
        user.email_verified = False
        user.save(update_fields=['email', 'email_verified'])
        try:
            from .models import EmailVerificationCode
            EmailVerificationCode.objects.filter(user=user, type='signup', is_used=False).update(is_used=True)
            code_obj = EmailVerificationCode.generate(user, 'signup')
            send_mail(
                subject='Verify your new CombatHub email',
                message=(
                    f'Hi {user.username or user.email},\n\n'
                    f'Your email verification code is:\n\n'
                    f'   {code_obj.code}\n\n'
                    f'Enter this code on the verification page to confirm your new email address.\n'
                    f'This code expires in 10 minutes.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            pass
        return Response({'detail': 'Email updated. A verification code has been sent to your new email.', 'email_verified': False})


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
            notify_admins_access_code('regenerated', user, new_code)
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

        new_code = generate_access_code()
        user.profile.vendor_access_code = new_code
        user.profile.save(update_fields=['vendor_access_code'])
        try:
            send_mail(
                subject='Your New CombatHub Access Code',
                message=(
                    f'Hi {user.username or user.email},\n\n'
                    f'Your new access code is:\n\n'
                    f'   {new_code}\n\n'
                    f'Use this code the next time you sign in.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            notify_admins_access_code('rotated', user, new_code)
        except Exception:
            pass

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
            notify_admins_access_code('retrieved', user, code)
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

    def update(self, request, *args, **kwargs):
        uploaded_files = request.FILES
        if uploaded_files:
            data = {}
            for key in request.POST:
                data[key] = request.POST[key]
            for key in request.FILES:
                data[key] = request.FILES[key]
        else:
            data = request.data.copy() if hasattr(request.data, 'copy') else {**request.data}
        profile = {}
        for key in list(data.keys()):
            if key.startswith('profile[') and key.endswith(']'):
                field = key[8:-1]
                value = data.pop(key)
                if field == 'avatar' and key not in uploaded_files:
                    continue
                profile[field] = value
        if profile:
            data['profile'] = profile
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)


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
                    follower_count=Count('followers', distinct=True),
                    following_count=Count('following', distinct=True),
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
                    follower_count=Count('followers', distinct=True),
                    following_count=Count('following', distinct=True),
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
                    follower_count=Count('followers', distinct=True),
                    following_count=Count('following', distinct=True),
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
                        follower_count=Count('followers', distinct=True),
                        following_count=Count('following', distinct=True),
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
                    follower_count=Count('followers', distinct=True),
                    following_count=Count('following', distinct=True),
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
        if request.user.role in ('vendor', 'gym_owner'):
            return Response({'error': 'Vendors and gym owners cannot follow users'}, status=status.HTTP_403_FORBIDDEN)

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
        if request.user.role in ('vendor', 'gym_owner'):
            return Response({'error': 'Vendors and gym owners cannot unfollow users'}, status=status.HTTP_403_FORBIDDEN)

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
            last_text = ''
            if last:
                if last.image and not last.content:
                    last_text = '📷 Photo'
                elif last.image and last.content:
                    last_text = '📷 ' + last.content[:80]
                else:
                    last_text = last.content[:100]
            conversations.append({
                'user_id': partner.id,
                'username': partner.username or partner.display_name or partner.email,
                'avatar': avatar,
                'last_message': last_text,
                'last_message_time': last.created_at if last else None,
                'unread': unread,
                'online': online,
            })
        group_memberships = GroupMember.objects.filter(user=user, status='joined').select_related('group')
        for gm in group_memberships:
            group = gm.group
            last_msg = GroupMessage.objects.filter(group=group).order_by('-created_at').first()
            unread = GroupMessage.objects.filter(group=group, created_at__gt=gm.joined_at).exclude(sender=user).count()
            avatar = None
            if group.avatar:
                try:
                    avatar = request.build_absolute_uri(group.avatar.url)
                except:
                    pass
            conversations.append({
                'type': 'group',
                'group_id': group.id,
                'username': group.name,
                'avatar': avatar,
                'last_message': last_msg.content[:100] if last_msg and last_msg.content else ('📷 Photo' if last_msg and last_msg.image else ''),
                'last_message_time': last_msg.created_at if last_msg else group.created_at,
                'unread': unread,
                'member_count': group.members.filter(status='joined').count(),
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
        if recipient.messaging_blocked:
            return Response({'error': 'This user has been restricted from receiving messages.'}, status=status.HTTP_403_FORBIDDEN)
        if recipient.role == 'vendor' and not recipient.profile.messaging_enabled:
            return Response({'error': 'This vendor has not enabled messages. Contact them through their products or about page.'}, status=status.HTTP_403_FORBIDDEN)
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
        try:
            body = content or '📷 Image'
            send_mail(
                subject=f'New message from {request.user.username or request.user.email} on CombatHub',
                message=(
                    f'Hi {recipient.username or recipient.email},\n\n'
                    f'You have a new message from {request.user.username or request.user.email}:\n\n'
                    f'   "{body[:200]}"\n\n'
                    f'Reply at:\n'
                    f'{settings.FRONTEND_URL}/messages\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
        except Exception:
            pass
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PostListView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.select_related('author__profile').prefetch_related('likes', 'comments')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'vendor':
            raise permissions.exceptions.PermissionDenied(detail='Vendors cannot create forum posts')
        if user.role in ('gym_owner', 'coach') and not user.profile.is_premium:
            raise permissions.exceptions.PermissionDenied(detail='Premium subscription required to create posts')
        serializer.save(author=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.select_related('author__profile').prefetch_related('likes', 'comments')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Post.objects.filter(id=instance.id).update(view_count=models.F('view_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PostLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        vote_type = request.data.get('vote_type', 'like')
        existing = PostLike.objects.filter(post=post, user=request.user).first()
        if existing:
            if existing.vote_type == vote_type:
                existing.delete()
                return Response({'liked': False, 'disliked': False, 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})
            else:
                existing.vote_type = vote_type
                existing.save()
                return Response({'liked': vote_type == 'like', 'disliked': vote_type == 'dislike', 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})
        PostLike.objects.create(post=post, user=request.user, vote_type=vote_type)
        return Response({'liked': vote_type == 'like', 'disliked': vote_type == 'dislike', 'like_count': post.likes.filter(vote_type='like').count(), 'dislike_count': post.likes.filter(vote_type='dislike').count()})


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

        gallery = GalleryItem.objects.filter(caption__icontains=q).select_related('user__profile')[:5]
        gallery_data = [{'id': g.id, 'caption': g.caption[:100], 'type': 'gallery', 'image': g.image.url if g.image else None} for g in gallery]

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
        elif target_type == 'user':
            target_user = get_object_or_404(User, id=target_id)
            kwargs['description'] = f'[Reported User ID: {target_id}, Email: {target_user.email}] {description}'
        else:
            from products.models import ProductComment
            obj = get_object_or_404(ProductComment, id=target_id)
            kwargs['product_comment'] = obj
        report = Report.objects.create(**kwargs)
        try:
            target_url = request.build_absolute_uri('/')
            send_mail(
                subject=f'[CombatHub] New Report — {reason}',
                message=f'A new report has been submitted.\n\n'
                        f'Reporter: {request.user.email} (ID: {request.user.id})\n'
                        f'Reason: {reason}\n'
                        f'Target Type: {target_type}\n'
                        f'Target ID: {target_id}\n'
                        f'Description: {kwargs.get("description") or "N/A"}\n'
                        f'Report ID: {report.id}\n'
                        f'Status: Pending\n\n'
                        f'Review at: {target_url}admin/accounts/report/',
                from_email=None,
                recipient_list=['mungailevi1@gmail.com'],
                fail_silently=True,
            )
        except Exception:
            pass
        return Response({'id': report.id, 'status': 'pending'}, status=201)


class RemoveFollowerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        deleted, _ = Follow.objects.filter(follower=target, following=request.user).delete()
        if deleted:
            return Response({'detail': f'Removed follower {target.username or target.email}'})
        return Response({'detail': 'User was not following you'}, status=400)


class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, user_id):
        blocked = get_object_or_404(User, id=user_id)
        if blocked == request.user:
            return Response({'error': 'Cannot block yourself'}, status=400)
        Follow.objects.filter(follower=blocked, following=request.user).delete()
        Follow.objects.filter(follower=request.user, following=blocked).delete()
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


class SendPhoneCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(phone) < 8:
            return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

        PhoneVerificationCode.objects.filter(user=request.user, is_used=False).update(is_used=True)

        code_obj = PhoneVerificationCode.generate(request.user, phone)
        message = f'Your CombatHub verification code is: {code_obj.code}. It expires in 10 minutes.'
        sent = send_sms(phone, message)
        if not sent:
            return Response({'error': 'Failed to send SMS. Try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'detail': 'Verification code sent.'})


class VerifyPhoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        phone = request.data.get('phone', '').strip()
        if not code or not phone:
            return Response({'error': 'Code and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)

        code_obj = PhoneVerificationCode.objects.filter(
            user=request.user, phone=phone, code=code, is_used=False
        ).first()
        if not code_obj:
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)
        if code_obj.is_expired:
            code_obj.is_used = True
            code_obj.save(update_fields=['is_used'])
            return Response({'error': 'Code has expired. Request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        code_obj.is_used = True
        code_obj.save(update_fields=['is_used'])
        profile = request.user.profile
        from .models import Profile
        if Profile.objects.filter(phone=phone).exclude(user=request.user).exists():
            return Response({'error': 'This phone number is already in use by another account.'}, status=400)
        profile.phone = phone
        profile.phone_verified = True
        profile.save(update_fields=['phone', 'phone_verified'])
        return Response({'detail': 'Phone number verified successfully.', 'phone_verified': True})


class CoachDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsPremium]

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
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsPremium]

    def get(self, request):
        user = request.user
        if user.role != 'vendor':
            return Response({'error': 'Only vendors can access this'}, status=403)
        from products.models import Product
        products = Product.objects.filter(vendor=user)
        total_products = products.count()
        low_stock = products.filter(stock__lte=5)
        followers_qs = User.objects.filter(following__following=user)
        followers_data = []
        for f in followers_qs[:50]:
            avatar_url = None
            try:
                if hasattr(f, 'profile') and f.profile and f.profile.avatar:
                    avatar_url = resolve_avatar(f.profile, request)
            except Exception:
                pass
            followers_data.append({
                'id': f.id,
                'username': f.username or f.display_name or f.email,
                'avatar': avatar_url,
            })
        return Response({
            'total_products': total_products,
            'low_stock_count': low_stock.count(),
            'low_stock_products': list(low_stock.values('id', 'name', 'stock', 'price')),
            'follower_count': followers_qs.count(),
            'followers': followers_data,
        })


def is_profile_complete(user):
    profile = user.profile
    base_fields = [profile.bio, profile.avatar, profile.phone]
    if user.role == 'athlete':
        required = base_fields + [profile.weight_class, profile.height_ft, profile.height_in, profile.reach_in, profile.stance]
    elif user.role in ('vendor', 'gym_owner'):
        try:
            vp = user.vendor_profile
            biz_fields = [vp.business_name, vp.business_location, vp.business_description]
        except Exception:
            biz_fields = [profile.business_name, profile.business_location, profile.business_description]
        required = base_fields + biz_fields
    elif user.role == 'coach':
        required = base_fields + [profile.specialization, profile.certifications]
    else:
        required = base_fields
    return all(field for field in required)


class StartPremiumTrialView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if profile.is_premium:
            return Response({'error': 'You are already a premium member'}, status=400)
        if profile.premium_trial_started:
            return Response({'error': 'You have already used your free trial'}, status=400)
        if not is_profile_complete(request.user):
            return Response({'error': 'Please complete your profile (bio, avatar, phone, and role-specific fields) before activating premium.'}, status=400)
        if not request.user.email_verified:
            return Response({'error': 'Please verify your email address before activating premium.'}, status=400)
        if profile.premium_trial_used:
            return Response({'error': 'You have already used your free trial.'}, status=400)
        from django.utils import timezone
        now = timezone.now()
        profile.is_premium = True
        profile.premium_trial_started = now
        profile.premium_expires_at = now + timedelta(days=30)
        profile.premium_grace_end = None
        profile.save(update_fields=['is_premium', 'premium_trial_started', 'premium_expires_at', 'premium_grace_end'])
        Notification.objects.create(
            recipient=request.user,
            actor=request.user,
            notification_type='premium_activated',
            message='Welcome to Premium! Your one-month free trial is now active. Enjoy all premium features!',
        )
        return Response({
            'is_premium': True,
            'premium_trial_started': profile.premium_trial_started,
            'premium_expires_at': profile.premium_expires_at,
            'message': 'One-month premium trial activated!',
        })


class CheckPremiumView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        now = timezone.now()
        active = profile.is_premium_active()
        if profile.is_premium and not active:
            profile.is_premium = False
            profile.save(update_fields=['is_premium'])
            Notification.objects.create(
                recipient=request.user,
                actor=request.user,
                notification_type='premium_expired',
                message='Your premium subscription has ended. Renew to regain access to premium features.',
            )
        in_grace = bool(profile.premium_grace_end and profile.premium_grace_end > now and profile.premium_expires_at and profile.premium_expires_at < now)
        return Response({
            'is_premium': active,
            'email_verified': request.user.email_verified,
            'profile_complete': is_profile_complete(request.user),
            'premium_trial_used': profile.premium_trial_used,
            'show_views_publicly': profile.show_views_publicly,
            'trial_started': bool(profile.premium_trial_started),
            'premium_expires_at': profile.premium_expires_at,
            'premium_grace_end': profile.premium_grace_end,
            'in_grace_period': in_grace,
            'premium_features': [
                {'icon': '📷', 'title': 'Gallery Uploads', 'desc': 'Upload photos to the community gallery.'},
                {'icon': '⚡', 'title': 'Priority Support', 'desc': 'Get faster responses from our support team.'},
                {'icon': '🏪', 'title': 'Vendor Dashboard', 'desc': 'Sell products with a dedicated vendor storefront.'},
                {'icon': '📊', 'title': 'Advanced Analytics', 'desc': 'View detailed stats on your profile and content.'},
                {'icon': '💎', 'title': 'Premium Badge', 'desc': 'Stand out with a verified premium badge on your profile.'},
                {'icon': '🎯', 'title': 'Exclusive Content', 'desc': 'Access to premium-only content and features.'},
                {'icon': '🛡️', 'title': 'Early Access', 'desc': 'Be the first to try new features before anyone else.'},
                {'icon': '📱', 'title': 'Custom Profile', 'desc': 'Customize your profile with premium themes and layouts.'},
            ],
        })


class PaymentSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if profile.is_premium:
            return Response({'error': 'You are already a premium member'}, status=400)
        if not is_profile_complete(request.user):
            return Response({'error': 'Please complete your profile (bio, avatar, phone, and role-specific fields) before activating premium.'}, status=400)
        if not request.user.email_verified:
            return Response({'error': 'Please verify your email address before activating premium.'}, status=400)
        if profile.premium_trial_used:
            return Response({'error': 'You have already used your free trial. Premium re-subscription is not available at this time.'}, status=400)
        from .serializers import PaymentInfoSerializer
        serializer = PaymentInfoSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        PaymentInfo.objects.update_or_create(
            user=request.user,
            defaults=serializer.validated_data,
        )
        plan = request.data.get('plan', 'monthly')
        if plan == 'yearly':
            days = 365
            plan_label = 'yearly'
        else:
            days = 30
            plan_label = 'monthly'
        now = timezone.now()
        profile.is_premium = True
        profile.premium_trial_started = now
        profile.premium_expires_at = now + timedelta(days=days)
        profile.premium_grace_end = None
        profile.save(update_fields=['is_premium', 'premium_trial_started', 'premium_expires_at', 'premium_grace_end'])
        Notification.objects.create(
            recipient=request.user,
            actor=request.user,
            notification_type='premium_activated',
            message=f'Welcome to Premium! Your {plan_label} subscription is now active. Enjoy all premium features!',
        )
        return Response({
            'is_premium': True,
            'premium_trial_started': profile.premium_trial_started,
            'premium_expires_at': profile.premium_expires_at,
            'message': f'Payment info saved and {plan_label} subscription activated!',
        })


class GymOwnerDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsPremium]

    def get(self, request):
        user = request.user
        if user.role != 'gym_owner':
            return Response({'error': 'Only gym owners can access this'}, status=403)
        followers = User.objects.filter(following__following=user)
        total_followers = followers.count()
        recent_followers = followers.order_by('-following__created_at')[:5]
        from .serializers import PublicUserSerializer
        return Response({
            'total_followers': total_followers,
            'total_posts': Post.objects.filter(author=user).count(),
            'recent_followers': PublicUserSerializer(recent_followers, many=True, context={'request': request}).data,
        })


class ToggleInsightsVisibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPremium]

    def post(self, request):
        profile = request.user.profile
        profile.show_views_publicly = not profile.show_views_publicly
        profile.save(update_fields=['show_views_publicly'])
        return Response({'show_views_publicly': profile.show_views_publicly})


class CancelPremiumView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if not profile.is_premium:
            return Response({'error': 'You do not have an active premium subscription'}, status=400)
        profile.is_premium = False
        profile.premium_trial_started = None
        profile.premium_expires_at = None
        profile.premium_grace_end = None
        profile.premium_trial_used = True
        profile.save(update_fields=['is_premium', 'premium_trial_started', 'premium_expires_at', 'premium_grace_end', 'premium_trial_used'])
        Notification.objects.create(
            recipient=request.user,
            actor=request.user,
            notification_type='premium_expired',
            message='Your premium subscription has been cancelled. You can re-subscribe anytime.',
        )
        return Response({'message': 'Premium cancelled successfully', 'is_premium': False})


class AdminUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all().select_related('profile').order_by('-created_at')
        data = [{
            'id': u.id,
            'email': u.email,
            'username': u.username or u.display_name or '',
            'role': u.role,
            'is_premium': u.profile.is_premium if hasattr(u, 'profile') else False,
            'is_active': u.is_active,
            'messaging_blocked': u.messaging_blocked,
            'date_joined': u.created_at,
        } for u in users]
        return Response(data)


class AdminUpdateUserRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        role = request.data.get('role')
        valid_roles = ['athlete', 'coach', 'gym_owner', 'vendor', 'admin']
        if role not in valid_roles:
            return Response({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}, status=400)
        user = get_object_or_404(User, id=user_id)
        user.role = role
        user.save(update_fields=['role'])
        return Response({'detail': f'Updated {user.email} role to {role}'})


class AdminToggleMessagingBlockView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        target.messaging_blocked = not target.messaging_blocked
        target.save(update_fields=['messaging_blocked'])
        return Response({'messaging_blocked': target.messaging_blocked})


class GroupListView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Group.objects.filter(
            models.Q(is_private=False) | models.Q(members__user=user)
        ).distinct().prefetch_related('members__user__profile')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ('gym_owner', 'coach'):
            raise PermissionDenied('Only gym owners and coaches can create groups')
        if not user.profile.is_premium_active():
            raise PermissionDenied('Premium subscription required to create groups')
        group = serializer.save(created_by=user)
        GroupMember.objects.create(group=group, user=user, role='admin', status='joined')

    def get_serializer_context(self):
        return {'request': self.request}


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.prefetch_related('members__user__profile')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        group = self.get_object()
        if group.created_by != self.request.user:
            raise PermissionDenied('Only the group creator can edit this group')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise PermissionDenied('Only the group creator can delete this group')
        instance.delete()


class GroupJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        user = request.user
        existing = GroupMember.objects.filter(group=group, user=user).first()
        if existing:
            if existing.status == 'joined':
                return Response({'error': 'You are already a member of this group'}, status=400)
            if existing.status == 'pending':
                return Response({'error': 'Your join request is pending approval'}, status=400)
            if existing.status == 'invited':
                existing.status = 'joined'
                existing.save(update_fields=['status'])
                return Response({'detail': 'You joined the group'})
        if group.members.filter(status='joined').count() >= group.max_members:
            return Response({'error': f'This group has reached its maximum capacity of {group.max_members} members'}, status=400)
        if group.is_private:
            GroupMember.objects.create(group=group, user=user, status='pending')
            return Response({'detail': 'Join request sent. Waiting for approval.'})
        GroupMember.objects.create(group=group, user=user, status='joined')
        return Response({'detail': 'You joined the group'})


class GroupLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        gm = get_object_or_404(GroupMember, group=group, user=request.user, status='joined')
        gm.delete()
        return Response({'detail': 'You left the group'})


class GroupMembersView(generics.ListAPIView):
    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GroupMember.objects.filter(
            group_id=self.kwargs['group_id'], status='joined'
        ).select_related('user__profile')


class GroupRemoveMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        if group.created_by != request.user:
            raise PermissionDenied('Only the group creator can remove members')
        target = get_object_or_404(User, id=user_id)
        gm = get_object_or_404(GroupMember, group=group, user=target, status='joined')
        gm.delete()
        return Response({'detail': f'Removed {target.username} from the group'})


class GroupRequestsView(generics.ListAPIView):
    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group = get_object_or_404(Group, id=self.kwargs['group_id'])
        if group.created_by != self.request.user:
            return GroupMember.objects.none()
        return GroupMember.objects.filter(group=group, status='pending').select_related('user__profile')


class GroupApproveRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        if group.created_by != request.user:
            raise PermissionDenied('Only the group creator can approve requests')
        gm = get_object_or_404(GroupMember, group=group, user_id=user_id, status='pending')
        if group.members.filter(status='joined').count() >= group.max_members:
            gm.delete()
            return Response({'error': f'Group is full (max {group.max_members} members)'}, status=400)
        gm.status = 'joined'
        gm.save(update_fields=['status'])
        return Response({'detail': 'Join request approved'})


class GroupRejectRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        if group.created_by != request.user:
            raise PermissionDenied('Only the group creator can reject requests')
        gm = get_object_or_404(GroupMember, group=group, user_id=user_id, status='pending')
        gm.delete()
        return Response({'detail': 'Join request rejected'})


class GroupInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        if group.created_by != request.user:
            raise PermissionDenied('Only the group creator can invite users')
        username = request.data.get('username', '').strip()
        target = get_object_or_404(User, username=username)
        if GroupMember.objects.filter(group=group, user=target).exists():
            return Response({'error': 'User is already a member or has a pending request'}, status=400)
        if group.members.filter(status='joined').count() >= group.max_members:
            return Response({'error': f'Group is full (max {group.max_members} members)'}, status=400)
        GroupMember.objects.create(group=group, user=target, status='invited')
        return Response({'detail': f'Invited {username} to the group'})


class GroupMessageListView(generics.ListAPIView):
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group = get_object_or_404(Group, id=self.kwargs['group_id'])
        if not group.members.filter(user=self.request.user, status='joined').exists():
            return GroupMessage.objects.none()
        return GroupMessage.objects.filter(group=group).select_related('sender__profile')

    def get_serializer_context(self):
        return {'request': self.request}


class GroupMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        if not group.members.filter(user=request.user, status='joined').exists():
            return Response({'error': 'You are not a member of this group'}, status=403)
        content = request.data.get('content', '').strip()
        image_file = request.FILES.get('image', None)
        if not content and not image_file:
            return Response({'error': 'Message cannot be empty'}, status=400)
        msg = GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=content or '',
        )
        if image_file:
            msg.image.save(image_file.name, image_file, save=False)
            msg.save()
        return Response(GroupMessageSerializer(msg, context={'request': request}).data, status=201)
