from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, UsernameChange, SiteContent, VendorAccessCode


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'display_name', 'role', 'google_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('email', 'username')
    ordering = ('email',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'weight_class', 'stance', 'phone')
    search_fields = ('user__email',)


@admin.register(UsernameChange)
class UsernameChangeAdmin(admin.ModelAdmin):
    list_display = ('user', 'old_username', 'new_username', 'changed_at')
    list_filter = ('changed_at',)


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ('key', 'title', 'updated_at')
    search_fields = ('key', 'title')


@admin.register(VendorAccessCode)
class VendorAccessCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'description', 'is_active', 'created_at')
    list_filter = ('is_active',)
