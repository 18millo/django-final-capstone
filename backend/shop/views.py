import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from common.permissions import IsVendor, IsSeller, IsAdmin
from products.models import Product, Order
from .models import VendorProfile, VendorInvitation, VendorPremiumPlan, VendorSubscription, Brand


class HasVendorPremium(permissions.BasePermission):
    """Checks that the authenticated vendor has an active subscription."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role != 'vendor':
            return False
        profile = VendorProfile.ensure_for_user(request.user)
        sub = getattr(profile, 'subscription', None)
        if not sub:
            return False
        return sub.is_active

from .serializers import (
    VendorProfileSerializer, ShopProductSerializer, ShopOrderSerializer,
    ShopLoginSerializer, ShopSSOSerializer, VendorActivationSerializer,
    ShopDashboardSerializer, VendorPremiumPlanSerializer,
    VendorSubscriptionSerializer, SubscribeSerializer, BrandSerializer,
)


# ─── Auth Views ───────────────────────────────────────────────

class ShopLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ShopLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        VendorProfile.ensure_for_user(user)

        avatar_url = None
        try:
            profile = getattr(user, 'profile', None)
            if profile and profile.avatar:
                url = profile.avatar.url
                avatar_url = request.build_absolute_uri(url) if not url.startswith('http') else url
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'display_name': user.display_name,
                'role': user.role,
                'avatar': avatar_url,
            },
        })


class ShopSSOView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ShopSSOSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['token']

        if user.role == 'vendor':
            VendorProfile.ensure_for_user(user)

        avatar_url = None
        try:
            profile = getattr(user, 'profile', None)
            if profile and profile.avatar:
                url = profile.avatar.url
                avatar_url = request.build_absolute_uri(url) if not url.startswith('http') else url
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'display_name': user.display_name,
                'role': user.role,
                'avatar': avatar_url,
            },
        })


class VendorActivateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VendorActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = serializer.validated_data['token']
        password = serializer.validated_data['password']
        username = serializer.validated_data.get('username', '')

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        email = invitation.email
        user = UserModel.objects.filter(email=email).first()

        if not user:
            user = UserModel(
                email=email,
                username=username or email.split('@')[0],
                role='vendor',
                is_active=True,
                display_name=username or email.split('@')[0],
                email_verified=True,
            )
            user.set_password(password)
            user.save()
        else:
            if user.role != 'vendor':
                user.role = 'vendor'
            user.set_password(password)
            user.save()

        VendorProfile.ensure_for_user(user)

        invitation.is_used = True
        invitation.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'display_name': user.display_name,
                'role': user.role,
            },
        }, status=201)


class ShopMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        avatar_url = None
        try:
            if user.role == 'vendor':
                vp = VendorProfile.ensure_for_user(user)
                if vp.avatar:
                    url = vp.avatar.url
                    avatar_url = request.build_absolute_uri(url) if not url.startswith('http') else url
            if not avatar_url:
                profile = getattr(user, 'profile', None)
                if profile and profile.avatar:
                    url = profile.avatar.url
                    avatar_url = request.build_absolute_uri(url) if not url.startswith('http') else url
        except Exception:
            pass

        vendor_premium = False
        if user.role == 'vendor':
            try:
                vp = VendorProfile.ensure_for_user(user)
                sub = getattr(vp, 'subscription', None)
                if sub:
                    vendor_premium = sub.is_active
            except Exception:
                pass

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'display_name': user.display_name,
            'role': user.role,
            'avatar': avatar_url,
            'vendor_premium': vendor_premium,
        })


# ─── Vendor Profile ───────────────────────────────────────────

class VendorProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    serializer_class = VendorProfileSerializer

    def get_object(self):
        return VendorProfile.ensure_for_user(self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class VendorProfileRemoveAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request):
        profile = VendorProfile.ensure_for_user(request.user)
        if profile.avatar:
            profile.avatar.delete()
            profile.avatar = None
            profile.save()
        return Response({'message': 'Avatar removed'})


# ─── Product Management ──────────────────────────────────────

class ShopProductListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    serializer_class = ShopProductSerializer

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        if not HasVendorPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied(
                'Premium subscription required to sell products. Start your free trial today!'
            )
        serializer.save(vendor=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class ShopProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    serializer_class = ShopProductSerializer

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user)

    def perform_update(self, serializer):
        if not HasVendorPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied('Premium subscription required to edit products.')
        serializer.save()

    def perform_destroy(self, instance):
        if not HasVendorPremium().has_permission(self.request, self):
            raise permissions.exceptions.PermissionDenied('Premium subscription required to delete products.')
        instance.delete()

    def get_serializer_context(self):
        return {'request': self.request}


class ShopProductToggleDiscountView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request, product_id):
        if not HasVendorPremium().has_permission(self.request, self):
            return Response({'error': 'Premium subscription required to manage discounts.'}, status=403)
        product = Product.objects.filter(id=product_id, vendor=request.user).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        product.discount_active = not product.discount_active
        product.save()
        return Response({'discount_active': product.discount_active})


class ShopProductToggleVisibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request, product_id):
        product = Product.objects.filter(id=product_id, vendor=request.user).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        product.is_visible = not product.is_visible
        product.save()
        return Response({'is_visible': product.is_visible})


class ShopProductImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request):
        if not HasVendorPremium().has_permission(self.request, self):
            return Response({'error': 'Premium subscription required to upload images.'}, status=403)
        file = request.FILES.get('image')
        category_slug = request.data.get('category', 'other')
        if not file:
            return Response({'error': 'No image provided'}, status=400)
        import uuid as uuid_lib, os
        ext = os.path.splitext(file.name)[1] or '.jpg'
        category_folder = category_slug.replace(' ', '-').lower()
        filename = f'products/{category_folder}/{uuid_lib.uuid4().hex}{ext}'
        path = os.path.join(settings.MEDIA_ROOT, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb+') as f:
            for chunk in file.chunks():
                f.write(chunk)
        url = request.build_absolute_uri(f'{settings.MEDIA_URL}{filename}')
        return Response({'url': url}, status=201)


# ─── Brands ──────────────────────────────────────────────────

class BrandListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    serializer_class = BrandSerializer

    def get_queryset(self):
        return Brand.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ─── Order Management ────────────────────────────────────────

class ShopOrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller, HasVendorPremium]
    serializer_class = ShopOrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role not in ('vendor', 'coach', 'gym_owner'):
            return Order.objects.none()
        vendor_product_ids = list(
            Product.objects.filter(vendor=user).values_list('id', flat=True)
        )
        all_orders = Order.objects.all().order_by('-created_at')
        matching = []
        for order in all_orders:
            for item in order.items:
                if item.get('product_id') in vendor_product_ids:
                    matching.append(order.id)
                    break
        return Order.objects.filter(id__in=matching).order_by('-created_at')

    def get_serializer_context(self):
        return {'request': self.request}


class ShopOrderConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller, HasVendorPremium]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        vendor_product_ids = list(
            Product.objects.filter(vendor=request.user).values_list('id', flat=True)
        )
        has_vendor_product = any(
            item.get('product_id') in vendor_product_ids for item in order.items
        )
        if not has_vendor_product:
            return Response({'error': 'This order does not contain your products'}, status=403)

        if order.status != 'pending':
            return Response({'error': 'Order has already been confirmed or processed'}, status=400)

        order.status = 'confirmed'
        order.save()

        shop_url = getattr(settings, 'SHOP_URL', settings.FRONTEND_URL)

        items_summary = '\n'.join(
            f"  • {item.get('product_name', 'Item')} x{item.get('quantity', 1)} — "
            f"${float(item.get('total', 0)):.2f}"
            for item in order.items
        )
        addr = order.shipping_address or {}
        ship_str = (
            f"{addr.get('line1', '')}\n{addr.get('line2', '')}\n"
            f"{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}\n"
            f"{addr.get('country', '')}"
        ).strip()

        try:
            send_mail(
                subject=f'Order #{order.id} Confirmed — CombatHub',
                message=(
                    f'Hi {order.user.display_name or order.user.username or order.user.email},\n\n'
                    f'Your order #{order.id} has been confirmed by the seller!\n\n'
                    f'Items:\n{items_summary}\n\n'
                    f'Total: ${float(order.total):.2f}\n'
                    f'Payment: {order.payment_method.upper()}\n\n'
                    f'Shipping to:\n{ship_str}\n\n'
                    f'You can track your order status anytime at:\n'
                    f'{settings.FRONTEND_URL}/orders/{order.id}\n\n'
                    f'Thank you for shopping on CombatHub!\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.user.email],
                fail_silently=False,
            )
        except Exception:
            pass

        serializer = ShopOrderSerializer(order, context={'request': request})
        return Response(serializer.data)


# ─── Dashboard ───────────────────────────────────────────────

class ShopDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller, HasVendorPremium]

    def get(self, request):
        user = request.user
        if user.role != 'vendor':
            return Response({'error': 'Only vendors can access this dashboard'}, status=403)

        vendor_product_ids = list(
            Product.objects.filter(vendor=user).values_list('id', flat=True)
        )
        products = Product.objects.filter(vendor=user)
        total_products = products.count()
        in_stock = products.filter(stock__gt=0).count()
        low_stock = products.filter(stock__lte=5, stock__gt=0).count()
        on_discount = products.filter(discount_active=True).count()

        all_orders = Order.objects.all().order_by('-created_at')
        recent_order_ids = []
        total_revenue = Decimal('0.00')
        recent_count = 0
        for order in all_orders:
            for item in order.items:
                if item.get('product_id') in vendor_product_ids:
                    if order.id not in recent_order_ids:
                        recent_order_ids.append(order.id)
                        if order.status in ('paid', 'confirmed'):
                            total_revenue += Decimal(str(order.total))
                        if recent_count < 10:
                            recent_count += 1
                    break

        follower_count = User.objects.filter(
            following__following=user, is_active=True
        ).count()

        data = {
            'total_products': total_products,
            'in_stock_count': in_stock,
            'low_stock_count': low_stock,
            'on_discount_count': on_discount,
            'recent_orders_count': len(recent_order_ids),
            'total_revenue': f'{total_revenue:.2f}',
            'follower_count': follower_count,
        }
        serializer = ShopDashboardSerializer(data)
        return Response(serializer.data)


# ─── Premium / Subscription ─────────────────────────────────────


class VendorPremiumPlanListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = VendorPremiumPlanSerializer
    queryset = VendorPremiumPlan.objects.filter(is_active=True)


class VendorSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get(self, request):
        profile = VendorProfile.ensure_for_user(request.user)
        sub = getattr(profile, 'subscription', None)
        if not sub:
            plan = VendorPremiumPlan.objects.filter(is_free=True, is_active=True).first()
            if plan:
                from django.utils import timezone
                now = timezone.now()
                sub = VendorSubscription.objects.create(
                    vendor_profile=profile,
                    plan=plan,
                    status='active',
                    current_period_start=now,
                    current_period_end=now + timezone.timedelta(days=365 * 10),
                )
        if not sub:
            return Response({'error': 'No subscription found and no free plan available'}, status=404)
        serializer = VendorSubscriptionSerializer(sub)
        return Response(serializer.data)


class VendorSubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = VendorPremiumPlan.objects.filter(
            slug=serializer.validated_data['plan_slug'],
            is_active=True,
        ).first()
        if not plan:
            return Response({'error': 'Plan not found'}, status=404)

        profile = VendorProfile.ensure_for_user(request.user)
        sub = getattr(profile, 'subscription', None)
        now = timezone.now()

        if plan.is_free:
            period_end = now + timezone.timedelta(days=365 * 10)
            if sub:
                sub.plan = plan
                sub.status = 'active'
                sub.current_period_start = now
                sub.current_period_end = period_end
                sub.trial_end = None
                sub.save()
            else:
                sub = VendorSubscription.objects.create(
                    vendor_profile=profile,
                    plan=plan,
                    status='active',
                    current_period_start=now,
                    current_period_end=period_end,
                )
        res_serializer = VendorSubscriptionSerializer(sub)
        return Response(res_serializer.data)


# ─── Admin Brand Management ───────────────────────────────────


class AdminBrandListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        brands = Brand.objects.all().order_by('-created_at')
        serializer = BrandSerializer(brands, many=True, context={'request': request})
        return Response(serializer.data)


class AdminBrandApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        brand = get_object_or_404(Brand, pk=pk)
        brand.is_approved = not brand.is_approved
        brand.save(update_fields=['is_approved'])
        serializer = BrandSerializer(brand, context={'request': request})
        return Response(serializer.data)

        # Paid plan — start a 14-day trial
        trial_end = now + timezone.timedelta(days=14)
        period_end = trial_end
        if sub:
            sub.plan = plan
            sub.status = 'trialing'
            sub.trial_end = trial_end
            sub.current_period_start = now
            sub.current_period_end = period_end
            sub.save()
        else:
            sub = VendorSubscription.objects.create(
                vendor_profile=profile,
                plan=plan,
                status='trialing',
                trial_end=trial_end,
                current_period_start=now,
                current_period_end=period_end,
            )
        res_serializer = VendorSubscriptionSerializer(sub)
        return Response(res_serializer.data)


class VendorCancelSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request):
        profile = VendorProfile.ensure_for_user(request.user)
        sub = getattr(profile, 'subscription', None)
        if not sub:
            return Response({'error': 'No active subscription'}, status=404)

        free_plan = VendorPremiumPlan.objects.filter(is_free=True, is_active=True).first()
        if sub.plan and sub.plan.is_free:
            return Response({'error': 'You are already on the Free plan'}, status=400)

        now = timezone.now()
        if free_plan:
            sub.plan = free_plan
            sub.status = 'active'
            sub.trial_end = None
            sub.current_period_start = now
            sub.current_period_end = now + timezone.timedelta(days=365 * 10)
            sub.save()
        else:
            sub.status = 'canceled'
            sub.current_period_end = now
            sub.save()

        res_serializer = VendorSubscriptionSerializer(sub)
        return Response(res_serializer.data)
