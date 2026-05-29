import random
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ATHLETE = 'athlete', 'Athlete'
        COACH = 'coach', 'Coach'
        GYM_OWNER = 'gym_owner', 'Gym Owner'
        VENDOR = 'vendor', 'Vendor'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ATHLETE)
    google_id = models.CharField(max_length=255, null=True, blank=True)
    display_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    totp_secret = models.CharField(max_length=64, blank=True)
    totp_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    messaging_blocked = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Profile(models.Model):
    class WeightClass(models.TextChoices):
        STRAW = 'strawweight', 'Strawweight (115)'
        FLY = 'flyweight', 'Flyweight (125)'
        BANTAM = 'bantamweight', 'Bantamweight (135)'
        FEATHER = 'featherweight', 'Featherweight (145)'
        LIGHT = 'lightweight', 'Lightweight (155)'
        WELTER = 'welterweight', 'Welterweight (170)'
        MIDDLE = 'middleweight', 'Middleweight (185)'
        LIGHT_HEAVY = 'light_heavyweight', 'Light Heavyweight (205)'
        HEAVY = 'heavyweight', 'Heavyweight (265)'

    class Stance(models.TextChoices):
        ORTHODOX = 'orthodox', 'Orthodox'
        SOUTHPAW = 'southpaw', 'Southpaw'
        SWITCH = 'switch', 'Switch'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    weight_class = models.CharField(max_length=20, choices=WeightClass.choices, blank=True)
    height_ft = models.IntegerField(blank=True, null=True)
    height_in = models.IntegerField(blank=True, null=True)
    reach_in = models.IntegerField(blank=True, null=True)
    stance = models.CharField(max_length=20, choices=Stance.choices, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    # vendor fields
    business_name = models.CharField(max_length=200, blank=True)
    business_location = models.CharField(max_length=300, blank=True)
    business_description = models.TextField(blank=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    # coach fields
    specialization = models.CharField(max_length=200, blank=True)
    certifications = models.TextField(blank=True)

    # vendor access code used during registration
    vendor_access_code = models.CharField(max_length=50, blank=True)

    # premium subscription
    is_premium = models.BooleanField(default=False)
    premium_trial_started = models.DateTimeField(null=True, blank=True)
    premium_expires_at = models.DateTimeField(null=True, blank=True)
    premium_grace_end = models.DateTimeField(null=True, blank=True)
    premium_trial_used = models.BooleanField(default=False)
    show_views_publicly = models.BooleanField(default=True)

    # message settings
    messaging_enabled = models.BooleanField(default=True)
    # Vendors default to disabled; users cannot message them unless they enable it

    # phone verification
    phone_verified = models.BooleanField(default=False)

    # terms acceptance
    accepted_terms = models.BooleanField(default=False)
    accepted_terms_at = models.DateTimeField(null=True, blank=True)
    accepted_terms_ip = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.user.email}'s profile"

    def is_premium_active(self):
        if not self.is_premium:
            return False
        from django.utils import timezone
        now = timezone.now()
        if self.premium_grace_end and self.premium_grace_end < now:
            self.is_premium = False
            self.save(update_fields=['is_premium'])
            return False
        if self.premium_expires_at and self.premium_expires_at < now:
            if not self.premium_grace_end:
                self.premium_grace_end = now + timezone.timedelta(days=7)
                self.save(update_fields=['premium_grace_end'])
                Notification.objects.create(
                    recipient=self.user,
                    actor=self.user,
                    notification_type='premium_expiring',
                    message='Your premium trial has ended. You\'ve been given a 1-week grace extension! Subscribe to keep premium features.',
                )
            return True
        return True


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.email} follows {self.following.email}"


class UsernameChange(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='username_changes')
    old_username = models.CharField(max_length=150)
    new_username = models.CharField(max_length=150)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']


