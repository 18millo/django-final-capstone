from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment
from products.models import Product as ProductModel


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class DropInline(admin.TabularInline):
    model = Drop
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'sport_tag', 'parent', 'order')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'brand', 'category', 'vendor', 'price', 'stock', 'discount_active', 'discount_percent', 'featured')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('category', 'brand', 'vendor', 'limited_edition', 'featured', 'discount_active')
    search_fields = ('name', 'brand')
    inlines = [ProductVariantInline, DropInline]
    readonly_fields = ('image_preview', 'all_images_preview', 'images')

    def image_preview(self, obj):
        if obj.images and len(obj.images) > 0:
            return format_html('<img src="{}" width="50" height="50" style="object-fit:cover;border-radius:6px" />', obj.images[0])
        return ''
    image_preview.short_description = 'Image'

    def all_images_preview(self, obj):
        if not obj.images:
            return ''
        html = ''
        for url in obj.images:
            html += '<img src="{}" width="100" height="100" style="object-fit:cover;border-radius:8px;margin:3px" />'.format(url)
        return format_html('<div style="display:flex;flex-wrap:wrap;gap:4px">{}</div>', html)
    all_images_preview.short_description = 'All Images'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'stock', 'price_override')


@admin.register(Drop)
class DropAdmin(admin.ModelAdmin):
    list_display = ('product', 'launch_time', 'max_quantity', 'countdown_active')


@admin.register(DropNotification)
class DropNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'drop', 'created_at')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'order_items_preview', 'status', 'payment_method', 'total_display', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('user__email', 'mpesa_phone')
    readonly_fields = ('order_items_detail',)

    def total_display(self, obj):
        return f'${float(obj.total):.2f}'
    total_display.short_description = 'Total'
    total_display.admin_order_field = 'total'

    def order_items_preview(self, obj):
        if not obj.items:
            return ''
        first = obj.items[0] if isinstance(obj.items, list) else obj.items.get(str(0), {})
        name = first.get('product_name', '') if isinstance(first, dict) else ''
        return format_html('<span style="font-size:11px">{}</span>', name[:40])
    order_items_preview.short_description = 'Items'

    def order_items_detail(self, obj):
        if not obj.items:
            return ''
        items = obj.items if isinstance(obj.items, list) else list(obj.items.values())
        html = '<div style="display:flex;flex-direction:column;gap:8px">'
        for item in items:
            name = item.get('product_name', 'Unknown')
            qty = item.get('quantity', 0)
            price = item.get('unit_price', '0')
            total = item.get('total', '0')
            html += '<div style="display:flex;align-items:center;gap:12px;padding:8px;border:1px solid #eee;border-radius:8px">'
            prod = ProductModel.objects.filter(id=item.get('product_id')).first()
            if prod and prod.images:
                html += '<img src="{}" width="50" height="50" style="object-fit:cover;border-radius:6px" />'.format(prod.images[0])
            html += '<div><strong>{}</strong><br/><span style="font-size:12px;color:#666">Qty: {} × ${} = ${}</span></div>'.format(name, qty, price, total)
            html += '</div>'
        html += '</div>'
        return format_html(html)
    order_items_detail.short_description = 'Order Items'


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'content', 'parent', 'created_at')
    list_filter = ('product',)
