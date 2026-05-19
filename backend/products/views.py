from django.db import models
from django.db.models import Prefetch
from django.utils import timezone
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status, permissions, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from common.permissions import IsVendor, IsSeller
from accounts.models import User
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    VendorProductSerializer,
    DropSerializer, CartSerializer, CartItemSerializer, OrderSerializer, FavoriteSerializer,
    ProductCommentSerializer,
)


class ProductListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = Product.objects.select_related('category').all()
        category = self.request.query_params.get('category')
        brand = self.request.query_params.get('brand')
        sport = self.request.query_params.get('sport')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        limited = self.request.query_params.get('limited')
        featured = self.request.query_params.get('featured')

        if category:
            qs = qs.filter(category__slug=category)
        if brand:
            qs = qs.filter(brand__iexact=brand)
        if sport:
            qs = qs.filter(sport_tags__contains=sport)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if limited:
            qs = qs.filter(limited_edition=True)
        if featured:
            qs = qs.filter(featured=True)

        if self.request.user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch('favorites', queryset=Favorite.objects.filter(user=self.request.user), to_attr='_user_favorites')
            )
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'id'

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = Product.objects.select_related('category', 'vendor__profile').all()
        if self.request.user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch('favorites', queryset=Favorite.objects.filter(user=self.request.user), to_attr='_user_favorites')
            )
        return qs


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()
    pagination_class = None

    @method_decorator(cache_page(60 * 30))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


class BrandListView(APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 30))
    def get(self, request):
        brands = Product.objects.values_list('brand', flat=True).distinct().order_by('brand')
        return Response([b for b in brands if b])


class DropListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DropSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return Drop.objects.filter(launch_time__gte=timezone.now()).select_related('product')[:20]


class DropNotifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, drop_id):
        drop = Drop.objects.filter(id=drop_id).first()
        if not drop:
            return Response({'error': 'Drop not found'}, status=404)
        _, created = DropNotification.objects.get_or_create(user=request.user, drop=drop)
        if created:
            return Response({'status': 'notified'}, status=201)
        return Response({'status': 'already notified'})


class CartDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartAddItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role == 'vendor':
            return Response({'error': 'Vendors cannot add items to cart'}, status=status.HTTP_403_FORBIDDEN)
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity', 1)

        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)

        variant = None
        if variant_id:
            variant = ProductVariant.objects.filter(id=variant_id, product=product).first()
            if not variant:
                return Response({'error': 'Variant not found'}, status=404)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        existing = cart.items.filter(product=product, variant=variant).first()
        if existing:
            existing.quantity += quantity
            existing.save()
        else:
            CartItem.objects.create(cart=cart, product=product, variant=variant, quantity=quantity)

        return Response(CartSerializer(cart, context={'request': request}).data, status=201)


class CartItemUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart not found'}, status=404)
        item = cart.items.filter(id=item_id).first()
        if not item:
            return Response({'error': 'Item not found'}, status=404)
        quantity = request.data.get('quantity')
        if quantity is not None and quantity > 0:
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart not found'}, status=404)
        item = cart.items.filter(id=item_id).first()
        if not item:
            return Response({'error': 'Item not found'}, status=404)
        item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart not found'}, status=404)
        cart.items.filter(id=item_id).delete()
        return Response(CartSerializer(cart).data)


class OrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class SellerOrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role not in ('vendor', 'coach', 'gym_owner'):
            return Order.objects.none()
        vendor_product_ids = list(Product.objects.filter(vendor=user).values_list('id', flat=True))
        all_orders = Order.objects.all().order_by('-created_at')
        matching = []
        for order in all_orders:
            for item in order.items:
                if item.get('product_id') in vendor_product_ids:
                    matching.append(order.id)
                    break
        return Order.objects.filter(id__in=matching).order_by('-created_at')


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role == 'vendor':
            return Response({'error': 'Vendors cannot place orders'}, status=status.HTTP_403_FORBIDDEN)
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        payment_method = request.data.get('payment_method', '')
        if payment_method not in ['mpesa', 'visa', '']:
            return Response({'error': 'Invalid payment method.'}, status=400)
        if not payment_method:
            return Response({'error': 'Select a payment method.'}, status=400)

        mpesa_phone = request.data.get('mpesa_phone', '')
        visa_last_four = request.data.get('visa_last_four', '')
        shipping_address = request.data.get('shipping_address', {})

        if payment_method == 'mpesa' and not mpesa_phone:
            return Response({'error': 'MPesa phone number is required.'}, status=400)
        if payment_method == 'visa' and not visa_last_four:
            return Response({'error': 'Visa card details are required.'}, status=400)

        items_data = []
        total = 0
        for item in cart.items.all():
            price = float(item.variant.price_override) if item.variant and item.variant.price_override else float(item.product.price)
            line_total = price * item.quantity
            total += line_total
            items_data.append({
                'product_id': item.product.id,
                'product_name': item.product.name,
                'variant': str(item.variant) if item.variant else None,
                'quantity': item.quantity,
                'unit_price': str(price),
                'total': str(line_total),
            })

        order = Order.objects.create(
            user=request.user,
            items=items_data,
            subtotal=str(total),
            total=str(total),
            status='pending',
            payment_method=payment_method,
            mpesa_phone=mpesa_phone,
            visa_last_four=visa_last_four,
            shipping_address=shipping_address,
        )

        # Notify sellers about the order
        from accounts.models import Notification
        seller_ids = set()
        for item in cart.items.all():
            product = item.product
            if product.vendor_id and product.vendor_id not in seller_ids:
                seller_ids.add(product.vendor_id)
                Notification.objects.create(
                    recipient=product.vendor,
                    actor=request.user,
                    notification_type='new_order',
                    message=f'New order received for {product.name} from {request.user.display_name or request.user.email}',
                )

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=201)


class FavoriteListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('product')
        return Response(FavoriteSerializer(favorites, many=True, context={'request': request}).data)


class FavoriteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        fav = Favorite.objects.filter(user=request.user, product=product).first()
        if fav:
            fav.delete()
            return Response({'favorited': False})
        Favorite.objects.create(user=request.user, product=product)
        return Response({'favorited': True}, status=201)


class VendorProductListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = VendorProductSerializer

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user)

    def perform_create(self, serializer):
        from common.permissions import IsPremium
        if not IsPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied(detail='Premium subscription required to sell products. Start your free trial today!')
        serializer.save(vendor=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = VendorProductSerializer

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user)

    def perform_update(self, serializer):
        from common.permissions import IsPremium
        if not IsPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied(detail='Premium subscription required to edit products.')
        serializer.save()

    def perform_destroy(self, instance):
        from common.permissions import IsPremium
        if not IsPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied(detail='Premium subscription required to delete products.')
        instance.delete()

    def get_serializer_context(self):
        return {'request': self.request}


class VendorProductToggleDiscountView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def post(self, request, product_id):
        from common.permissions import IsPremium
        if not IsPremium().has_permission(self.request, self):
            return Response({'error': 'Premium subscription required to manage discounts.'}, status=403)
        product = Product.objects.filter(id=product_id, vendor=request.user).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        product.discount_active = not product.discount_active
        product.save()
        return Response({'discount_active': product.discount_active})


class ProductImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def post(self, request):
        from common.permissions import IsPremium
        if not IsPremium().has_permission(self.request, self):
            return Response({'error': 'Premium subscription required to upload images.'}, status=403)
        file = request.FILES.get('image')
        category_slug = request.data.get('category', 'other')
        if not file:
            return Response({'error': 'No image provided'}, status=400)
        import uuid, os
        ext = os.path.splitext(file.name)[1] or '.jpg'
        category_folder = category_slug.replace(' ', '-').lower()
        filename = f'products/{category_folder}/{uuid.uuid4().hex}{ext}'
        path = os.path.join(settings.MEDIA_ROOT, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb+') as f:
            for chunk in file.chunks():
                f.write(chunk)
        url = request.build_absolute_uri(f'{settings.MEDIA_URL}{filename}')
        return Response({'url': url}, status=201)


class FollowedVendorProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        followed_vendors = User.objects.filter(
            followers__follower=request.user,
            role='vendor',
            is_active=True,
        )
        products = Product.objects.filter(vendor__in=followed_vendors, stock__gt=0)[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class ProductCommentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Comment cannot be empty'}, status=400)
        comment = ProductComment.objects.create(
            product=product,
            user=request.user,
            content=content,
            parent_id=request.data.get('parent'),
        )
        return Response(ProductCommentSerializer(comment, context={'request': request}).data, status=201)
