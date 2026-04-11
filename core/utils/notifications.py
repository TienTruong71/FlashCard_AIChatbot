import logging
from core.tasks import send_question_update_warning_task, send_share_notification_task

logger = logging.getLogger(__name__)

def send_question_update_warning(question):
    try:
        send_question_update_warning_task.delay(question.id)
    except Exception as e:
        logger.error(f"[Celery] Failed to queue question update task for ID {question.id}: {e}")


def send_share_notification(recipient, item_title, item_type="Quiz", permission="View"):
    if not recipient.email:
        return

    try:
        send_share_notification_task.delay(
            recipient.email,
            recipient.full_name,
            item_title,
            item_type,
            permission
        )
    except Exception as e:
        logger.error(f"[Celery] Failed to queue share notification for {recipient.email}: {e}")
