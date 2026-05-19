import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Gym

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Gym)
def invalidate_gym_cache(sender, **kwargs):
    cache.delete('gym_count')


@receiver(post_delete, sender=Gym)
def log_gym_deletion(sender, instance, **kwargs):
    logger.info(f'Gym "{instance.name}" (ID: {instance.pk}) was deleted.')
