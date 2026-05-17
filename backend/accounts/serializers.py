import secrets
import string
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from .models import User, Profile, UsernameChange, SiteContent, Follow, Notification, Message


ACCESS_CODE_ROLES = {'vendor', 'coach', 'gym_owner'}

def generate_access_code():
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=True)
    vendor_access_code = serializers.CharField(read_only=True, source='profile.vendor_access_code')

    # vendor fields
    business_name = serializers.CharField(required=False, allow_blank=True)
    business_location = serializers.CharField(required=False, allow_blank=True)
    business_description = serializers.CharField(required=False, allow_blank=True)

    # coach fields
    specialization = serializers.CharField(required=False, allow_blank=True)
    certifications = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'role', 'vendor_access_code',
            'business_name', 'business_location', 'business_description',
            'specialization', 'certifications',
        )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        try:
            import dns.resolver
            domain = value.split('@')[1]
            dns.resolver.resolve(domain, 'MX', lifetime=5)
        except dns.resolver.NoAnswer:
            try:
                dns.resolver.resolve(domain, 'A', lifetime=5)
            except Exception:
                raise serializers.ValidationError("Email domain does not appear to be valid.")
        except Exception:
            raise serializers.ValidationError("Email domain does not appear to be valid.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        profile_fields = [
            'business_name', 'business_location', 'business_description',
            'specialization', 'certifications',
        ]
        profile_data = {f: validated_data.pop(f, '') for f in profile_fields}

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.display_name = validated_data.get('username', '')
        user.is_active = True
        user.set_password(password)
        user.save()

        profile = user.profile
        for attr, value in profile_data.items():
            if value:
                setattr(profile, attr, value)
        if user.role in ACCESS_CODE_ROLES:
            profile.vendor_access_code = generate_access_code()
        profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        login = data.get('login')
        password = data.get('password')

        try:
            if '@' in login:
                user = User.objects.get(email=login)
            else:
                user = User.objects.get(username=login)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")

        user = authenticate(username=user.email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        data['user'] = user
        return data


class TotpSetupSerializer(serializers.Serializer):
    pass


class TotpVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)


class TotpLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification request.")

        if not user.totp_enabled or not user.totp_secret:
            raise serializers.ValidationError("2FA is not enabled for this account.")

        import pyotp
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(data['code'], valid_window=1):
            raise serializers.ValidationError("Invalid or expired code.")

        data['user'] = user
        return data


class AccessCodeLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=8, min_length=8)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification request.")

        if user.role not in ACCESS_CODE_ROLES:
            raise serializers.ValidationError("Access code not required for this account.")

        profile = user.profile
        if not profile.vendor_access_code:
            raise serializers.ValidationError("No access code set for this account.")

        if profile.vendor_access_code != data['code']:
            raise serializers.ValidationError("Invalid access code.")

        data['user'] = user
        return data


class RetrieveAccessCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")

        if user.role not in ACCESS_CODE_ROLES:
            raise serializers.ValidationError("Access codes are not used for this account type.")

        if not user.profile.vendor_access_code:
            raise serializers.ValidationError("No access code has been set for this account.")

        data['user'] = user
        return data


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class SetUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            'bio', 'avatar', 'phone', 'weight_class', 'height_ft', 'height_in', 'reach_in', 'stance',
            'business_name', 'business_location', 'business_description',
            'specialization', 'certifications',
            'vendor_access_code', 'latitude', 'longitude',
        )
        read_only_fields = ('vendor_access_code',)


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'role', 'profile', 'created_at', 'follower_count', 'following_count', 'totp_enabled')
        read_only_fields = ('id', 'email', 'role', 'created_at', 'totp_enabled')

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def validate_username(self, value):
        if self.instance and value == self.instance.username:
            return value
        now = timezone.now()
        changes_this_month = UsernameChange.objects.filter(
            user=self.instance,
            changed_at__year=now.year,
            changed_at__month=now.month,
        ).count()
        if changes_this_month >= 2:
            raise serializers.ValidationError("You can change your username only 2 times per month.")
        if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        new_username = validated_data.get('username', instance.username)

        if 'username' in validated_data and new_username != instance.username:
            UsernameChange.objects.create(
                user=instance,
                old_username=instance.username or '',
                new_username=new_username,
            )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class PublicUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'role', 'profile', 'created_at', 'follower_count', 'following_count', 'is_following')

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'created_at')
        read_only_fields = ('follower',)


class SiteContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteContent
        fields = ('key', 'title', 'body', 'updated_at')


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    actor_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'message', 'read', 'created_at', 'actor', 'actor_username', 'actor_avatar')

    def get_actor_username(self, obj):
        return obj.actor.username or obj.actor.display_name or obj.actor.email

    def get_actor_avatar(self, obj):
        try:
            return obj.actor.profile.avatar.url if obj.actor.profile.avatar else None
        except:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()
    recipient_username = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'sender', 'recipient', 'content', 'read', 'created_at', 'sender_username', 'recipient_username')
        read_only_fields = ('sender',)

    def get_sender_username(self, obj):
        return obj.sender.username or obj.sender.display_name or obj.sender.email

    def get_recipient_username(self, obj):
        return obj.recipient.username or obj.recipient.display_name or obj.recipient.email


class ConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.URLField(allow_null=True, required=False)
    last_message = serializers.CharField(allow_blank=True, required=False)
    last_message_time = serializers.DateTimeField(allow_null=True, required=False)
    unread = serializers.IntegerField()
    online = serializers.BooleanField()
