from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<int:id>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:product_id>/favorite/', views.FavoriteToggleView.as_view(), name='product-favorite'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('brands/', views.BrandListView.as_view(), name='brand-list'),
    path('drops/active/', views.DropListView.as_view(), name='drop-list'),
    path('drops/<int:drop_id>/notify/', views.DropNotifyView.as_view(), name='drop-notify'),
    path('cart/', views.CartDetailView.as_view(), name='cart-detail'),
    path('cart/add/', views.CartAddItemView.as_view(), name='cart-add'),
    path('cart/items/<int:item_id>/', views.CartItemUpdateView.as_view(), name='cart-item-update'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('seller/orders/', views.SellerOrderListView.as_view(), name='seller-order-list'),
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('vendor/products/', views.VendorProductListView.as_view(), name='vendor-product-list'),
    path('vendor/products/<int:pk>/', views.VendorProductDetailView.as_view(), name='vendor-product-detail'),
    path('vendor/products/<int:product_id>/toggle-discount/', views.VendorProductToggleDiscountView.as_view(), name='vendor-product-toggle-discount'),
    path('vendor/upload/', views.ProductImageUploadView.as_view(), name='product-image-upload'),
    path('products/followed-vendors/', views.FollowedVendorProductsView.as_view(), name='followed-vendor-products'),
    path('products/<int:product_id>/comments/', views.ProductCommentListView.as_view(), name='product-comments'),
]
