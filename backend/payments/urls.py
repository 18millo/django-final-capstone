from django.urls import path
from . import views

urlpatterns = [
    path('paystack/initialize/', views.PaystackInitializeView.as_view(), name='paystack-initialize'),
    path('paystack/verify/', views.PaystackVerifyView.as_view(), name='paystack-verify'),
    path('paystack/webhook/', views.paystack_webhook, name='paystack-webhook'),
]
