import logging
from decouple import config

logger = logging.getLogger(__name__)

SMS_PROVIDER = config('SMS_PROVIDER', default='console')


def send_sms(phone, message):
    if SMS_PROVIDER == 'twilio':
        return _send_twilio(phone, message)
    elif SMS_PROVIDER == 'africastalking':
        return _send_africastalking(phone, message)
    else:
        return _send_console(phone, message)


def _send_console(phone, message):
    logger.info(f'[SMS to {phone}] {message}')
    print(f'\n[SMS] To: {phone}')
    print(f'[SMS] Message: {message}')
    print(f'[SMS] (No SMS provider configured — logged to console)\n')
    return True


def _send_twilio(phone, message):
    try:
        from twilio.rest import Client
        account_sid = config('TWILIO_ACCOUNT_SID')
        auth_token = config('TWILIO_AUTH_TOKEN')
        from_phone = config('TWILIO_PHONE_NUMBER')
        client = Client(account_sid, auth_token)
        client.messages.create(body=message, from_=from_phone, to=phone)
        return True
    except Exception as e:
        logger.error(f'Twilio SMS failed: {e}')
        return False


def _send_africastalking(phone, message):
    try:
        import africastalking
        username = config('AT_USERNAME')
        api_key = config('AT_API_KEY')
        africastalking.initialize(username, api_key)
        sms = africastalking.SMS
        sms.send(message, [phone])
        return True
    except Exception as e:
        logger.error(f'Africa\'s Talking SMS failed: {e}')
        return False
