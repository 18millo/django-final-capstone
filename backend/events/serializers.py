from rest_framework import serializers
from .models import Event, EventParticipant


class EventParticipantSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = EventParticipant
        fields = (
            'id', 'event', 'user', 'user_email', 'name', 'email', 'phone',
            't_shirt_size', 'dietary_requirements', 'emergency_contact',
            'emergency_phone', 'payment_status', 'amount_paid',
            'payment_method',
            'transaction_id', 'payment_date', 'ticket_number', 'qr_code',
            'checked_in', 'registered_at', 'has_attended',
        )
        read_only_fields = (
            'id', 'event', 'user', 'payment_status', 'amount_paid',
            'payment_method',
            'transaction_id', 'payment_date', 'ticket_number', 'qr_code',
            'checked_in', 'registered_at',
        )

    def get_user_email(self, obj):
        return obj.user.email


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventParticipant
        fields = (
            'name', 'email', 'phone', 't_shirt_size',
            'dietary_requirements', 'emergency_contact', 'emergency_phone',
        )


class EventParticipantPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventParticipant
        fields = ('id', 'name', 'registered_at', 't_shirt_size')


class EventSerializer(serializers.ModelSerializer):
    organizer_email = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    tickets_available = serializers.SerializerMethodField()
    total_funds = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'organizer', 'organizer_email', 'title', 'description',
            'event_type', 'location', 'city', 'country', 'start_date',
            'end_date', 'registration_deadline', 'max_participants',
            'poster', 'entry_fee', 'currency', 'is_published',
            'participant_count', 'is_registered', 'tickets_available',
            'total_funds', 'participants', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'organizer', 'created_at', 'updated_at')

    def get_organizer_email(self, obj):
        return obj.organizer.email

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False

    def get_tickets_available(self, obj):
        return obj.tickets_available

    def get_total_funds(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and (
            obj.organizer == request.user or request.user.is_staff
        ):
            return float(obj.total_funds)
        return None

    def get_participants(self, obj):
        request = self.context.get('request')
        qs = obj.participants.select_related('user').all()
        if request and request.user.is_authenticated and (
            obj.organizer == request.user or request.user.is_staff
        ):
            return EventParticipantSerializer(qs, many=True).data
        return EventParticipantPublicSerializer(qs, many=True).data
