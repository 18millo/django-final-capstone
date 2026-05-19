from django.contrib import admin
from .models import CoachProfile


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'years_experience', 'hourly_rate', 'is_available')
    list_filter = ('is_available', 'specialties')
    search_fields = ('user__email', 'bio')
