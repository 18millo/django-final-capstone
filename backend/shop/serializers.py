from rest_framework import serializers
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils import timezone
from products.models import Product, Order
from .models import VendorProfile, VendorInvitation, VendorPremiumPlan, VendorSubscription, Brand


class VendorProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.CharField(source='user.display_name', read_only=True)

    class Meta:
        model = VendorProfile
        fields = (
            'id', 'user', 'user_email', 'username', 'display_name', 'avatar',
            'business_name', 'business_location', 'business_description',
            'latitude', 'longitude', 'created_at', 'updated_at',
        )
        read_only_fields = ('user', 'created_at', 'updated_at')
        extra_kwargs = {
            'avatar': {'required': False, 'allow_null': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        # Prefer vendor's own avatar
        if instance.avatar:
            url = instance.avatar.url
            data['avatar'] = request.build_absolute_uri(url) if request and not url.startswith('http') else url
        else:
            # Fallback to CombatHub profile avatar
            data['avatar'] = None
            try:
                profile = instance.user.profile
                if profile and profile.avatar:
                    av = profile.avatar
                    name = av.name
                    if name.startswith('http://') or name.startswith('https://'):
                        data['avatar'] = name
                    else:
                        url = av.url
                        data['avatar'] = request.build_absolute_uri(url) if request and not url.startswith('http') else url
            except Exception:
                pass
        return data


class ShopProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('vendor', 'created_at', 'updated_at', 'serial_number')
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
                    resolved.append(
                        request.build_absolute_uri(f'{settings.MEDIA_URL}{img}')
                        if request else f'{settings.MEDIA_URL}{img}'
                    )
            data['images'] = resolved
        return data

    def validate_images(self, value):
        if value is None or value == "":
            return []
        if isinstance(value, str):
            try:
                import json
                return json.loads(value)
            except Exception:
                return [value.strip()] if value.strip() else []
        if not isinstance(value, list):
            return [str(value)] if value else []
        return [img.strip() for img in value if img and str(img).strip()]

    def validate(self, data):
        from django.utils.text import slugify
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


class ShopOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_username = serializers.CharField(source='user.username', read_only=True)
    customer_display_name = serializers.CharField(source='user.display_name', read_only=True)
    customer_phone = serializers.CharField(source='user.profile.phone', read_only=True)
    customer_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('user', 'payment_intent', 'status', 'created_at', 'updated_at')

    def get_customer_avatar(self, obj):
        try:
            profile = obj.user.profile
            if profile and profile.avatar:
                avatar = profile.avatar
                name = avatar.name
                if name.startswith('http://') or name.startswith('https://'):
                    return name
                request = self.context.get('request')
                url = avatar.url
                if url.startswith('http'):
                    return url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None


class ShopLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')

        if user.role != 'vendor':
            raise serializers.ValidationError(
                'Only vendors can access the Shop. Athletes and other roles, '
                'please use the main CombatHub app.'
            )

        data['user'] = user
        return data


class ShopSSOSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            access = AccessToken(value)
            user_id = access.payload.get('user_id')
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(id=user_id, is_active=True).first()
            if not user:
                raise serializers.ValidationError('User not found.')
            return user
        except TokenError:
            raise serializers.ValidationError('Invalid or expired token.')


class VendorActivationSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=False, allow_blank=True)

    def validate_token(self, value):
        invitation = VendorInvitation.objects.filter(token=value).first()
        if not invitation:
            raise serializers.ValidationError('Invalid invitation token.')
        if not invitation.is_valid():
            if invitation.is_used:
                raise serializers.ValidationError('This invitation has already been used.')
            raise serializers.ValidationError('This invitation has expired.')
        return invitation

    def validate_username(self, value):
        if value:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError('This username is already taken.')
        return value


class ShopDashboardSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    in_stock_count = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    on_discount_count = serializers.IntegerField()
    recent_orders_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    follower_count = serializers.IntegerField()


class VendorPremiumPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorPremiumPlan
        fields = '__all__'


class VendorSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_slug = serializers.CharField(source='plan.slug', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price', read_only=True, max_digits=8, decimal_places=2)
    plan_max_products = serializers.IntegerField(source='plan.max_products', read_only=True)
    plan_max_images = serializers.IntegerField(source='plan.max_images_per_product', read_only=True)
    plan_discounts_allowed = serializers.BooleanField(source='plan.discounts_allowed', read_only=True)
    plan_analytics_available = serializers.BooleanField(source='plan.analytics_available', read_only=True)
    plan_is_free = serializers.BooleanField(source='plan.is_free', read_only=True)

    class Meta:
        model = VendorSubscription
        fields = (
            'id', 'plan', 'plan_name', 'plan_slug', 'plan_price',
            'plan_max_products', 'plan_max_images',
            'plan_discounts_allowed', 'plan_analytics_available',
            'plan_is_free',
            'status', 'is_active', 'is_trialing',
            'trial_end', 'current_period_start', 'current_period_end',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'status', 'is_active', 'is_trialing',
            'trial_end', 'current_period_start', 'current_period_end',
            'created_at', 'updated_at',
        )


class SubscribeSerializer(serializers.Serializer):
    plan_slug = serializers.CharField()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'description', 'logo', 'created_by', 'is_approved', 'created_at')
        read_only_fields = ('created_by', 'is_approved', 'created_at')
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
