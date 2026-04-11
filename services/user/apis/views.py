from django.contrib.auth import authenticate
from core.mail import MailService
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from core.jwt import MyTokenObtainPairSerializer
from core.paginators import CustomPaginator
from core.filters import UserFilter
from core.models import User
from core.serializers.user_serializers import (
    RefreshTokenSerializer,
    RegisterUserSerializer,
    UserLoginSerializer,
    UserSerializerWithToken,
    UserSerializer
)
from rest_framework.permissions import AllowAny
from core.utils import global_response_errors

from .documents import (
    login_user_document,
    refresh_token_document,
    register_user_document,
    list_user_document,
)




class AuthenViewSet(viewsets.ViewSet):

    @extend_schema(**list_user_document)
    def list(self, request):
        filter_params = request.GET.dict()
        sets = UserFilter(
            filter_params, queryset=User.objects.all().order_by("id")
        )
        paginator = CustomPaginator()
        page = paginator.paginate_queryset(sets.qs, request)
        serializer = UserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


    @extend_schema(**register_user_document)
    @action(detail=False, methods=["post"], url_path="register", permission_classes=[AllowAny])
    def create_user(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            MailService.send_verify_otp(user.email, user.otp)

            return Response(
                {
                    "status": True,
                    "message": "User created successfully! Please check your email for OTP verification.",
                },
                status=status.HTTP_201_CREATED,
            )

        return global_response_errors(serializer.errors)

    @action(detail=False, methods=["post"], url_path="verify-otp", permission_classes=[AllowAny])
    def verify_otp(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {"status": False, "message": "Email and OTP are required!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email.lower())
        except User.DoesNotExist:
            return Response(
                {"status": False, "message": "User not found!"},
                status=status.HTTP_404_NOT_FOUND,
            )


        if user.is_active:
             return Response(
                {"status": True, "message": "Account already verified!"},
                status=status.HTTP_200_OK,
            )

        if user.otp != otp:
            return Response(
                {"status": False, "message": "Invalid OTP code!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        if (now - user.otp_created_at).total_seconds() > 60:
            return Response(
                {"status": False, "message": "OTP has expired! Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.otp = None
        user.save()

        return Response(
            {"status": True, "message": "Account verified successfully! You can now login."},
            status=status.HTTP_200_OK,
        )


    @action(detail=False, methods=["post"], url_path="resend-otp", permission_classes=[AllowAny])
    def resend_otp(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"status": False, "message": "Email is required!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email.lower())
        except User.DoesNotExist:
            return Response(
                {"status": False, "message": "User not found!"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_active:
             return Response(
                {"status": True, "message": "Account already verified!"},
                status=status.HTTP_200_OK,
            )

        import random
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        MailService.send_verify_otp(user.email, user.otp)

        return Response(
            {"status": True, "message": "New OTP has been sent to your email!"},
            status=status.HTTP_200_OK,
        )


    @extend_schema(**login_user_document)
    @action(methods=["post"], detail=False, url_path="login", permission_classes=[AllowAny])
    def login_user(self, request):
        serializer = UserLoginSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            user = authenticate(
                request,
                username=serializer.validated_data["email"].lower(),
                password=serializer.validated_data["password"],
            )
            if user:
                refresh = MyTokenObtainPairSerializer.get_token(user)
                return Response(
                    {
                        "status": True,
                        "data": UserSerializerWithToken(
                            user,
                            context={
                                "access_token": str(refresh.access_token),
                                "refresh_token": str(refresh),
                            },
                        ).data,
                        "message": "Login successfully!",
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"status": False, "message": "Email or password is incorrect!"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return global_response_errors(serializer.errors)


    @action(methods=["post"], detail=False, url_path="logout")
    def logout_user(self, request):
        try:
            refresh_token = RefreshToken(request.data.get("refresh_token"))
            if not refresh_token:
                raise AuthenticationFailed("No refresh token provided.")
            request.user.set_new_token_version()
            refresh_token.blacklist()
            return Response(
                {"status": True, "message": "Logout successfully!"},
                status=status.HTTP_200_OK,
            )
        except TokenError as e:
            raise AuthenticationFailed(f"{str(e)}!")
        except InvalidToken as e:
            raise AuthenticationFailed(f"{str(e)}!")



class CustomTokenRefreshView(TokenRefreshView):
    @extend_schema(**refresh_token_document)
    def post(self, request, *args, **kwargs):
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            access_token = serializer.validated_data["access_token"]
            refresh_token = serializer.validated_data.get("refresh_token")
            user = serializer.validated_data.get("user")

            return Response(
                {
                    "status": True,
                    "data": UserSerializerWithToken(
                        user,
                        context={
                            "access_token": str(access_token),
                            "refresh_token": str(refresh_token),
                        },
                    ).data,
                    "message": "Refresh token successfully!",
                },
                status=status.HTTP_200_OK,
            )

        return global_response_errors(serializer.errors)