from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'body', 'content_type', 'created_at')
    list_filter = ('content_type', 'created_at')
    search_fields = ('user__email', 'body')
