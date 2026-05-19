from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListView.as_view(), name='event-list'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    path('<int:pk>/register/', views.RegisterForEventView.as_view(), name='event-register'),
    path('<int:pk>/unregister/', views.UnregisterFromEventView.as_view(), name='event-unregister'),
]
