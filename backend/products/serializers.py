from django.conf import settings
from rest_framework import serializers
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment
from accounts.serializers import PublicUserSerializer, resolve_avatar


class VendorInfoSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='vendor.id')
    username = serializers.CharField(source='vendor.username')
    business_name = serializers.SerializerMethodField()
    business_location = serializers.SerializerMethodField()
    business_description = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    def get_business_name(self, obj):
        try:
            return obj.vendor.vendor_profile.business_name
        except Exception:
            return ''

    def get_business_location(self, obj):
        try:
            return obj.vendor.vendor_profile.business_location
        except Exception:
            return ''

    def get_business_description(self, obj):
        try:
            return obj.vendor.vendor_profile.business_description
        except Exception:
            return ''

    def get_latitude(self, obj):
        try:
            return obj.vendor.vendor_profile.latitude
        except Exception:
            return None

    def get_longitude(self, obj):
        try:
            return obj.vendor.vendor_profile.longitude
        except Exception:
            return None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.IntegerField(source='category_id', read_only=True)
    category_name = serializers.CharField(source='category.name', default='')
    is_favorited = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'brand', 'category', 'category_name', 'price', 'images',
                  'stock', 'limited_edition', 'featured', 'created_at', 'is_favorited',
                  'discount_active', 'discount_percent')

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_favs = getattr(obj, '_user_favorites', None)
            if user_favs is not None:
                return len(user_favs) > 0
            return obj.favorites.filter(user=request.user).exists()
        return False

    def get_images(self, obj):
        request = self.context.get('request')
        if not obj.images:
            return []
        result = []
        for img in obj.images:
            if not img:
                continue
            if img.startswith('http://') or img.startswith('https://'):
                result.append(img)
            else:
                result.append(request.build_absolute_uri(f'{settings.MEDIA_URL}{img}') if request else f'{settings.MEDIA_URL}{img}')
        return result


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    vendor_info = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_favs = getattr(obj, '_user_favorites', None)
            if user_favs is not None:
                return len(user_favs) > 0
            return obj.favorites.filter(user=request.user).exists()
        return False

    def get_comments(self, obj):
        qs = obj.comments.filter(parent__isnull=True)
        return ProductCommentSerializer(qs, many=True, context=self.context).data

    def get_vendor_info(self, obj):
        if not obj.vendor or obj.vendor.role != 'vendor':
            return None
        try:
            vp = obj.vendor.vendor_profile
            return {
                'id': obj.vendor.id,
                'username': obj.vendor.username or '',
                'business_name': vp.business_name or '',
                'business_location': vp.business_location or '',
                'business_description': vp.business_description or '',
                'latitude': vp.latitude,
                'longitude': vp.longitude,
            }
        except Exception:
            return {
                'id': obj.vendor.id,
                'username': obj.vendor.username or '',
                'business_name': '',
                'business_location': '',
                'business_description': '',
                'latitude': None,
                'longitude': None,
            }

    def get_images(self, obj):
        request = self.context.get('request')
        if not obj.images:
            return []
        result = []
        for img in obj.images:
            if not img:
                continue
            if img.startswith('http://') or img.startswith('https://'):
                result.append(img)
            else:
                result.append(request.build_absolute_uri(f'{settings.MEDIA_URL}{img}') if request else f'{settings.MEDIA_URL}{img}')
        return result



class DropSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    notified = serializers.SerializerMethodField()

    class Meta:
        model = Drop
        fields = '__all__'

    def get_notified(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.notifications.filter(user=request.user).exists()
        return False


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'product_image', 'variant', 'quantity', 'unit_price', 'total')

    def get_product_image(self, obj):
        images = obj.product.images
        if not images:
            return None
        img = images[0]
        if not img:
            return None
        if img.startswith('http://') or img.startswith('https://'):
            return img
        request = self.context.get('request')
        return request.build_absolute_uri(f'{settings.MEDIA_URL}{img}') if request else f'{settings.MEDIA_URL}{img}'

    def get_unit_price(self, obj):
        if obj.variant and obj.variant.price_override:
            return str(obj.variant.price_override)
        p = obj.product
        if p.discount_active and p.discount_percent:
            return str(p.effective_price)
        return str(p.price)

    def get_total(self, obj):
        return str(obj.total_price())


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total', 'created_at', 'updated_at')

    def get_total(self, obj):
        return str(sum(item.total_price() for item in obj.items.all()))


class OrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_username = serializers.CharField(source='user.username', read_only=True)
    customer_display_name = serializers.CharField(source='user.display_name', read_only=True)
    customer_phone = serializers.CharField(source='user.profile.phone', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('user', 'payment_intent', 'status', 'created_at', 'updated_at')


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'product', 'created_at')


class ProductCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ProductComment
        fields = ('id', 'product', 'user', 'user_name', 'user_role', 'user_avatar', 'content', 'parent', 'replies', 'created_at')
        read_only_fields = ('user',)

    def get_user_name(self, obj):
        return obj.user.display_name or obj.user.username or obj.user.email.split('@')[0]

    def get_user_avatar(self, obj):
        return resolve_avatar(obj.user.profile, self.context.get('request'))

    def get_replies(self, obj):
        if obj.parent is not None:
            return []
        replies = obj.replies.all()
        return ProductCommentSerializer(replies, many=True).data
