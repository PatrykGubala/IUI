from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Match, Swipe, Message

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'profile_picture', 'bio', 'birth_date')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'profile_picture', 'bio', 'birth_date')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Match)
admin.site.register(Swipe)
admin.site.register(Message)