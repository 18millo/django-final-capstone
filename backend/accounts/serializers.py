import secrets
import string
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from .models import User, Profile, UsernameChange, SiteContent, Follow, Notification, Message, Post, PostLike, PostComment, GalleryItem, GalleryLike, GalleryComment, Bookmark, Report, BlockedUser, PostCommentLike, PaymentInfo, Group, GroupMember, GroupMessage, VendorAccessCode


ACCESS_CODE_ROLES = {'vendor', 'coach', 'gym_owner'}

def generate_access_code():
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

def resolve_avatar(profile, request=None):
    avatar = getattr(profile, 'avatar', None)
    if not avatar:
        return None
    name = avatar.name
    if name.startswith('http://') or name.startswith('https://'):
        return name
    url = avatar.url
    if url.startswith('http'):
        return url
    return request.build_absolute_uri(url) if request else url


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=True)
    vendor_access_code = serializers.CharField(read_only=True, source='profile.vendor_access_code')
    accepted_terms = serializers.BooleanField(required=True, write_only=True)
    registration_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # vendor fields
    business_name = serializers.CharField(required=False, allow_blank=True)
    business_location = serializers.CharField(required=False, allow_blank=True)
    business_description = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)

    # coach fields
    specialization = serializers.CharField(required=False, allow_blank=True)
    certifications = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'role', 'vendor_access_code',
            'registration_code',
            'business_name', 'business_location', 'business_description',
            'latitude', 'longitude',
            'specialization', 'certifications', 'accepted_terms',
        )

    def validate_accepted_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms & Conditions and Privacy Policy to create an account.")
        return value

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

    def validate(self, data):
        return data

    def create(self, validated_data):
        profile_fields = [
            'business_name', 'business_location', 'business_description',
            'latitude', 'longitude',
            'specialization', 'certifications',
        ]
        profile_data = {f: validated_data.pop(f, '') for f in profile_fields}
        registration_code = validated_data.pop('registration_code', '')

        password = validated_data.pop('password')
        validated_data.pop('accepted_terms', None)
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
            if registration_code:
                code_obj = VendorAccessCode.objects.filter(
                    code=registration_code, role=user.role, is_active=True, used_by__isnull=True
                ).first()
                if code_obj:
                    code_obj.used_by = user
                    code_obj.is_active = False
                    code_obj.save(update_fields=['used_by', 'is_active'])
        profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        login = data.get('login')
        password = data.get('password')

        if '@' in login:
            try:
                user = User.objects.get(email=login)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")
        else:
            try:
                user = User.objects.get(username=login)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")
            
            if user.role in ('vendor', 'coach', 'gym_owner'):
                raise serializers.ValidationError("Please use your email to log in.")

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


class AvatarField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None
        name = value.name
        if name.startswith('http://') or name.startswith('https://'):
            return name
        return super().to_representation(value)

class ProfileSerializer(serializers.ModelSerializer):
    avatar = AvatarField(allow_null=True, required=False)

    def validate_phone(self, value):
        if value:
            qs = Profile.objects.filter(phone=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("This phone number is already in use.")
        return value

    class Meta:
        model = Profile
        fields = (
            'bio', 'avatar', 'phone', 'weight_class', 'height_ft', 'height_in', 'reach_in', 'stance',
            'business_name', 'business_location', 'business_description',
            'specialization', 'certifications',
            'vendor_access_code', 'latitude', 'longitude',
            'is_premium', 'phone_verified', 'messaging_enabled',
        )
        read_only_fields = ('vendor_access_code', 'is_premium', 'phone_verified',)


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'role', 'profile', 'created_at', 'follower_count', 'following_count', 'totp_enabled', 'email_verified')
        read_only_fields = ('id', 'email', 'role', 'created_at', 'totp_enabled', 'email_verified')

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
    follower_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'role', 'profile', 'created_at', 'follower_count', 'following_count', 'is_following')

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_followers = getattr(obj, '_user_followers', None)
            if user_followers is not None:
                return len(user_followers) > 0
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
            return resolve_avatar(obj.actor.profile, self.context.get('request'))
        except:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()
    recipient_username = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'sender', 'recipient', 'content', 'image', 'image_url', 'view_once', 'viewed', 'delivered', 'read', 'created_at', 'sender_username', 'recipient_username')
        read_only_fields = ('sender',)

    def get_sender_username(self, obj):
        return obj.sender.username or obj.sender.display_name or obj.sender.email

    def get_recipient_username(self, obj):
        return obj.recipient.username or obj.recipient.display_name or obj.recipient.email

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.URLField(allow_null=True, required=False)
    last_message = serializers.CharField(allow_blank=True, required=False)
    last_message_time = serializers.DateTimeField(allow_null=True, required=False)
    unread = serializers.IntegerField()
    online = serializers.BooleanField()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source='author.role', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    author_is_premium = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    view_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'author', 'author_name', 'author_role', 'author_avatar', 'author_is_premium',
                  'content', 'file', 'file_url', 'like_count', 'dislike_count', 'comment_count',
                  'is_liked', 'is_disliked', 'user_vote', 'view_count', 'created_at', 'updated_at')
        read_only_fields = ('author',)

    def get_author_name(self, obj):
        return obj.author.username or obj.author.display_name or obj.author.email

    def get_author_avatar(self, obj):
        return resolve_avatar(obj.author.profile, self.context.get('request'))

    def get_author_is_premium(self, obj):
        return getattr(obj.author.profile, 'is_premium', False)

    def get_like_count(self, obj):
        return obj.likes.filter(vote_type='like').count()

    def get_dislike_count(self, obj):
        return obj.likes.filter(vote_type='dislike').count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_view_count(self, obj):
        author = obj.author
        if author.role == 'vendor':
            return obj.view_count
        profile = getattr(author, 'profile', None)
        if profile and profile.is_premium_active() and not profile.show_views_publicly:
            return None
        return obj.view_count

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user, vote_type='like').exists()
        return False

    def get_is_disliked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user, vote_type='dislike').exists()
        return False

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.likes.filter(user=request.user).first()
            if vote:
                return vote.vote_type
        return None

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        if url.startswith('http'):
            return url
        return request.build_absolute_uri(url) if request else url


class PostCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source='author.role', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    author_is_premium = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ('id', 'post', 'author', 'author_name', 'author_role', 'author_avatar', 'author_is_premium',
                  'parent', 'content', 'replies', 'user_vote', 'created_at', 'updated_at')
        read_only_fields = ('author', 'post',)

    def get_author_name(self, obj):
        return obj.author.username or obj.author.display_name or obj.author.email

    def get_author_avatar(self, obj):
        return resolve_avatar(obj.author.profile, self.context.get('request'))

    def get_author_is_premium(self, obj):
        return getattr(obj.author.profile, 'is_premium', False)

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.likes.filter(user=request.user).first()
            if vote:
                return vote.vote_type
        return None

    def get_replies(self, obj):
        replies = obj.replies.all()
        return PostCommentSerializer(replies, many=True, context=self.context).data


class PostLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostLike
        fields = ('id', 'post', 'user', 'created_at')
        read_only_fields = ('user',)


class GalleryItemSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    user_is_premium = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = GalleryItem
        fields = ('id', 'user', 'user_name', 'user_role', 'user_avatar', 'user_is_premium',
                  'image', 'image_url', 'caption', 'like_count', 'dislike_count', 'comment_count',
                  'is_liked', 'user_vote', 'created_at')
        read_only_fields = ('user',)

    def get_user_name(self, obj):
        return obj.user.username or obj.user.display_name or obj.user.email

    def get_user_avatar(self, obj):
        return resolve_avatar(obj.user.profile, self.context.get('request'))

    def get_user_is_premium(self, obj):
        return getattr(obj.user.profile, 'is_premium', False)

    def get_like_count(self, obj):
        return obj.likes.filter(vote_type='like').count()

    def get_dislike_count(self, obj):
        return obj.likes.filter(vote_type='dislike').count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user, vote_type='like').exists()
        return False

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.likes.filter(user=request.user).first()
            if vote:
                return vote.vote_type
        return None

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        if url.startswith('http'):
            return url
        return request.build_absolute_uri(url) if request else url


class GalleryCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    user_is_premium = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = GalleryComment
        fields = ('id', 'gallery_item', 'user', 'user_name', 'user_avatar', 'user_is_premium',
                  'parent', 'content', 'replies', 'created_at', 'updated_at')
        read_only_fields = ('user', 'gallery_item')

    def get_user_name(self, obj):
        return obj.user.username or obj.user.display_name or obj.user.email

    def get_user_avatar(self, obj):
        return resolve_avatar(obj.user.profile, self.context.get('request'))

    def get_user_is_premium(self, obj):
        return getattr(obj.user.profile, 'is_premium', False)

    def get_replies(self, obj):
        replies = obj.replies.all()
        return GalleryCommentSerializer(replies, many=True, context=self.context).data


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('reporter', 'status')


class BlockedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedUser
        fields = '__all__'
        read_only_fields = ('blocker',)


class PaymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInfo
        fields = ('method', 'mpesa_phone', 'card_last_four', 'card_brand', 'card_token')
        extra_kwargs = {
            'mpesa_phone': {'required': False},
            'card_last_four': {'required': False},
            'card_brand': {'required': False},
            'card_token': {'required': False},
        }

    def validate(self, data):
        method = data.get('method')
        if method == 'mpesa' and not data.get('mpesa_phone'):
            raise serializers.ValidationError({'mpesa_phone': 'M-Pesa phone number is required.'})
        if method == 'card':
            if not data.get('card_last_four'):
                raise serializers.ValidationError({'card_last_four': 'Last four digits of card are required.'})
        return data


class GroupMemberSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = GroupMember
        fields = ('id', 'user', 'username', 'avatar', 'role', 'status', 'joined_at')
        read_only_fields = ('id', 'joined_at')

    def get_username(self, obj):
        return obj.user.username or obj.user.display_name or obj.user.email

    def get_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar(obj.user.profile, request)


class GroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    created_by_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'avatar', 'is_private', 'max_members',
                  'created_by', 'created_by_name', 'created_by_avatar',
                  'member_count', 'members', 'is_member', 'my_status',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        return obj.members.filter(status='joined').count()

    def get_members(self, obj):
        joined = obj.members.filter(status='joined').select_related('user__profile')
        return GroupMemberSerializer(joined, many=True, context=self.context).data

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user, status='joined').exists()
        return False

    def get_my_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            gm = obj.members.filter(user=request.user).first()
            if gm:
                return gm.status
        return None

    def get_created_by_name(self, obj):
        return obj.created_by.username or obj.created_by.display_name or obj.created_by.email

    def get_created_by_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar(obj.created_by.profile, request)


class GroupMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = ('id', 'group', 'sender', 'sender_name', 'sender_avatar', 'content', 'image', 'image_url', 'created_at')
        read_only_fields = ('id', 'sender', 'created_at')

    def get_sender_name(self, obj):
        return obj.sender.username or obj.sender.display_name or obj.sender.email

    def get_sender_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar(obj.sender.profile, request)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        if url.startswith('http'):
            return url
        return request.build_absolute_uri(url) if request else url
