from django.contrib import admin
from .models import PaystackTransaction


@admin.register(PaystackTransaction)
class PaystackTransactionAdmin(admin.ModelAdmin):
    list_display = ('reference', 'user', 'amount', 'currency', 'status', 'channel', 'created_at')
    list_filter = ('status', 'channel', 'currency')
    search_fields = ('reference', 'user__email')
    readonly_fields = ('reference', 'access_code', 'authorization_url', 'created_at', 'updated_at')
