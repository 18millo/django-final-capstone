import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=Product)
def invalidate_product_cache(sender, **kwargs):
    cache.delete('featured_products')
    cache.delete('product_count')


@receiver(post_delete, sender=Product)
def log_product_deletion(sender, instance, **kwargs):
    logger.info(f'Product "{instance.name}" (ID: {instance.pk}) was deleted.')
