from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Gym
from .serializers import GymSerializer


class GymListView(generics.ListCreateAPIView):
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Gym.objects.select_related('owner').all()
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(city__icontains=city)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'gym_owner' and not user.profile.is_premium_active():
            raise PermissionDenied('Premium membership is required to create a gym listing')
        serializer.save(owner=user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Gym.objects.select_related('owner').all()
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        gym = self.get_object()
        if gym.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied('You do not own this gym')
        if self.request.user.role == 'gym_owner' and not self.request.user.profile.is_premium_active():
            raise PermissionDenied('Premium membership is required to update a gym listing')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied('You do not own this gym')
        if self.request.user.role == 'gym_owner' and not self.request.user.profile.is_premium_active():
            raise PermissionDenied('Premium membership is required to delete a gym listing')
        instance.delete()
