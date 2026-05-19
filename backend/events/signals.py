import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Event, EventParticipant

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Event)
def invalidate_event_cache(sender, **kwargs):
    cache.delete('upcoming_events')


@receiver(post_delete, sender=Event)
def log_event_deletion(sender, instance, **kwargs):
    logger.info(f'Event "{instance.title}" (ID: {instance.pk}) was deleted.')


@receiver([post_save, post_delete], sender=EventParticipant)
def invalidate_participant_cache(sender, instance, **kwargs):
    cache.delete(f'event_{instance.event.id}_participants')
