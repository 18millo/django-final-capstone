from django.contrib import admin
from .models import Gym


@admin.register(Gym)
class GymAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'city', 'country', 'is_featured')
    list_filter = ('is_featured', 'city', 'country')
    search_fields = ('name', 'city', 'owner__email')
