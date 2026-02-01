from django.contrib.auth.models import AbstractUser
from django.db import models, connection
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from pgvector.django import VectorField

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ADMIN = 'admin', 'Administrator'

    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
        OTHER = 'O', 'Other'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    gender = models.CharField(max_length=1, choices=Gender.choices, default=Gender.OTHER)
    interested_in = models.JSONField(default=list, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    age = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    university = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    profile_embedding = VectorField(dimensions=768, null=True, blank=True)
    max_distance = models.IntegerField(default=20)
    max_age_diff = models.IntegerField(default=5)

    def __str__(self):
        return self.username

    def get_full_location(self):
        parts = [p for p in [self.city, self.country] if p]
        return ", ".join(parts)

class Match(models.Model):
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='matches')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Match {self.id}"

    def get_partner(self, user):
        return self.users.exclude(id=user.id).first()

class Swipe(models.Model):
    class Action(models.TextChoices):
        LIKE = 'LIKE', 'Like'
        PASS = 'PASS', 'Pass'

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='swipes_made')
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='swipes_received')
    action = models.CharField(max_length=4, choices=Action.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('actor', 'target')

class Message(models.Model):
    match = models.ForeignKey(Match, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message {self.id} from {self.sender}"

@receiver(post_save, sender=Message)
def notify_chat_update(sender, instance, created, **kwargs):
    if created:
        with connection.cursor() as cursor:
            cursor.execute("NOTIFY chat_updates")