from django.db import models
from django.conf import settings
from django.db.models import Sum
import uuid


class Event(models.Model):
    EVENT_TYPES = [
        ('competition', 'Competition'),
        ('workshop', 'Workshop'),
        ('seminar', 'Seminar'),
        ('tournament', 'Tournament'),
        ('other', 'Other'),
    ]

    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='other')
    location = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Kenya')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    registration_deadline = models.DateTimeField(blank=True, null=True)
    max_participants = models.PositiveIntegerField(blank=True, null=True)
    poster = models.ImageField(upload_to='event_posters/', blank=True)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=3, default='KES')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']
        indexes = [
            models.Index(fields=['start_date']),
            models.Index(fields=['event_type']),
            models.Index(fields=['city', 'is_published']),
        ]

    def __str__(self):
        return self.title

    @property
    def tickets_available(self):
        if self.max_participants:
            return max(0, self.max_participants - self.participants.count())
        return None

    @property
    def total_funds(self):
        return self.participants.filter(
            payment_status='completed'
        ).aggregate(total=Sum('amount_paid'))['total'] or 0


class EventParticipant(models.Model):
    PAYMENT_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('refunded', 'Refunded'),
        ('free', 'Free'),
    ]

    T_SHIRT_SIZES = [
        ('XS', 'XS'),
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('2XL', '2XL'),
        ('3XL', '3XL'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_registrations')

    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    t_shirt_size = models.CharField(max_length=5, choices=T_SHIRT_SIZES, blank=True)
    dietary_requirements = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=200, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)

    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='free')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    payment_method = models.CharField(max_length=10, blank=True)
    mpesa_phone = models.CharField(max_length=20, blank=True)
    card_last_four = models.CharField(max_length=4, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(blank=True, null=True)

    ticket_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    qr_code = models.ImageField(upload_to='event_qrcodes/', blank=True)
    checked_in = models.BooleanField(default=False)

    registered_at = models.DateTimeField(auto_now_add=True)
    has_attended = models.BooleanField(default=False)

    class Meta:
        unique_together = ['event', 'user']

    def __str__(self):
        return f'{self.name or self.user.email} - {self.event.title}'

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)
