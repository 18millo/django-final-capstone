from rest_framework import generics, permissions
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
        serializer.save(owner=self.request.user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Gym.objects.select_related('owner').all()
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        gym = self.get_object()
        if gym.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not own this gym')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not own this gym')
        instance.delete()
