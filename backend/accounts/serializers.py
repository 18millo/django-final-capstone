from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from .models import User, Profile, UsernameChange, SiteContent, Follow, Notification, Message


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'role')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.display_name = validated_data.get('username', '')
        user.set_password(password)
        user.save()
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
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")

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
        fields = ('bio', 'avatar', 'phone', 'weight_class', 'height_ft', 'height_in', 'reach_in', 'stance')


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'role', 'profile', 'created_at', 'follower_count', 'following_count')
        read_only_fields = ('id', 'email', 'role', 'created_at')

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
