from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('shop/auth/login/', views.ShopLoginView.as_view(), name='shop-login'),
    path('shop/auth/sso/', views.ShopSSOView.as_view(), name='shop-sso'),
    path('shop/auth/activate/', views.VendorActivateView.as_view(), name='shop-activate'),
    path('shop/auth/me/', views.ShopMeView.as_view(), name='shop-me'),

    # Profile
    path('shop/profile/', views.VendorProfileView.as_view(), name='shop-profile'),
    path('shop/profile/remove-avatar/', views.VendorProfileRemoveAvatarView.as_view(), name='shop-profile-remove-avatar'),

    # Dashboard
    path('shop/dashboard/', views.ShopDashboardView.as_view(), name='shop-dashboard'),

    # Products
    path('shop/products/', views.ShopProductListView.as_view(), name='shop-product-list'),
    path('shop/products/<int:pk>/', views.ShopProductDetailView.as_view(), name='shop-product-detail'),
    path('shop/products/<int:product_id>/toggle-discount/',
         views.ShopProductToggleDiscountView.as_view(),
         name='shop-product-toggle-discount'),
    path('shop/products/<int:product_id>/toggle-visibility/',
         views.ShopProductToggleVisibilityView.as_view(),
         name='shop-product-toggle-visibility'),
    path('shop/upload/', views.ShopProductImageUploadView.as_view(), name='shop-image-upload'),

    # Orders
    path('shop/orders/', views.ShopOrderListView.as_view(), name='shop-order-list'),
    path('shop/orders/<int:pk>/confirm/', views.ShopOrderConfirmView.as_view(), name='shop-order-confirm'),

    # Premium / Subscription
    path('shop/premium/plans/', views.VendorPremiumPlanListView.as_view(), name='shop-premium-plans'),
    path('shop/premium/subscription/', views.VendorSubscriptionView.as_view(), name='shop-premium-subscription'),
    path('shop/premium/subscribe/', views.VendorSubscribeView.as_view(), name='shop-premium-subscribe'),
    path('shop/premium/cancel/', views.VendorCancelSubscriptionView.as_view(), name='shop-premium-cancel'),

    # Brands
    path('shop/brands/', views.BrandListCreateView.as_view(), name='shop-brands'),

    # Admin Brand Management
    path('shop/admin/brands/', views.AdminBrandListView.as_view(), name='shop-admin-brands'),
    path('shop/admin/brands/<int:pk>/toggle-approval/', views.AdminBrandApproveView.as_view(), name='shop-admin-brand-toggle'),
]
