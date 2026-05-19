from django.urls import path
from . import views

urlpatterns = [
    path('<int:product_id>/', views.ProductReviewListView.as_view(), name='product-reviews'),
    path('<int:product_id>/create/', views.CreateProductReviewView.as_view(), name='create-product-review'),
]
