from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


def invalidate_cache_pattern(pattern):
    try:
        cache.delete_pattern(pattern)
    except AttributeError:
        pass
    except Exception as e:
        logger.warning(f'Cache invalidation failed for pattern {pattern}: {e}')


def invalidate_cache_key(key):
    try:
        cache.delete(key)
    except Exception as e:
        logger.warning(f'Cache delete failed for key {key}: {e}')
