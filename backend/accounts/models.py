import random
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save
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
    phone = models.CharField(max_length=20, blank=True)
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

    # terms acceptance
    accepted_terms = models.BooleanField(default=False)
    accepted_terms_at = models.DateTimeField(null=True, blank=True)
    accepted_terms_ip = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.user.email}'s profile"


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


from django.contrib.auth.models import Group


def assign_group_to_user(user):
    role_to_group = {
        'athlete': 'Reader',
        'coach': 'Author',
        'gym_owner': 'Author',
        'vendor': 'Author',
        'admin': 'Admin',
    }
    group_name = role_to_group.get(user.role)
    if group_name:
        try:
            group = Group.objects.get(name=group_name)
            if group not in user.groups.all():
                user.groups.add(group)
        except Group.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        assign_group_to_user(instance)


class VendorAccessCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    file = models.FileField(upload_to='post_files/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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


# Signal receivers for content moderation and notifications
@receiver(post_save, sender=Post)
def auto_flag_and_notify_post(sender, instance, created, **kwargs):
    if created:
        from .moderation import flag_content
        flag_content(instance.author, 'post', instance.id, instance.content)
        followers = User.objects.filter(following__following=instance.author)
        for follower in followers:
            Notification.objects.create(
                recipient=follower,
                actor=instance.author,
                notification_type='new_post',
                message=f'{instance.author.username or instance.author.email} created a new post.',
            )


@receiver(post_save, sender=PostComment)
def auto_flag_post_comment(sender, instance, created, **kwargs):
    if created:
        from .moderation import flag_content
        flag_content(instance.author, 'post_comment', instance.id, instance.content)


@receiver(post_save, sender=GalleryItem)
def auto_flag_and_notify_gallery(sender, instance, created, **kwargs):
    if created:
        if instance.caption:
            from .moderation import flag_content
            flag_content(instance.user, 'gallery_item', instance.id, instance.caption)
        followers = User.objects.filter(following__following=instance.user)
        for follower in followers:
            Notification.objects.create(
                recipient=follower,
                actor=instance.user,
                notification_type='new_gallery',
                message=f'{instance.user.username or instance.user.email} uploaded a new gallery photo.',
            )


@receiver(post_save, sender=GalleryComment)
def auto_flag_gallery_comment(sender, instance, created, **kwargs):
    if created:
        from .moderation import flag_content
        flag_content(instance.user, 'gallery_comment', instance.id, instance.content)


@receiver(post_save, sender=Profile)
def notify_and_flag_profile_update(sender, instance, **kwargs):
    if instance.bio:
        from .moderation import flag_content
        flag_content(instance.user, 'profile', instance.user.id, instance.bio)
    if instance.business_description:
        from .moderation import flag_content
        flag_content(instance.user, 'profile', instance.user.id, instance.business_description)
    followers = User.objects.filter(following__following=instance.user)
    for follower in followers:
        Notification.objects.create(
            recipient=follower,
            actor=instance.user,
            notification_type='profile_update',
            message=f'{instance.user.username or instance.user.email} updated their profile.',
        )
