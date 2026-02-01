from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils.timesince import timesince
from .models import CustomUser, Match, Swipe, Message

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_or_email = attrs.get(self.username_field)
        password = attrs.get('password')

        if username_or_email and password:
            user = User.objects.filter(
                Q(username__iexact=username_or_email) |
                Q(email__iexact=username_or_email)
            ).first()

            if user:
                attrs[self.username_field] = user.get_username()

        return super().validate(attrs)

class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    profilePhoto = serializers.ImageField(source='profile_picture', required=False)
    description = serializers.CharField(source='bio', required=False, allow_blank=True)
    interestedIn = serializers.JSONField(source='interested_in', required=False)
    location = serializers.CharField(source='get_full_location', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email',
            'firstName', 'lastName',
            'role', 'profilePhoto', 'description',
            'age', 'gender', 'interestedIn',
            'location', 'latitude', 'longitude',
            'city', 'country', 'tags',
            'occupation', 'university', 'max_distance',
        )
        read_only_fields = ('role', 'username', 'email')

class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all(), message="Email already exists")]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all(), message="Username already taken")]
    )
    password = serializers.CharField(write_only=True)
    firstName = serializers.CharField(source='first_name', required=True)
    lastName = serializers.CharField(source='last_name', required=True)
    interestedIn = serializers.ListField(source='interested_in', child=serializers.CharField(), required=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = CustomUser
        fields = (
            "username", "email", "password",
            "firstName", "lastName",
            "age", "gender", "interestedIn", "tags",
            "latitude", "longitude",
        )

    def validate_age(self, value):
        if not (18 <= value < 100):
            raise serializers.ValidationError("Age must be between 18 and 100")
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
    lastName = serializers.CharField(source='last_name', read_only=True)
    description = serializers.CharField(source='bio', read_only=True)
    name = serializers.SerializerMethodField()
    location = serializers.CharField(source='get_full_location', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'image', 'name',
            'firstName', 'lastName',
            'age', 'gender', 'location',
            'occupation', 'university',
            'description', 'tags',
        )

    def get_name(self, obj):
        return obj.first_name or obj.username

class SwipeActionSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=Swipe.Action.choices)

class MessageSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='sender.first_name', read_only=True)
    content = serializers.CharField(source='text')
    time = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'user_name', 'content', 'time', 'type')

    def get_time(self, obj):
        return obj.timestamp.strftime('%H:%M')

    def get_type(self, obj):
        request = self.context.get('request')
        is_sender = request and obj.sender == request.user
        return 'outgoing' if is_sender else 'incoming'

class MatchListSerializer(serializers.ModelSerializer):
    match_id = serializers.IntegerField(source='id')
    name = serializers.SerializerMethodField()
    subtitle = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ('match_id', 'name', 'subtitle', 'time', 'message', 'avatar')

    def get_name(self, obj):
        partner = obj.get_partner(self.context['request'].user)
        if not partner:
            return "Unknown"
        return partner.first_name or partner.username

    def get_subtitle(self, obj):
        partner = obj.get_partner(self.context['request'].user)
        return partner.occupation if partner else ""

    def get_avatar(self, obj):
        partner = obj.get_partner(self.context['request'].user)
        if not partner or not partner.profile_picture:
            return None

        request = self.context.get('request')
        url = partner.profile_picture.url
        return request.build_absolute_uri(url) if request else url

    def get_time(self, obj):
        msg = obj.messages.last()
        return f"{timesince(msg.timestamp).split(',')[0]} ago" if msg else ""

    def get_message(self, obj):
        msg = obj.messages.last()
        return msg.text if msg else "New Match!"