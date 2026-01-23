from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.generics import CreateAPIView

from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer


class RegisterView(CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class HelloWorldView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "Hello, how are you? I am under the water!"})
