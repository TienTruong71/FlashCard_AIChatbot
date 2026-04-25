from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from core.models import AIChatConversation, AIChatMessage, Quiz
from core.serializers.ai_serializers import AIChatConversationSerializer, AIChatMessageSerializer
from .rag import ingest_quiz, get_answer
from core.tasks import summarize_conversation_title_task

class ChatbotViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=["post"])
    def ingest(self, request):
        quiz_id = request.data.get("quiz_id")
        if not quiz_id:
            return Response({"error": "quiz_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        success = ingest_quiz(quiz_id, user=request.user)
        if success:
            return Response({"message": "Quiz and user performance ingested successfully"}, status=status.HTTP_200_OK)
        return Response({"error": "Failed to ingest or quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        

    @action(detail=False, methods=["get"])
    def conversations(self, request):
        qs = AIChatConversation.objects.filter(user=request.user)
        return Response(AIChatConversationSerializer(qs, many=True).data)


    @action(detail=False, methods=["post"])
    def create_conversation(self, request):
        quiz_id = request.data.get("quiz_id")
        quiz_obj = None
        if quiz_id:
            quiz_obj = get_object_or_404(Quiz, id=quiz_id, user=request.user)
            
        title = request.data.get("title")
        if not title:
            title = f"Chat with {quiz_obj.title}" if quiz_obj else "General Study Chat"
            
        conv = AIChatConversation.objects.create(user=request.user, quiz=quiz_obj, title=title)
        return Response(AIChatConversationSerializer(conv).data, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=["get"], url_path="conversations/(?P<conv_id>[^/.]+)/messages")
    def messages(self, request, conv_id=None):
        conv = get_object_or_404(AIChatConversation, id=conv_id, user=request.user)
        qs = AIChatMessage.objects.filter(conversation=conv).order_by("created")
        return Response(AIChatMessageSerializer(qs, many=True).data)


    @action(detail=False, methods=["delete"], url_path="conversations/(?P<conv_id>[^/.]+)")
    def delete_conversation(self, request, conv_id=None):
        conv = get_object_or_404(AIChatConversation, id=conv_id, user=request.user)
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=["post"])
    def chat(self, request):
        query = request.data.get("message")
        conv_id = request.data.get("conversation_id")

        if not query or not conv_id:
            return Response({"error": "message and conversation_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        conv = get_object_or_404(AIChatConversation, id=conv_id, user=request.user)

        AIChatMessage.objects.create(conversation=conv, role="user", content=query)

        messages = AIChatMessage.objects.filter(conversation=conv).order_by("created")
        
        if messages.count() <= 1 and (conv.title == "General Study Chat" or conv.title.startswith("Chat with")):
            summarize_conversation_title_task.delay(conv.id, query)

        chat_history = []
        user_msg = None
        for msg in messages:
            if msg.role == "user":
                user_msg = msg.content
            elif msg.role == "assistant" and user_msg:
                chat_history.append((user_msg, msg.content))
                user_msg = None

        try:
            answer = get_answer(query, request.user, quiz=conv.quiz, chat_history=chat_history)
            AIChatMessage.objects.create(conversation=conv, role="assistant", content=answer)
            return Response({"answer": answer}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
