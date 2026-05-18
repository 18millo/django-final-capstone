from django.conf import settings
from rest_framework import serializers
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment
from accounts.serializers import PublicUserSerializer, resolve_avatar


class VendorInfoSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='vendor.id')
    username = serializers.CharField(source='vendor.username')
    business_name = serializers.CharField(source='vendor.profile.business_name', default='')
    business_location = serializers.CharField(source='vendor.profile.business_location', default='')
    business_description = serializers.CharField(source='vendor.profile.business_description', default='')
    latitude = serializers.FloatField(source='vendor.profile.latitude', default=None)
    longitude = serializers.FloatField(source='vendor.profile.longitude', default=None)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', default='')
    is_favorited = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'brand', 'category_name', 'price', 'images',
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
        p = obj.vendor.profile
        return {
            'id': obj.vendor.id,
            'username': obj.vendor.username or '',
            'business_name': p.business_name or '',
            'business_location': p.business_location or '',
            'business_description': p.business_description or '',
            'latitude': p.latitude,
            'longitude': p.longitude,
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


class VendorProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('vendor', 'created_at', 'updated_at')
        extra_kwargs = {
            'slug': {'required': False},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        images = data.get('images')
        if not images:
            data['images'] = []
        else:
            resolved = []
            for img in images:
                if not img:
                    continue
                if img.startswith('http://') or img.startswith('https://'):
                    resolved.append(img)
                else:
                    resolved.append(request.build_absolute_uri(f'{settings.MEDIA_URL}{img}') if request else f'{settings.MEDIA_URL}{img}')
            data['images'] = resolved
        return data

    def validate_images(self, value):
        if value is None or value == "":
            return []
        if isinstance(value, str):
            try:
                import json
                return json.loads(value)
            except:
                return [value.strip()] if value.strip() else []
        if not isinstance(value, list):
            return [str(value)] if value else []
        return [img.strip() for img in value if img and str(img).strip()]

    def validate(self, data):
        from django.utils.text import slugify
        
        # 1. Handle Name and Slug
        name = data.get('name', 'product')
        if not name:
            name = 'product'
        
        slug = data.get('slug', '').strip()
        if not slug:
            slug = slugify(name)
            
        import random
        import string
        while Product.objects.filter(slug=slug).exists():
            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            slug = f"{slugify(name)}-{random_str}"
        data['slug'] = slug

        # 2. Force numeric types to prevent 400 errors from string-numbers
        for field in ['price', 'stock', 'discount_percent']:
            if field in data and data[field] is not None:
                try:
                    data[field] = float(data[field])
                except (ValueError, TypeError):
                    data[field] = 0.0 if field == 'price' else 0

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['vendor'] = request.user
        return super().create(validated_data)




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
