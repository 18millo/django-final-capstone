from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from .models import NewsletterSubscriber
from .serializers import NewsletterSubscriberSerializer


class SubscribeView(generics.CreateAPIView):
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'subscribe'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Subscribed successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnsubscribeView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sub = NewsletterSubscriber.objects.get(email=email, is_active=True)
            sub.is_active = False
            from django.utils import timezone
            sub.unsubscribed_at = timezone.now()
            sub.save()
            return Response({'message': 'Unsubscribed successfully'})
        except NewsletterSubscriber.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)