class Notification(models.Model):
    class Type(models.TextChoices):
        FOLLOW = 'follow', 'New Follower'
        PROFILE_UPDATE = 'profile_update', 'Profile Updated'
        NEW_POST = 'new_post', 'New Forum Post'
        NEW_GALLERY = 'new_gallery', 'New Gallery Upload'
        CONTENT_FLAG = 'content_flag', 'Content Flagged'
        PREMIUM_ACTIVATED = 'premium_activated', 'Premium Activated'
        PREMIUM_EXPIRING = 'premium_expiring', 'Premium Expiring'
        PREMIUM_EXPIRED = 'premium_expired', 'Premium Expired'
        ACCESS_CODE_SENT = 'access_code_sent', 'Access Code Sent'
        GROUP_JOIN = 'group_join', 'Group Join'

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='actor_notifications')
    notification_type = models.CharField(max_length=20, choices=Type.choices)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    image = models.ImageField(upload_to='message_images/', blank=True)
    view_once = models.BooleanField(default=False)
    viewed = models.BooleanField(default=False)
    delivered = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class SiteContent(models.Model):
    key = models.SlugField(unique=True, max_length=100)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class EmailVerificationCode(models.Model):
    class Type(models.TextChoices):
        SIGNUP = 'signup', 'Signup Verification'
        LOGIN = 'login', 'Login Verification'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    type = models.CharField(max_length=10, choices=Type.choices)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.type} - {self.code}'

    @classmethod
    def generate(cls, user, type):
        code = ''.join(random.choices('0123456789', k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        return cls.objects.create(user=user, code=code, type=type, expires_at=expires_at)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class PhoneVerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_verification_codes')
    code = models.CharField(max_length=6)
    phone = models.CharField(max_length=20)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.phone} - {self.code}'

    @classmethod
    def generate(cls, user, phone):
        code = ''.join(random.choices('0123456789', k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        return cls.objects.create(user=user, phone=phone, code=code, expires_at=expires_at)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at




class VendorAccessCode(models.Model):
    class RoleChoices(models.TextChoices):
        VENDOR = 'vendor', 'Vendor'
        GYM_OWNER = 'gym_owner', 'Gym Owner'
        COACH = 'coach', 'Coach'

    code = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.VENDOR)
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_access_codes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.get_role_display()} - {self.code}'


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    file = models.FileField(upload_to='post_files/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Post by {self.author.username or self.author.email} at {self.created_at}'


class PostLike(models.Model):
    class Vote(models.TextChoices):
        LIKE = 'like', 'Like'
        DISLIKE = 'dislike', 'Dislike'

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    vote_type = models.CharField(max_length=10, choices=Vote.choices, default=Vote.LIKE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f'{self.user.email} {self.vote_type}s post {self.post.id}'


class GalleryItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_items')
    image = models.ImageField(upload_to='gallery/')
    caption = models.CharField(max_length=280, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Gallery by {self.user.username or self.user.email}'


class GalleryLike(models.Model):
    class Vote(models.TextChoices):
        LIKE = 'like', 'Like'
        DISLIKE = 'dislike', 'Dislike'

    gallery_item = models.ForeignKey(GalleryItem, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_likes')
    vote_type = models.CharField(max_length=10, choices=Vote.choices, default=Vote.LIKE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('gallery_item', 'user')

    def __str__(self):
        return f'{self.user.email} {self.vote_type}s gallery {self.gallery_item.id}'


class GalleryComment(models.Model):
    gallery_item = models.ForeignKey(GalleryItem, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.user.email} on gallery {self.gallery_item.id}'


class PostComment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author.username or self.author.email} on post {self.post.id}'


class PostCommentLike(models.Model):
    class Vote(models.TextChoices):
        LIKE = 'like', 'Like'
        DISLIKE = 'dislike', 'Dislike'

    comment = models.ForeignKey(PostComment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    vote_type = models.CharField(max_length=10, choices=Vote.choices, default=Vote.LIKE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')

    def __str__(self):
        return f'{self.user.email} {self.vote_type}s comment {self.comment.id}'


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='bookmarks')
    gallery_item = models.ForeignKey(GalleryItem, on_delete=models.CASCADE, null=True, blank=True, related_name='bookmarks')
    product_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.post or self.gallery_item or self.product_id
        return f'{self.user.email} bookmarked {target}'


class Report(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment or Bullying'),
        ('hate_speech', 'Hate Speech'),
        ('violence', 'Violence or Threats'),
        ('nudity', 'Nudity or Sexual Content'),
        ('misinformation', 'Misinformation'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('actioned', 'Action Taken'),
    ]

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    # Polymorphic target
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    post_comment = models.ForeignKey(PostComment, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    gallery_item = models.ForeignKey(GalleryItem, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    gallery_comment = models.ForeignKey(GalleryComment, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    product_comment = models.ForeignKey('products.ProductComment', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Report #{self.id} by {self.reporter.email} ({self.reason})'


class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.blocker.email} blocked {self.blocked.email}'


class IPLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ip_logs')
    ip_hash = models.CharField(max_length=64)
    user_agent = models.TextField(blank=True)
    action = models.CharField(max_length=50, default='login')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['ip_hash']),
        ]

    def __str__(self):
        return f'{self.user.email} @ {self.ip_hash[:16]}...'


class ContentFlag(models.Model):
    REASON_CHOICES = [
        ('profanity', 'Profanity / Vulgar Language'),
        ('violence', 'Violent Content'),
        ('hate_speech', 'Hate Speech'),
        ('spam', 'Spam'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('auto_moderated', 'Auto-Moderated'),
        ('approved', 'Approved'),
        ('dismissed', 'Dismissed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='content_flags')
    content_type = models.CharField(max_length=30)
    content_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    flagged_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Flag #{self.id} {self.reason} on {self.content_type}#{self.content_id}'


class PaymentInfo(models.Model):
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Card'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='payment_info')
    method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    mpesa_phone = models.CharField(max_length=20, blank=True)
    card_last_four = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    card_token = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.method == 'mpesa':
            return f'M-Pesa {self.mpesa_phone}'
        return f'{self.card_brand} ****{self.card_last_four}'


class Group(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='group_avatars/', blank=True)
    is_private = models.BooleanField(default=False)
    max_members = models.IntegerField(default=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]
    STATUS_CHOICES = [
        ('joined', 'Joined'),
        ('pending', 'Pending Approval'),
        ('invited', 'Invited'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='joined')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f'{self.user.email} in {self.group.name}'


class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_messages')
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='group_message_images/', blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.email} in {self.group.name}'


class BlockedGroup(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_groups')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} blocked group {self.group.name}'
