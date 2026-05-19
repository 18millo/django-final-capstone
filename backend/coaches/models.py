from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class CoachProfile(models.Model):
    SPECIALTIES = [
        ('boxing', 'Boxing'),
        ('muay_thai', 'Muay Thai'),
        ('bjj', 'Brazilian Jiu-Jitsu'),
        ('wrestling', 'Wrestling'),
        ('mma', 'MMA'),
        ('kickboxing', 'Kickboxing'),
        ('fitness', 'Fitness & Conditioning'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coach_profile')
    specialties = models.JSONField(default=list)
    bio = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=3, default='KES')
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_available', 'user__email']

    def __str__(self):
        return f'Coach: {self.user.email}'
