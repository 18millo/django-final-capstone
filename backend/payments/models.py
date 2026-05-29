from django.db import models
from django.conf import settings


class PaystackTransaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='paystack_transactions')
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    metadata = models.JSONField(blank=True, default=dict)
    access_code = models.CharField(max_length=100, blank=True)
    authorization_url = models.URLField(max_length=500, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    channel = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} ({self.status})'
