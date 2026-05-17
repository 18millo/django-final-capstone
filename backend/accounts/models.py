from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save


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


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
