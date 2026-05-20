import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Message, Profile

User = get_user_model()


def get_user_id_from_token(token):
    try:
        return AccessToken(token)['user_id']
    except Exception:
        return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.other_user_id = self.scope['url_route']['kwargs']['user_id']

        query = parse_qs(self.scope['query_string'].decode())
        token = query.get('token', [None])[0]
        if not token:
            await self.close()
            return

        user_id = get_user_id_from_token(token)
        if not user_id:
            await self.close()
            return

        self.user = await self.get_user_by_id(user_id)
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        other = await self.get_user_by_id(self.other_user_id)
        if not other:
            await self.close()
            return

        ids = sorted([self.user.id, int(self.other_user_id)])
        self.room_group_name = f'chat_{ids[0]}_{ids[1]}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.mark_online()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'message':
            content = data.get('content', '').strip()
            view_once = data.get('view_once', False)
            if not content:
                return

            msg = await self.save_message(content, view_once)
            if msg is None:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'This user has been restricted from receiving messages.'}))
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': msg.id,
                    'sender': self.user.id,
                    'content': content,
                    'created_at': msg.created_at.isoformat(),
                    'read': msg.read,
                    'delivered': msg.delivered,
                    'view_once': msg.view_once,
                    'viewed': msg.viewed,
                    'image_url': None,
                }
            )

            sender_name = self.user.username or self.user.email or 'Someone'
            await self.channel_layer.group_send(
                f'user_{self.other_user_id}_notifications',
                {
                    'type': 'notify_message',
                    'sender': self.user.id,
                    'sender_name': sender_name,
                    'content': content[:100],
                    'created_at': msg.created_at.isoformat(),
                }
            )

            await self.send_message_email(content, self.other_user_id)

        elif data.get('type') == 'mark_read':
            await self.mark_messages_read()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'messages_read',
                    'read_by': self.user.id,
                }
            )

        elif data.get('type') == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                }
            )

        elif data.get('type') == 'stop_typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.user.id,
                }
            )

        elif data.get('type') == 'message_delivered':
            msg_id = data.get('message_id')
            if msg_id:
                await self.mark_delivered(msg_id)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_delivered',
                        'message_id': msg_id,
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def messages_read(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_typing(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps(event))

    async def user_stop_typing(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps(event))

    async def message_delivered(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def mark_online(self):
        Profile.objects.filter(user=self.user).update(last_seen=timezone.now())

    @database_sync_to_async
    def mark_delivered(self, message_id):
        Message.objects.filter(id=message_id).update(delivered=True)

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_messages_read(self):
        Message.objects.filter(
            sender_id=int(self.other_user_id),
            recipient=self.user,
            read=False,
        ).update(read=True)

    @database_sync_to_async
    def save_message(self, content, view_once=False):
        try:
            recipient = User.objects.get(id=int(self.other_user_id))
            if recipient.messaging_blocked:
                return None
        except User.DoesNotExist:
            return None
        return Message.objects.create(
            sender=self.user,
            recipient_id=int(self.other_user_id),
            content=content,
            view_once=view_once,
        )

    @database_sync_to_async
    def send_message_email(self, content, recipient_id):
        try:
            recipient = User.objects.get(id=recipient_id)
            body = content or '📷 Image'
            send_mail(
                subject=f'New message from {self.user.username or self.user.email} on CombatHub',
                message=(
                    f'Hi {recipient.username or recipient.email},\n\n'
                    f'You have a new message from {self.user.username or self.user.email}:\n\n'
                    f'   "{body[:200]}"\n\n'
                    f'Reply at:\n'
                    f'{settings.FRONTEND_URL}/messages\n\n'
                    f'- The CombatHub Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
        except Exception:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query = parse_qs(self.scope['query_string'].decode())
        token = query.get('token', [None])[0]
        if not token:
            await self.close()
            return

        user_id = get_user_id_from_token(token)
        if not user_id:
            await self.close()
            return

        self.user = await self.get_user_by_id(user_id)
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        await self.mark_online()

        self.notif_group_name = f'user_{self.user.id}_notifications'
        await self.channel_layer.group_add(self.notif_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'notif_group_name'):
            await self.channel_layer.group_discard(self.notif_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        if data.get('type') == 'ping':
            await self.mark_online()
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def notify_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def notify_follow(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def mark_online(self):
        Profile.objects.filter(user=self.user).update(last_seen=timezone.now())

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
