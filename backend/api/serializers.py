from rest_framework import serializers
from .models import CustomUser, Match, Swipe, Message
from django.contrib.auth import get_user_model
from django.utils.timesince import timesince

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    description = serializers.CharField(source='bio', allow_blank=True, required=False)
    profilePhoto = serializers.ImageField(source='profile_picture', required=False)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, read_only=True)
    country = serializers.CharField(required=False, allow_blank=True, read_only=True)

    location = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email',
            'firstName', 'lastName',
            'role', 'profilePhoto', 'description',
            'age',
            'location',
            'latitude', 'longitude', 'city', 'country',
            'tags', 'occupation', 'university',
        )
        read_only_fields = ('role', 'username', 'email')

    def get_location(self, obj):
        parts = [p for p in [obj.city, obj.country] if p]
        return ", ".join(parts)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)
    age = serializers.IntegerField(required=True)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)

    class Meta:
        model = CustomUser
        fields = (
            "username", "email", "password",
            "first_name", "last_name",
            "age",
            "latitude", "longitude",
        )

    def validate_age(self, value):
        if value < 18:
            raise serializers.ValidationError("Must be 18+")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

class DatingProfileSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(source='profile_picture', read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName  = serializers.CharField(source='last_name', read_only=True)
    description = serializers.CharField(source='bio', read_only=True)
    location = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'image',
            'firstName', 'lastName',
            'age',
            'location',
            'occupation', 'university',
            'description',
            'tags',
        )

    def get_location(self, obj):
        parts = [p for p in [obj.city, obj.country] if p]
        return ", ".join(parts)


class SwipeActionSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['LIKE', 'PASS'])

class MessageSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='sender.first_name', read_only=True)
    content = serializers.CharField(source='text')
    time = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'user', 'content', 'time', 'type')

    def get_time(self, obj):
        return obj.timestamp.strftime('%H:%M')

    def get_type(self, obj):
        request = self.context.get('request')
        if request and obj.sender == request.user:
            return 'outgoing'
        return 'incoming'

class MatchListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    subtitle = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    match_id = serializers.IntegerField(source='id')

    class Meta:
        model = Match
        fields = ('match_id', 'name', 'subtitle', 'time', 'message', 'avatar')

    def get_partner(self, obj):
        user = self.context['request'].user
        return obj.users.exclude(id=user.id).first()

    def get_name(self, obj):
        partner = self.get_partner(obj)
        return partner.first_name if partner and partner.first_name else partner.username if partner else "Unknown"

    def get_subtitle(self, obj):
        partner = self.get_partner(obj)
        return partner.occupation if partner else ""

    def get_avatar(self, obj):
        partner = self.get_partner(obj)
        if partner and partner.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(partner.profile_picture.url)
            return partner.profile_picture.url
        return None

    def get_last_message(self, obj):
        return obj.messages.last()

    def get_time(self, obj):
        msg = self.get_last_message(obj)
        if msg:
            return timesince(msg.timestamp).split(',')[0] + " ago"
        return ""

    def get_message(self, obj):
        msg = self.get_last_message(obj)
        return msg.text if msg else "New Match!"