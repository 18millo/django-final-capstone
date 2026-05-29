import hashlib
import hmac
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone



PAYSTACK_BASE = 'https://api.paystack.co'


def get_headers():
    return {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def initialize_transaction(email, amount, reference, metadata=None, callback_url=None):
    url = f'{PAYSTACK_BASE}/transaction/initialize'
    payload = {
        'email': email,
        'amount': str(int(amount * 100)),
        'reference': reference,
        'currency': 'KES',
        'metadata': metadata or {},
    }
    if callback_url:
        payload['callback_url'] = callback_url
    resp = requests.post(url, json=payload, headers=get_headers(), timeout=15)
    return resp.json()


def verify_transaction(reference):
    url = f'{PAYSTACK_BASE}/transaction/verify/{reference}'
    resp = requests.get(url, headers=get_headers(), timeout=15)
    return resp.json()


def verify_webhook_signature(payload_body, signature_header):
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode(),
        payload_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def send_payment_notification_email(user_email, amount, reference, status, metadata=None):
    metadata = metadata or {}
    event_title = metadata.get('event_title', '')
    context = metadata.get('context', 'payment')

    if status == 'success':
        subject = f'Payment Successful — CombatHub'
        message = (
            f'Your payment of KES {amount} was successful.\n'
            f'Reference: {reference}\n'
        )
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <div style="background:#059669;padding:15px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Payment Successful</h1>
            </div>
            <div style="padding:20px;background:#f9f9f9;">
                <p style="font-size:14px;">Your payment of <strong>KES {amount}</strong> was completed.</p>
                <p style="font-size:12px;color:#666;">Reference: {reference}</p>
                {f'<p style="font-size:13px;">Event: <strong>{event_title}</strong></p>' if event_title else ''}
            </div>
        </div>
        """
    else:
        subject = f'Payment Failed — CombatHub'
        message = (
            f'Your payment of KES {amount} failed.\n'
            f'Reference: {reference}\n'
            f'Please try again or contact support.\n'
        )
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <div style="background:#dc2626;padding:15px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Payment Failed</h1>
            </div>
            <div style="padding:20px;background:#f9f9f9;">
                <p style="font-size:14px;">Your payment of <strong>KES {amount}</strong> could not be completed.</p>
                <p style="font-size:12px;color:#666;">Reference: {reference}</p>
                <p style="font-size:13px;">Please try again or use a different payment method.</p>
            </div>
        </div>
        """

    try:
        send_mail(
            subject=subject,
            message=message,
            html_message=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=True,
        )
    except Exception:
        pass
