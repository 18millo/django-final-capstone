from django.contrib import admin
from .models import Event, EventParticipant


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 0
    readonly_fields = ('registered_at', 'ticket_number', 'qr_code', 'transaction_id')
    fields = (
        'user', 'name', 'email', 'phone', 'payment_status', 'amount_paid',
        'payment_method', 'transaction_id', 'ticket_number', 'checked_in',
        'has_attended', 'registered_at',
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'city', 'start_date', 'organizer',
                    'is_published', 'tickets_available', 'total_funds')
    list_filter = ('event_type', 'is_published', 'city')
    search_fields = ('title', 'description', 'city', 'organizer__email')
    inlines = [EventParticipantInline]
    readonly_fields = ('tickets_available', 'total_funds')


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'event', 'payment_status', 'ticket_number',
                    'registered_at', 'has_attended', 'checked_in')
    list_filter = ('payment_status', 'has_attended', 'checked_in', 't_shirt_size')
    search_fields = ('name', 'email', 'ticket_number', 'event__title')
    readonly_fields = ('ticket_number', 'qr_code', 'transaction_id', 'payment_date')
