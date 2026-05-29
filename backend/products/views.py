import uuid
from django.db import models
from django.db.models import Prefetch
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status, permissions, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from .models import Category, Product, ProductVariant, Drop, DropNotification, Cart, CartItem, Order, Favorite, ProductComment
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
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
        qs = Product.objects.select_related('category').filter(is_visible=True)
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
        if request.user.role == 'athlete':
            cart, _ = Cart.objects.get_or_create(user=request.user)
            return Response(CartSerializer(cart, context={'request': request}).data)
        return Response({'items': [], 'total': 0})


class CartAddItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role in ('vendor', 'coach', 'gym_owner'):
            return Response({'error': 'Only athletes can add items to cart'}, status=status.HTTP_403_FORBIDDEN)
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
        if request.user.role in ('vendor', 'coach', 'gym_owner'):
            return Response({'error': 'Only athletes can modify cart items'}, status=status.HTTP_403_FORBIDDEN)
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
        if request.user.role in ('vendor', 'coach', 'gym_owner'):
            return Response({'error': 'Only athletes can modify cart items'}, status=status.HTTP_403_FORBIDDEN)
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'error': 'Cart not found'}, status=404)
        item = cart.items.filter(id=item_id).first()
        if not item:
            return Response({'error': 'Item not found'}, status=404)
        item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)


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


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role in ('vendor', 'coach', 'gym_owner'):
            return Response({'error': 'Only athletes can place orders'}, status=status.HTTP_403_FORBIDDEN)
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        shipping_address = request.data.get('shipping_address', {})

        required_address_fields = ['line1', 'city', 'state', 'zip', 'country']
        missing = [f for f in required_address_fields if not shipping_address.get(f, '').strip()]
        if missing:
            return Response({'error': f'Missing shipping address fields: {", ".join(missing)}.'}, status=400)

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

        from payments.models import PaystackTransaction
        from payments.utils import initialize_transaction
        ref = f'CH-{uuid.uuid4().hex[:12].upper()}'
        callback_url = f'{settings.FRONTEND_URL}/payment/callback'
        order = Order.objects.create(
            user=request.user,
            items=items_data,
            subtotal=str(total),
            total=str(total),
            status='pending',
            payment_method='paystack',
            shipping_address=shipping_address,
        )
        result = initialize_transaction(
            request.user.email,
            float(total),
            ref,
            {'order_id': order.id, 'order_total': str(total), 'context': 'shop'},
            callback_url,
        )
        if not result.get('status'):
            order.delete()
            return Response({'error': result.get('message', 'Paystack init failed')}, status=400)
        data = result['data']
        PaystackTransaction.objects.create(
            user=request.user,
            reference=ref,
            amount=total,
            currency='KES',
            status='pending',
            metadata={'order_id': order.id, 'order_total': str(total), 'context': 'shop'},
            access_code=data.get('access_code', ''),
            authorization_url=data.get('authorization_url', ''),
        )

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
                try:
                    send_mail(
                        subject=f'New Order Received — CombatHub',
                        message=(
                            f'Hi {product.vendor.display_name or product.vendor.username},\n\n'
                            f'You have received a new order for {product.name}!\n\n'
                            f'Customer: {request.user.display_name or request.user.email}\n'
                            f'Order total: ${float(total):.2f}\n\n'
                            f'View your orders at:\n'
                            f'{settings.SHOP_URL}/orders\n\n'
                            f'- The CombatHub Team'
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[product.vendor.email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

        cart.items.all().delete()
        return Response({
            'paystack': True,
            'reference': ref,
            'authorization_url': data['authorization_url'],
            'order_id': order.id,
        }, status=200)


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
