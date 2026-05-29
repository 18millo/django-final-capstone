# Caching Strategies in Django

Caching is one of the most impactful performance optimizations you can make. Instead of querying the database and processing data on every request, caching stores the result and serves it directly — cutting response times from seconds to milliseconds.

---

## What is Caching?

Caching stores the result of an expensive computation so that future requests for the same data can be served instantly.

**First Request (cache miss):**
```
Request → View → Database → Template → Response (200ms)
                              ↓
                    Store result in cache
```

**Subsequent Requests (cache hit):**
```
Request → Cache → Response (5ms)
```

---

## Cache Backends

Django supports multiple cache backends:

| Backend | Speed | Persistence | Use case |
|---------|-------|-------------|----------|
| Redis | Very fast | Yes (optional) | Production — recommended |
| Memcached | Very fast | No | Production — alternative |
| Database | Moderate | Yes | Small sites, prototyping |
| File-based | Slow | Yes | Development |
| Local memory | Fast | No (per-process) | Development only |

---

## Redis Setup (Recommended)

Install Redis:

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping
#  PONG
```

Install the Python client:

```bash
pip install django-redis
```

Configure in settings.py:

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "TIMEOUT": 300,  # Default timeout: 5 minutes
    }
}
```

---

## Memcached Setup

```bash
# Install
sudo apt install memcached
pip install pymemcache
```

```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.memcached.PyMemcacheCache",
        "LOCATION": "127.0.0.1:11211",
    }
}
```

---

## Caching Strategies

### 1. Per-View Caching

Cache the entire response of a view:

```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def blog_list(request):
    blogs = Blog.objects.filter(published=True).select_related("author")
    return render(request, "blog_list.html", {"blogs": blogs})
```

For class-based views:

```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.views.generic import ListView

@method_decorator(cache_page(60 * 15), name="dispatch")
class BlogListView(ListView):
    model = Blog
    template_name = "blog_list.html"
```

In URLs:

```python
from django.views.decorators.cache import cache_page

urlpatterns = [
    path("blogs/", cache_page(60 * 15)(blog_list), name="blog_list"),
]
```

### 2. Template Fragment Caching

Cache specific parts of a template:

```html
{% load cache %}

<h1>My Blog</h1>

{# Cache the sidebar for 10 minutes #}
{% cache 600 sidebar %}
    <div class="sidebar">
        <h3>Recent Posts</h3>
        {% for post in recent_posts %}
            <a href="{{ post.get_absolute_url }}">{{ post.title }}</a>
        {% endfor %}
    </div>
{% endcache %}

{# Cache per-user content (include user ID in cache key) #}
{% cache 600 user_dashboard request.user.pk %}
    <div class="dashboard">
        <div>Welcome, {{ request.user.username }}</div>
        <div>You have {{ notifications.count }} notifications</div>
    </div>
{% endcache %}
```

### 3. Low-Level (Data) Caching

Cache any Python object directly:

```python
from django.core.cache import cache

def get_popular_blogs():
    # Try to get from cache
    blogs = cache.get("popular_blogs")

    if blogs is None:
        # Cache miss — query the database
        blogs = list(
            Blog.objects.filter(published=True)
            .order_by("-views")[:10]
            .values("id", "title", "views")
        )
        # Store in cache for 30 minutes
        cache.set("popular_blogs", blogs, 60 * 30)

    return blogs
```

### Low-Level Cache API

| Method | Purpose |
|--------|---------|
| `cache.set(key, value, timeout)` | Store a value |
| `cache.get(key, default=None)` | Retrieve a value |
| `cache.delete(key)` | Delete a key |
| `cache.get_or_set(key, default, timeout)` | Get or compute + store |
| `cache.incr(key)` / `cache.decr(key)` | Increment / decrement |
| `cache.set_many(dict, timeout)` | Store multiple values |
| `cache.get_many(keys)` | Retrieve multiple values |
| `cache.clear()` | Clear entire cache |

### Pattern: get_or_set

```python
from django.core.cache import cache

def get_blog_count():
    return cache.get_or_set(
        "blog_count",
        Blog.objects.filter(published=True).count(),
        timeout=60 * 60,  # 1 hour
    )
```

---

## Cache Invalidation

The hardest problem in caching is knowing when to clear stale data.

### Manual Invalidation with Signals

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

@receiver([post_save, post_delete], sender=Blog)
def invalidate_blog_cache(sender, **kwargs):
    cache.delete("popular_blogs")
    cache.delete("blog_count")
    cache.delete_pattern("blog_list_*")  # Redis only, via django-redis
```

### Cache Versioning

```python
# Increment version to invalidate all caches for this key
cache.set("blogs", data, version=2)
cache.get("blogs", version=2)

# Or increment programmatically
cache.incr_version("blogs")
```

### Using Cache with DRF APIs

```python
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.views import APIView
from rest_framework.response import Response

class BlogListAPI(APIView):
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        blogs = Blog.objects.filter(published=True).values("id", "title")
        return Response(list(blogs))
```

---

## Session Caching with Redis

Store Django sessions in Redis for speed:

```python
# settings.py
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
```

---

## Best Practices

1. **Start with the database** — Only add caching when you've identified a bottleneck.
2. **Cache at the right level** — Per-view for entire pages, fragment for sections, low-level for data.
3. **Set appropriate timeouts** — Balance freshness vs. performance.
4. **Invalidate on writes** — Use signals to clear cache when data changes.
5. **Use meaningful cache keys** — Include identifiers to avoid collisions: `f"blog_{blog.id}_detail"`.
6. **Monitor cache hit rate** — Aim for >90% hit rate in production.

---

## Key Takeaways

- Caching dramatically reduces response times and database load
- Redis is the recommended backend for production
- Three levels: per-view (whole page), template fragment, low-level (data)
- Invalidation is the hard part — use signals and versioning
- Always measure before caching — premature optimization adds complexity
