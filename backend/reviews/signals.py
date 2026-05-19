import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import ProductReview

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=ProductReview)
def invalidate_review_cache(sender, instance, **kwargs):
    cache.delete(f'product_{instance.product.id}_reviews')
    cache.delete(f'product_{instance.product.id}_rating')
