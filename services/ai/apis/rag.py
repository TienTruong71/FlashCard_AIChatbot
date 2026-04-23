import os
import logging
from django.conf import settings
from core.models import Quiz, QuizQuestion, Test, TestAnswer
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)

def get_api_key():
    key = os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    return key

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
        google_api_key=get_api_key()
    )

def get_user_context(user, query, specific_quiz=None):
    context_parts = []
    
    if specific_quiz:
        relevant_quizzes = [specific_quiz]
    else:
        quizzes = Quiz.objects.filter(user=user)
        relevant_quizzes = []
        for quiz in quizzes:
            if quiz.title.lower() in query.lower():
                relevant_quizzes.append(quiz)
        if not relevant_quizzes:
            relevant_quizzes = quizzes.order_by("-created")[:3]
        
    for quiz in relevant_quizzes:
        context_parts.append(f"--- QUIZ: {quiz.title} ---")
        questions = QuizQuestion.objects.filter(quiz=quiz).prefetch_related("answers")
        for q in questions:
            correct = [a.content for a in q.answers.all() if a.is_correct]
            context_parts.append(f"Question: {q.title} | Correct Answer: {', '.join(correct)}")
        
        latest_test = Test.objects.filter(user=user, quiz=quiz).order_by("-submitted_at").first()
        if latest_test:
            context_parts.append(f"User's Latest Result: Score {latest_test.score}, Status: {latest_test.status}")

    return "\n".join(context_parts)

def get_answer(query, user, quiz=None, chat_history=None):
    if chat_history is None:
        chat_history = []
        
    context = get_user_context(user, query, specific_quiz=quiz)
    llm = get_llm()
    
    messages = [
        SystemMessage(content=(
            "You are a helpful AI Study Assistant. "
            "Below is the context about the user's quizzes and their performance. "
            "Use this information to answer the user's question accurately. "
            "If the user asks about a quiz not in the context, ask them to clarify which quiz they mean. "
            "Always be encouraging and provide clear explanations.\n\n"
            f"CONTEXT:\n{context}"
        ))
    ]
    
    for human, ai in chat_history:
        messages.append(HumanMessage(content=human))
        messages.append(AIMessage(content=ai))
        
    messages.append(HumanMessage(content=query))
    
    try:
        response = llm.invoke(messages)
        return response.content
    except Exception as e:
        logger.error(f"AI Error: {e}", exc_info=True)
        return f"Sorry, I encountered an error: {str(e)}"

def ingest_quiz(quiz_id, user=None):
    return True
