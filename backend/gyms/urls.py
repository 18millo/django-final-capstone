from django.urls import path
from . import views

urlpatterns = [
    path('', views.GymListView.as_view(), name='gym-list'),
    path('<int:pk>/', views.GymDetailView.as_view(), name='gym-detail'),
]
