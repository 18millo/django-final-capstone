from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Event, EventParticipant
from .serializers import EventSerializer, EventParticipantSerializer


class EventListView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Event.objects.select_related('organizer').prefetch_related('participants').all()
        if not self.request.user.is_staff and self.request.method == 'GET':
            qs = qs.filter(is_published=True)
        event_type = self.request.query_params.get('type')
        if event_type:
            qs = qs.filter(event_type=event_type)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(city__icontains=city)
        upcoming = self.request.query_params.get('upcoming')
        if upcoming and upcoming.lower() == 'true':
            qs = qs.filter(start_date__gte=timezone.now())
        return qs.order_by('start_date')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.select_related('organizer').prefetch_related('participants').all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_update(self, serializer):
        event = self.get_object()
        if event.organizer != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not own this event')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.organizer != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not own this event')
        instance.delete()


class RegisterForEventView(generics.CreateAPIView):
    serializer_class = EventParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        try:
            event = Event.objects.get(pk=pk, is_published=True)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if EventParticipant.objects.filter(event=event, user=request.user).exists():
            return Response({'error': 'Already registered'}, status=status.HTTP_400_BAD_REQUEST)

        if event.max_participants and event.participants.count() >= event.max_participants:
            return Response({'error': 'Event is full'}, status=status.HTTP_400_BAD_REQUEST)

        if event.registration_deadline and timezone.now() > event.registration_deadline:
            return Response({'error': 'Registration deadline has passed'}, status=status.HTTP_400_BAD_REQUEST)

        participant = EventParticipant.objects.create(event=event, user=request.user)
        serializer = self.get_serializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UnregisterFromEventView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        try:
            participant = EventParticipant.objects.get(event_id=pk, user=request.user)
            participant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except EventParticipant.DoesNotExist:
            return Response({'error': 'Not registered'}, status=status.HTTP_404_NOT_FOUND)
