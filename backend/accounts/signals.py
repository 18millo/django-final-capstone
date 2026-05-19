import logging
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver, Signal
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from .models import Profile, Post, PostComment, GalleryItem, GalleryComment, Notification

User = get_user_model()
logger = logging.getLogger(__name__)

# ── Custom Signals ──────────────────────────────────────────────
content_flagged = Signal()
premium_activated = Signal()
premium_expired = Signal()
order_completed = Signal()
user_registered = Signal()


# ── User Signals ────────────────────────────────────────────────
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        assign_group_to_user(instance)


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        try:
            send_mail(
                subject='Welcome to CombatHub!',
                message=(
                    f'Hi {instance.username or instance.email},\n\n'
                    f'Welcome to CombatHub — the complete combat sports ecosystem.\n\n'
                    f'Complete your profile, explore the community, and start your journey.\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.email],
                fail_silently=True,
            )
        except Exception:
            logger.warning(f'Welcome email failed for {instance.email}')


@receiver(post_delete, sender=User)
def cleanup_user_data(sender, instance, **kwargs):
    logger.info(f'User {instance.email} (ID: {instance.pk}) was deleted.')
    cache.delete(f'user_count')


# ── Profile Signals ─────────────────────────────────────────────
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
    cache.delete(f'profile_{instance.user.id}')
    cache.delete(f'user_{instance.user.id}_profile')


# ── Post Signals ────────────────────────────────────────────────
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
    cache.delete('recent_posts')
    cache.delete(f'user_{instance.author.id}_posts')


@receiver(post_delete, sender=Post)
def log_post_deletion(sender, instance, **kwargs):
    logger.info(f'Post (ID: {instance.pk}) by {instance.author.email} was deleted.')
    cache.delete('recent_posts')
    cache.delete(f'user_{instance.author.id}_posts')


@receiver(post_save, sender=PostComment)
def auto_flag_post_comment(sender, instance, created, **kwargs):
    if created:
        from .moderation import flag_content
        flag_content(instance.author, 'post_comment', instance.id, instance.content)
    cache.delete(f'post_{instance.post.id}_comments')


@receiver(post_delete, sender=PostComment)
def log_comment_deletion(sender, instance, **kwargs):
    logger.info(f'PostComment (ID: {instance.pk}) on post {instance.post.id} was deleted.')
    cache.delete(f'post_{instance.post.id}_comments')


# ── Gallery Signals ─────────────────────────────────────────────
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
    cache.delete('recent_gallery')
    cache.delete(f'user_{instance.user.id}_gallery')


@receiver(post_delete, sender=GalleryItem)
def log_gallery_deletion(sender, instance, **kwargs):
    logger.info(f'GalleryItem (ID: {instance.pk}) by {instance.user.email} was deleted.')
    cache.delete('recent_gallery')
    cache.delete(f'user_{instance.user.id}_gallery')


@receiver(post_save, sender=GalleryComment)
def auto_flag_gallery_comment(sender, instance, created, **kwargs):
    if created:
        from .moderation import flag_content
        flag_content(instance.user, 'gallery_comment', instance.id, instance.content)
    cache.delete(f'gallery_{instance.gallery_item.id}_comments')


@receiver(post_delete, sender=GalleryComment)
def log_gallery_comment_deletion(sender, instance, **kwargs):
    logger.info(f'GalleryComment (ID: {instance.pk}) on gallery {instance.gallery_item.id} was deleted.')
    cache.delete(f'gallery_{instance.gallery_item.id}_comments')


# ── Premium Signals ─────────────────────────────────────────────
@receiver(premium_activated)
def handle_premium_activation(sender, user, **kwargs):
    Notification.objects.create(
        recipient=user,
        actor=user,
        notification_type='premium_activated',
        message='Your CombatHub Premium is now active. Enjoy your 30-day free trial!',
    )


@receiver(premium_expired)
def handle_premium_expiry(sender, user, **kwargs):
    Notification.objects.create(
        recipient=user,
        actor=user,
        notification_type='premium_expired',
        message='Your CombatHub Premium has expired. Upgrade to regain access to premium features.',
    )


# ── Helper ──────────────────────────────────────────────────────
def assign_group_to_user(user):
    role_to_group = {
        'athlete': 'Author',
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


# ── Custom signal receivers ─────────────────────────────────────
@receiver(content_flagged)
def handle_content_flagged(sender, content_type, content_id, reason, user, **kwargs):
    logger.warning(
        f'Content flagged: {content_type}#{content_id} by {user.email} — reason: {reason}'
    )


@receiver(user_registered)
def handle_new_registration(sender, user, **kwargs):
    logger.info(f'New user registered: {user.email} (role: {user.role})')
