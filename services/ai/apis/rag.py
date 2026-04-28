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
        model="gemini-3-flash-preview",
        temperature=0.7,
        google_api_key=get_api_key()
    )

def get_user_context(user, query, specific_quiz=None):
    context_parts = []

    if specific_quiz:
        relevant_quizzes = [specific_quiz]
    else:
        relevant_quizzes = Quiz.objects.filter(user=user, title__icontains=query)[:3]
        if not relevant_quizzes:
            relevant_quizzes = Quiz.objects.filter(user=user).order_by("-created_at")[:2]

    for quiz in relevant_quizzes:
        context_parts.append(f"--- QUIZ: {quiz.title} ---")
        questions = QuizQuestion.objects.filter(quiz=quiz).prefetch_related("answers")[:10]
        for q in questions:
            correct = [a.content for a in q.answers.all() if a.is_correct]
            context_parts.append(f"Q: {q.title} | A: {', '.join(correct)}")
        
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
            "STRICT RULES:\n"
            "1. NO MARKDOWN BOLDING. Never use double asterisks (**). Use plain text or capitalize if needed for emphasis.\n"
            "2. BE EXTREMELY CONCISE. Keep answers very short (1-3 sentences) unless the user asks for a deep dive.\n"
            "3. NO ASTERISK LISTS. Use numbers (1., 2.) or dashes (-) for lists instead of asterisks (*).\n"
            "4. SELECTIVE CONTEXT: Only discuss specific quiz results or performance metrics if the user specifically asks about them (e.g., 'how did I do?', 'scores?'). Otherwise, be a general assistant.\n"
            "5. NO YAPPING. Do not give long introductions or conclusions.\n"
            "6. SUGGESTED QUESTIONS: At the very end of your response, always provide exactly 3 suggested follow-up questions for the user. Format them as a single line starting with '[SUGGESTIONS]:' followed by the questions separated by '|'. Example: [SUGGESTIONS]: Question 1 | Question 2 | Question 3\n\n"
            f"CONTEXT:\n{context}"
        ))
    ]
    
    for human, ai in chat_history:
        messages.append(HumanMessage(content=human))
        messages.append(AIMessage(content=ai))
        
    messages.append(HumanMessage(content=query))

    try:
        response = llm.invoke(messages)
        full_content = response.content
        
        answer = full_content
        suggestions = []
        
        if "[SUGGESTIONS]:" in full_content:
            parts = full_content.split("[SUGGESTIONS]:")
            answer = parts[0].strip()
            suggestion_str = parts[1].strip()
            suggestions = [s.strip() for s in suggestion_str.split("|") if s.strip()]
            
        return {"answer": answer, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"AI Error: {e}", exc_info=True)
        return {"answer": f"Sorry, I encountered an error: {str(e)}", "suggestions": []}

def ingest_quiz(quiz_id, user=None):
    return True

def generate_title(message):
    llm = get_llm()
    prompt = f"Based on this first message from a user, generate a very short conversation title (2-4 words) in the same language as the message. Reply ONLY with the title.\n\nMessage: {message}"
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip().strip('"')
    except:
        return "New Conversation"
