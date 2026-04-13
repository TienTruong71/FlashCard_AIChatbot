from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import AccessToken

from core.constant import EXCLUDE_AUTH_PATH
from core.utils import get_access_token_from_request, path_is_excluded


class TokenVersionMiddleware(BasePermission):
    def has_permission(self, request: Request, view):
        current_route = request.resolver_match.route
        if path_is_excluded(current_route, EXCLUDE_AUTH_PATH):
            return True
            
        raw_token = get_access_token_from_request(request)
        if not raw_token:
            return False
            
        try:
            user = request.user
            if not user or not user.is_authenticated:
                return False
            
            token = AccessToken(raw_token)
            if str(token.get("token_version")) != str(user.token_version):
                return False
                
            return True
        except Exception:
            return False
