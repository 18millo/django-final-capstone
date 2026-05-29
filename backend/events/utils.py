import io
import qrcode
from email.mime.image import MIMEImage
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone


def generate_ticket_qr(participant):
    event = participant.event
    qr_data = (
        f"TICKET: {participant.ticket_number}\n"
        f"EVENT: {event.title}\n"
        f"DATE: {event.start_date.strftime('%Y-%m-%d %H:%M')}\n"
        f"ATTENDEE: {participant.name}\n"
        f"EMAIL: {participant.email}"
    )
    qr = qrcode.make(qr_data, box_size=10, border=2)
    buf = io.BytesIO()
    qr.save(buf, format='PNG')
    filename = f'ticket_{participant.ticket_number}.png'
    participant.qr_code.save(filename, ContentFile(buf.getvalue()), save=False)
    participant.save(update_fields=['qr_code'])
    return participant.qr_code


def send_event_receipt(participant):
    event = participant.event
    subject = f'Ticket Confirmation - {event.title}'
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    qr_url = participant.qr_code.url if participant.qr_code else ''

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#111;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Ticket Confirmed</h1>
        </div>
        <div style="padding:30px;background:#f9f9f9;">
            <p style="font-size:16px;color:#333;">Hi <strong>{participant.name}</strong>,</p>
            <p style="font-size:14px;color:#555;">
                You are registered for <strong>{event.title}</strong>. Your ticket is attached below.
            </p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#888;">Event</td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;">{event.title}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#888;">Date</td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;">{event.start_date.strftime('%A, %B %d, %Y at %H:%M')}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#888;">Location</td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;">{event.location}, {event.city}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#888;">Ticket #</td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;font-family:monospace;font-weight:bold;">{participant.ticket_number}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#888;">Attendee</td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;">{participant.name}</td></tr>
                <tr><td style="padding:8px;color:#888;">Amount Paid</td>
                    <td style="padding:8px;font-weight:bold;">{event.currency} {participant.amount_paid or event.entry_fee or 0}</td></tr>
            </table>

            <div style="text-align:center;margin:30px 0;">
                <p style="font-size:12px;color:#888;">Show this QR code at the event entrance:</p>
                <img src="cid:ticket_qr" alt="QR Code" style="width:180px;height:180px;" />
            </div>

            <p style="font-size:12px;color:#aaa;text-align:center;margin-top:30px;">
                Need help? Contact the organizer at {event.organizer.email}
            </p>
        </div>
    </div>
    """

    text = (
        f'Ticket Confirmation - {event.title}\n\n'
        f'Hi {participant.name},\n\n'
        f'You are registered for {event.title}.\n'
        f'Ticket Number: {participant.ticket_number}\n'
        f'Date: {event.start_date.strftime("%A, %B %d, %Y at %H:%M")}\n'
        f'Location: {event.location}, {event.city}\n'
        f'Amount Paid: {event.currency} {participant.amount_paid or event.entry_fee or 0}\n\n'
        f'Show your ticket QR code at the entrance.\n\n'
        f'- {event.organizer.email}'
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[participant.email],
    )
    msg.attach_alternative(html, 'text/html')

    if participant.qr_code and participant.qr_code.storage.exists(participant.qr_code.name):
        try:
            with participant.qr_code.open('rb') as f:
                img = MIMEImage(f.read())
                img.add_header('Content-ID', '<ticket_qr>')
                img.add_header('Content-Disposition', 'inline', filename=f'ticket_{participant.ticket_number}.png')
                msg.attach(img)
        except Exception:
            pass

    msg.send(fail_silently=False)
