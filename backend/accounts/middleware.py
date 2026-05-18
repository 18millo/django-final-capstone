import hashlib
from django.utils import timezone


class IPTrackingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.user.is_authenticated:
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            if ip:
                ip = ip.split(',')[0].strip()
            ip_hash = hashlib.sha256(ip.encode()).hexdigest()
            ua = request.META.get('HTTP_USER_AGENT', '')[:500]
            from .models import IPLog
            IPLog.objects.create(
                user=request.user,
                ip_hash=ip_hash,
                user_agent=ua,
            )
        return None
