import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Event, EventParticipant
from .serializers import (
    EventSerializer, EventParticipantSerializer,
    EventRegistrationSerializer, EventParticipantPublicSerializer,
)
from .utils import generate_ticket_qr, send_event_receipt


class EventListView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Event.objects.select_related('organizer').prefetch_related('participants').all()
        mine = self.request.query_params.get('mine')
        if mine and mine.lower() == 'true' and self.request.user.is_authenticated:
            qs = qs.filter(organizer=self.request.user)
        elif not self.request.user.is_staff and self.request.method == 'GET':
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

        existing = EventParticipant.objects.filter(event=event, user=request.user).first()
        if existing:
            if existing.payment_status == 'pending':
                return Response({
                    'error': 'Payment pending. Complete payment to confirm registration.',
                    'registration_id': existing.id,
                    'payment_required': event.entry_fee and event.entry_fee > 0,
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'Already registered'}, status=status.HTTP_400_BAD_REQUEST)

        if event.max_participants and event.participants.count() >= event.max_participants:
            return Response({'error': 'Event is full'}, status=status.HTTP_400_BAD_REQUEST)

        if event.registration_deadline and timezone.now() > event.registration_deadline:
            return Response({'error': 'Registration deadline has passed'}, status=status.HTTP_400_BAD_REQUEST)

        name = request.data.get('name', request.user.display_name or '')
        email = request.data.get('email', request.user.email)
        phone = request.data.get('phone', '')
        is_paid = event.entry_fee and event.entry_fee > 0

        participant = EventParticipant.objects.create(
            event=event,
            user=request.user,
            name=name or request.user.display_name or '',
            email=email or request.user.email,
            phone=phone or '',
            t_shirt_size=request.data.get('t_shirt_size', ''),
            dietary_requirements=request.data.get('dietary_requirements', ''),
            emergency_contact=request.data.get('emergency_contact', ''),
            emergency_phone=request.data.get('emergency_phone', ''),
            payment_status='pending' if is_paid else 'free',
            amount_paid=event.entry_fee if is_paid else None,
        )

        if is_paid:
            method = request.data.get('method', '')
            serializer = self.get_serializer(participant)
            return Response({
                **serializer.data,
                'payment_required': True,
                'amount': float(event.entry_fee),
                'currency': event.currency,
            }, status=status.HTTP_201_CREATED)

        generate_ticket_qr(participant)
        try:
            send_event_receipt(participant)
        except Exception:
            pass

        serializer = self.get_serializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            participant = EventParticipant.objects.get(
                event_id=pk, user=request.user, payment_status='pending'
            )
        except EventParticipant.DoesNotExist:
            return Response({'error': 'No pending registration found'}, status=status.HTTP_404_NOT_FOUND)

        event = participant.event
        if not event.entry_fee or event.entry_fee <= 0:
            return Response({'error': 'This event is free'}, status=status.HTTP_400_BAD_REQUEST)

        method = request.data.get('method', '').lower()
        if method != 'paystack':
            return Response({'error': 'Invalid payment method. Use paystack.'}, status=status.HTTP_400_BAD_REQUEST)

        reference = request.data.get('reference', '')
        if reference:
            from payments.views import _handle_context_payment
            from payments.utils import verify_transaction
            result = verify_transaction(reference)
            if not result.get('status') or result.get('data', {}).get('status') != 'success':
                return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                txn = participant.user.paystack_transactions.get(reference=reference)
                txn.status = 'success'
                txn.save()
            except Exception:
                pass
            participant.payment_status = 'completed'
            participant.payment_method = 'paystack'
            participant.amount_paid = event.entry_fee
            participant.payment_date = timezone.now()
            participant.transaction_id = reference
            participant.save()
            generate_ticket_qr(participant)
            try:
                send_event_receipt(participant)
            except Exception:
                pass
            serializer = EventParticipantSerializer(participant)
            return Response(serializer.data, status=status.HTTP_200_OK)

        from payments.models import PaystackTransaction
        from payments.utils import initialize_transaction
        ref = f'CH-{uuid.uuid4().hex[:12].upper()}'
        callback_url = f'{settings.FRONTEND_URL}/payment/callback'
        result = initialize_transaction(
            participant.email,
            float(event.entry_fee),
            ref,
            {'event_id': event.id, 'event_title': event.title, 'context': 'event'},
            callback_url,
        )
        if not result.get('status'):
            return Response({'error': result.get('message', 'Paystack init failed')}, status=status.HTTP_400_BAD_REQUEST)
        data = result['data']
        PaystackTransaction.objects.create(
            user=request.user,
            reference=ref,
            amount=event.entry_fee,
            currency='KES',
            status='pending',
            metadata={'event_id': event.id, 'event_title': event.title, 'context': 'event'},
            access_code=data.get('access_code', ''),
            authorization_url=data.get('authorization_url', ''),
        )
        return Response({
            'reference': ref,
            'authorization_url': data['authorization_url'],
        }, status=status.HTTP_200_OK)

        serializer = EventParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UnregisterFromEventView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        try:
            participant = EventParticipant.objects.get(event_id=pk, user=request.user)
            if participant.payment_status == 'completed':
                return Response(
                    {'error': 'Cannot unregister after payment. Contact organizer.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            participant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except EventParticipant.DoesNotExist:
            return Response({'error': 'Not registered'}, status=status.HTTP_404_NOT_FOUND)


class EventParticipantsListView(generics.ListAPIView):
    serializer_class = EventParticipantPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        return EventParticipant.objects.filter(event_id=pk).select_related('user').order_by('registered_at')


class EventFundsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if event.organizer != request.user and not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        completed = event.participants.filter(payment_status='completed')
        pending = event.participants.filter(payment_status='pending')

        return Response({
            'total_funds': float(completed.aggregate(total=models.Sum('amount_paid'))['total'] or 0),
            'expected_funds': float(event.total_funds),
            'completed_count': completed.count(),
            'pending_count': pending.count(),
            'total_registered': event.participants.count(),
            'currency': event.currency,
            'entry_fee': float(event.entry_fee) if event.entry_fee else 0,
        })
