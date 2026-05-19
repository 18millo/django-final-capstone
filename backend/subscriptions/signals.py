import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import NewsletterSubscriber

logger = logging.getLogger(__name__)


@receiver(post_save, sender=NewsletterSubscriber)
def log_new_subscriber(sender, instance, created, **kwargs):
    if created:
        logger.info(f'Newsletter subscriber added: {instance.email}')
    cache.delete('subscriber_count')


@receiver(post_delete, sender=NewsletterSubscriber)
def log_unsubscribe(sender, instance, **kwargs):
    logger.info(f'Newsletter subscriber removed: {instance.email}')
    cache.delete('subscriber_count')
