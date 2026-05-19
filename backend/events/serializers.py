from rest_framework import serializers
from .models import Event, EventParticipant


class EventParticipantSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = EventParticipant
        fields = ('id', 'event', 'user', 'user_email', 'registered_at', 'has_attended')
        read_only_fields = ('id', 'event', 'user', 'registered_at')

    def get_user_email(self, obj):
        return obj.user.email


class EventSerializer(serializers.ModelSerializer):
    organizer_email = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'organizer', 'organizer_email', 'title', 'description', 'event_type', 'location', 'city', 'country', 'start_date', 'end_date', 'registration_deadline', 'max_participants', 'poster', 'entry_fee', 'currency', 'is_published', 'participant_count', 'is_registered', 'created_at', 'updated_at')
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
