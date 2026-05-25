from django.contrib import admin, messages
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import VendorProfile, VendorInvitation, Brand


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'business_location', 'created_at')
    search_fields = ('user__email', 'business_name', 'business_location')
    raw_id_fields = ('user',)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_by', 'is_approved', 'created_at')
    list_filter = ('is_approved',)
    search_fields = ('name',)
    actions = ['approve_brands']

    def approve_brands(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} brand(s) approved.')

    approve_brands.short_description = 'Approve selected brands'


@admin.register(VendorInvitation)
class VendorInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_by', 'is_used', 'is_expired', 'created_at')
    list_filter = ('is_used',)
    search_fields = ('email', 'created_by__email')
    readonly_fields = ('token', 'created_at')
    raw_id_fields = ('created_by',)
    actions = ['send_invitation']

    def send_invitation(self, request, queryset):
        sent = 0
        for invitation in queryset:
            if invitation.is_used:
                self.message_user(request, f'{invitation.email} already used their invitation.', level='WARNING')
                continue
            if invitation.is_expired:
                self.message_user(request, f'{invitation.email}\'s invitation has expired.', level='WARNING')
                continue

            shop_url = getattr(settings, 'SHOP_URL', 'http://localhost:5174')
            link = f'{shop_url}/activate?token={invitation.token}'

            try:
                send_mail(
                    subject='You\'re invited to Combat Shop!',
                    message=(
                        f'Hi,\n\n'
                        f'You have been invited to join Combat Shop — the vendor platform for CombatHub.\n\n'
                        f'Click the link below to activate your account and set your password:\n'
                        f'{link}\n\n'
                        f'This link expires on {invitation.expires_at.strftime("%B %d, %Y at %H:%M UTC")}.\n\n'
                        f'Welcome aboard!\n'
                        f'- The CombatHub Team'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[invitation.email],
                    fail_silently=False,
                )
                sent += 1
            except Exception as e:
                self.message_user(
                    request,
                    f'Failed to send invitation to {invitation.email}: {e}',
                    level='ERROR',
                )

        if sent:
            self.message_user(request, f'Sent {sent} invitation(s) successfully.')

    send_invitation.short_description = 'Send invitation email to selected vendors'

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
            if not obj.expires_at:
                obj.expires_at = timezone.now() + timedelta(days=7)
        super().save_model(request, obj, form, change)
