from rest_framework import serializers
from .models import Gym


class GymSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Gym
        fields = ('id', 'owner', 'owner_email', 'name', 'description', 'address', 'city', 'country', 'phone', 'email', 'website', 'logo', 'cover_image', 'is_featured', 'product_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_product_count(self, obj):
        return obj.owner.products.count()
