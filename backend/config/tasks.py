from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_email_async(subject, message, recipient_list, from_email=None):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f'Failed to send email to {recipient_list}: {e}')
        return False


@shared_task
def send_welcome_email_async(user_email, username):
    return send_email_async(
        subject='Welcome to CombatHub!',
        message=(
            f'Hi {username or user_email},\n\n'
            f'Welcome to CombatHub — the complete combat sports ecosystem.\n\n'
            f'Complete your profile, explore the community, and start your journey.\n\n'
            f'- The CombatHub Team'
        ),
        recipient_list=[user_email],
    )


@shared_task
def send_access_code_email_async(user_email, username, code, role, frontend_url):
    return send_email_async(
        subject='Your CombatHub Access Code',
        message=(
            f'Hi {username or user_email},\n\n'
            f'Your access code for your {role.replace("_", " ")} account is:\n\n'
            f'   {code}\n\n'
            f'Keep this code safe. You will need it to sign in.\n\n'
            f'If you ever lose this code, you can retrieve it at:\n'
            f'{frontend_url}/retrieve-access-code\n\n'
            f'- The CombatHub Team'
        ),
        recipient_list=[user_email],
    )


@shared_task
def create_notifications_async(recipient_ids, actor_id, notification_type, message):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    from accounts.models import Notification

    try:
        actor = User.objects.get(pk=actor_id)
        recipients = User.objects.filter(pk__in=recipient_ids)
        notifications = [
            Notification(
                recipient=r,
                actor=actor,
                notification_type=notification_type,
                message=message,
            )
            for r in recipients
        ]
        Notification.objects.bulk_create(notifications)
        return len(notifications)
    except Exception as e:
        logger.error(f'Failed to create notifications: {e}')
        return 0


@shared_task
def log_event_async(message, level='info'):
    getattr(logger, level)(message)
