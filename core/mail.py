from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MailService:

    @staticmethod
    def send_share_notification(recipient_email, recipient_name, item_title, item_type="Quiz", permission="View"):
        subject = f"Bạn đã được chia sẻ một {item_type} mới"
        
        context = {
            "username": recipient_name,
            "item_type": item_type,
            "item_type_lower": item_type.lower(),
            "item_title": item_title,
            "permission": permission
        }

        html_message = render_to_string("emails/share_notification.html", context)
        plain_message = strip_tags(html_message)
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)

        try:
            send_mail(subject, plain_message, from_email, [recipient_email], fail_silently=False, html_message=html_message)
            return True
        except Exception as e:
            logger.error(f"[MailService] Failed to send share notification to {recipient_email}: {str(e)}")
            return False

    @staticmethod
    def send_question_update_warning(recipient_email, recipient_name, quiz_title, question_title):
        subject = f"Cảnh báo: Nội dung câu hỏi trong Quiz '{quiz_title}' đã thay đổi từ nguồn"

        context = {
            "username": recipient_name,
            "quiz_title": quiz_title,
            "question_title": question_title,
        }

        html_message = render_to_string("emails/question_update_warning.html", context)
        plain_message = strip_tags(html_message)
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)

        try:
            send_mail(subject, plain_message, from_email, [recipient_email], fail_silently=False, html_message=html_message)
            return True
        except Exception as e:
            logger.error(f"[MailService] Failed to send update warning to {recipient_email}: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_link(user, domain, uid, token, protocol):
        pass

    @staticmethod
    def active_account_success(user, domain, protocol):
       pass

    @staticmethod
    def request_active_account(user_admin, domain, user, protocol):
       pass

    @staticmethod
    def send_verify_otp(user_email, otp):
        pass
