import json
import uuid
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PaystackTransaction
from .utils import (
    initialize_transaction,
    verify_transaction,
    verify_webhook_signature,
    send_payment_notification_email,
)


class PaystackInitializeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        metadata = request.data.get('metadata', {})
        email = request.data.get('email', request.user.email)

        if not amount or float(amount) <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        amount = float(amount)
        reference = f'CH-{uuid.uuid4().hex[:12].upper()}'

        callback_url = request.data.get(
            'callback_url',
            f'{settings.FRONTEND_URL}/payment/callback'
        )

        result = initialize_transaction(email, amount, reference, metadata, callback_url)

        if not result.get('status'):
            return Response({'error': result.get('message', 'Paystack init failed')}, status=status.HTTP_400_BAD_REQUEST)

        data = result['data']
        txn = PaystackTransaction.objects.create(
            user=request.user,
            reference=reference,
            amount=amount,
            currency='KES',
            status='pending',
            metadata=metadata,
            access_code=data.get('access_code', ''),
            authorization_url=data.get('authorization_url', ''),
        )

        return Response({
            'reference': reference,
            'authorization_url': data['authorization_url'],
            'access_code': data.get('access_code'),
            'transaction_id': txn.id,
        }, status=status.HTTP_201_CREATED)


class PaystackVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        reference = request.query_params.get('reference')
        if not reference:
            return Response({'error': 'Reference is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            txn = PaystackTransaction.objects.get(reference=reference)
        except PaystackTransaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

        result = verify_transaction(reference)

        if not result.get('status'):
            return Response({'error': result.get('message', 'Verification failed')}, status=status.HTTP_400_BAD_REQUEST)

        data = result['data']
        new_status = 'success' if data['status'] == 'success' else 'failed'
        txn.status = new_status
        if data.get('paid_at'):
            txn.paid_at = data['paid_at']
        txn.channel = data.get('channel', '')
        txn.save()

        send_payment_notification_email(
            txn.metadata.get('email', txn.user.email if txn.user else ''),
            float(txn.amount), reference, new_status, txn.metadata
        )

        _handle_context_payment(txn)

        return Response({
            'status': txn.status,
            'reference': reference,
            'amount': float(txn.amount),
            'currency': txn.currency,
            'channel': txn.channel,
            'paid_at': txn.paid_at,
            'metadata': txn.metadata,
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def paystack_webhook(request):
    signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
    body = request.body

    if not verify_webhook_signature(body, signature):
        return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)

    event = json.loads(body)
    if event.get('event') == 'charge.success':
        data = event['data']
        reference = data.get('reference')
        if reference:
            try:
                txn = PaystackTransaction.objects.get(reference=reference)
                txn.status = 'success'
                txn.paid_at = data.get('paid_at')
                txn.channel = data.get('channel', '')
                txn.save()

                send_payment_notification_email(
                    data.get('customer', {}).get('email', ''),
                    float(txn.amount), reference, 'success', txn.metadata
                )

                _handle_context_payment(txn)
            except PaystackTransaction.DoesNotExist:
                pass
    elif event.get('event') == 'charge.failed':
        data = event['data']
        reference = data.get('reference')
        if reference:
            try:
                txn = PaystackTransaction.objects.get(reference=reference)
                txn.status = 'failed'
                txn.save()

                send_payment_notification_email(
                    data.get('customer', {}).get('email', ''),
                    float(txn.amount), reference, 'failed', txn.metadata
                )
            except PaystackTransaction.DoesNotExist:
                pass

    return Response({'status': 'ok'})


def _handle_context_payment(txn):
    metadata = txn.metadata or {}
    event_id = metadata.get('event_id')
    if event_id:
        from events.models import EventParticipant
        from events.utils import generate_ticket_qr, send_event_receipt
        try:
            participant = EventParticipant.objects.get(
                event_id=event_id,
                user=txn.user,
                payment_status='pending',
            )
            participant.payment_status = 'completed'
            participant.payment_method = 'paystack'
            participant.amount_paid = txn.amount
            participant.payment_date = timezone.now()
            participant.transaction_id = txn.reference
            participant.save()
            generate_ticket_qr(participant)
            try:
                send_event_receipt(participant)
            except Exception:
                pass
        except EventParticipant.DoesNotExist:
            pass

    order_id = metadata.get('order_id')
    if order_id:
        from products.models import Order as ShopOrder
        try:
            order = ShopOrder.objects.get(id=order_id, status='pending')
            order.status = 'paid'
            order.payment_intent = txn.reference
            order.save()
        except ShopOrder.DoesNotExist:
            pass
