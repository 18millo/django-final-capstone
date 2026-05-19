from django.contrib import admin
from .models import Event, EventParticipant


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 0
    readonly_fields = ('registered_at',)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'city', 'start_date', 'organizer', 'is_published')
    list_filter = ('event_type', 'is_published', 'city')
    search_fields = ('title', 'description', 'city', 'organizer__email')
    inlines = [EventParticipantInline]


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'registered_at', 'has_attended')
    list_filter = ('has_attended',)
