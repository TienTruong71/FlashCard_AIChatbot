from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    error_messages = {
        status.HTTP_401_UNAUTHORIZED: {
            "status": False,
            "message": _("Authentication credentials were not provided."),
        },
        status.HTTP_403_FORBIDDEN: {
            "status": False,
            "message": "Unfortunately, you do not have permission.",
        },
        status.HTTP_404_NOT_FOUND: {
            "status": False,
            "message": "The requested resource could not be found.",
        },
        # status.HTTP_500_INTERNAL_SERVER_ERROR: {
        #     "status": False,
        #     "message": "An unexpected error occurred on the server.",
        # },
    }

    if response is not None and response.status_code in error_messages:
        # If the response already has a 'detail' or 'message' from DRF or custom logic,
        # we can decide whether to use it or our generic one.
        # Let's preserve the original message if it's not the generic one.
        original_message = response.data.get("detail") or response.data.get("message")
        
        # If original_message is not None and not empty, we can use it, 
        # or we can stick with our generic one only if the original is too generic.
        # For debugging, we definitely want the original.
        message = original_message if original_message else error_messages[response.status_code]["message"]

        return Response(
            {
                "status": False,
                "message": message,
            },
            status=response.status_code,
        )

    return response
