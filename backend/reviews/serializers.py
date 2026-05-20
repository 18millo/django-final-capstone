from rest_framework import serializers
from .models import ProductReview
from accounts.serializers import resolve_avatar


class ProductReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ('id', 'user', 'user_email', 'user_avatar', 'product', 'rating', 'title', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_user_email(self, obj):
        return obj.user.email

    def get_user_avatar(self, obj):
        request = self.context.get('request')
        return resolve_avatar(obj.user.profile, request)

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
