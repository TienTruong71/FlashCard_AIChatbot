import logging
from core.celery_client import celery_client
from core.mail import MailService

logger = logging.getLogger(__name__)

@celery_client.task(name="send_share_notification_task", bind=True, max_retries=3)
def send_share_notification_task(self, recipient_email, recipient_name, item_title, item_type="Quiz", permission="View"):
    try:
        logger.info(f"Sending share notification to {recipient_email}")
        MailService.send_share_notification(recipient_email, recipient_name, item_title, item_type, permission)
    except Exception as e:
        logger.error(f"Failed to send share notification: {e}")


@celery_client.task(name="send_question_update_warning_task", bind=True, max_retries=3)
def send_question_update_warning_task(self, question_id):
    from core.models import Question, QuizQuestion, QuizShare
    try:
        logger.info(f"Processing question update warning for ID: {question_id}")
        question = Question.objects.get(id=question_id)

        quiz_questions = QuizQuestion.objects.filter(question=question).select_related('quiz', 'quiz__user')

        affected_quizzes = {qq.quiz for qq in quiz_questions}

        for quiz in affected_quizzes:
            recipients = {quiz.user} 
            
            shares = QuizShare.objects.filter(quiz=quiz).select_related('user')
            for share in shares:
                recipients.add(share.user)
            for recipient in recipients:
                if not recipient.email:
                    continue

                logger.info(f"Sending warning to {recipient.email} for Quiz '{quiz.title}'")
                MailService.send_question_update_warning(
                    recipient.email, 
                    recipient.full_name, 
                    quiz.title, 
                    question.title
                )

    except Question.DoesNotExist:
        logger.error(f"Question with ID {question_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to process question update warning: {e}")

@celery_client.task(name="summarize_conversation_title_task", bind=True, max_retries=2)
def summarize_conversation_title_task(self, conversation_id, first_message):
    from core.models import AIChatConversation
    from services.ai.apis.rag import generate_title
    
    try:
        conv = AIChatConversation.objects.get(id=conversation_id)
        if conv.title == "General Study Chat" or conv.title.startswith("Chat with"):
            new_title = generate_title(first_message)
            if new_title:
                conv.title = new_title
                conv.save()
                logger.info(f"Updated conversation {conversation_id} title to: {new_title}")
    except Exception as e:
        logger.error(f"Failed to summarize conversation title: {e}")
