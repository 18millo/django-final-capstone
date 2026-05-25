import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class VendorPremiumPlan(models.Model):
    INTERVAL_CHOICES = [
        ('month', 'Monthly'),
        ('year', 'Yearly'),
    ]

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    interval = models.CharField(max_length=10, choices=INTERVAL_CHOICES, blank=True)
    max_products = models.IntegerField(default=5)
    max_images_per_product = models.IntegerField(default=3)
    discounts_allowed = models.BooleanField(default=False)
    analytics_available = models.BooleanField(default=False)
    is_free = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Vendor Premium Plan'
        verbose_name_plural = 'Vendor Premium Plans'

    def __str__(self):
        return self.name


class VendorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile',
    )
    business_name = models.CharField(max_length=200, blank=True)
    business_location = models.CharField(max_length=300, blank=True)
    business_description = models.TextField(blank=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    avatar = models.ImageField(upload_to='vendor_avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Vendor Profile'
        verbose_name_plural = 'Vendor Profiles'

    def __str__(self):
        name = self.business_name or self.user.display_name or self.user.email
        return f'{name} — Vendor Profile'

    @classmethod
    def ensure_for_user(cls, user):
        profile, created = cls.objects.get_or_create(user=user)
        return profile


class VendorInvitation(models.Model):
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_invitations',
    )
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vendor Invitation'
        verbose_name_plural = 'Vendor Invitations'

    def __str__(self):
        return f'Invitation for {self.email}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_expired


class VendorSubscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trialing', 'Trialing'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
    ]

    vendor_profile = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='subscription',
    )
    plan = models.ForeignKey(
        VendorPremiumPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscriptions',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    trial_end = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Vendor Subscription'
        verbose_name_plural = 'Vendor Subscriptions'

    def __str__(self):
        plan_name = self.plan.name if self.plan else 'No Plan'
        return f'{self.vendor_profile} — {plan_name} ({self.status})'

    @property
    def is_active(self):
        if self.status in ('active', 'trialing'):
            if self.current_period_end and self.current_period_end < timezone.now():
                if self.status == 'active':
                    self.status = 'expired'
                    self.save(update_fields=['status'])
                return False
            return True
        return False

    @property
    def is_trialing(self):
        return self.status == 'trialing' and self.is_active


class Brand(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brand_logos/', blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='brands',
        null=True,
        blank=True,
    )
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Brand'
        verbose_name_plural = 'Brands'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
