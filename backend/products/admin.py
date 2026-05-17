from django.contrib import admin
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment


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
    list_display = ('name', 'brand', 'category', 'vendor', 'price', 'stock', 'discount_active', 'discount_percent', 'featured')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('category', 'brand', 'vendor', 'limited_edition', 'featured', 'discount_active')
    search_fields = ('name', 'brand')
    inlines = [ProductVariantInline, DropInline]


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
    list_display = ('id', 'user', 'status', 'total', 'created_at')
    list_filter = ('status',)


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'content', 'parent', 'created_at')
    list_filter = ('product',)
