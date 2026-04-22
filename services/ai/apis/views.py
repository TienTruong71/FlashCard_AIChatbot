from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .rag import ingest_set, get_answer

class ChatbotViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=["post"])
    def ingest(self, request):
        set_id = request.data.get("set_id")
        if not set_id:
            return Response({"error": "set_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        success = ingest_set(set_id, user=request.user)
        if success:
            return Response({"message": "Set and user performance ingested successfully"}, status=status.HTTP_200_OK)
        return Response({"error": "Failed to ingest or set not found"}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=["post"])
    def chat(self, request):
        query = request.data.get("message")
        set_id = request.data.get("set_id")
        
        if not query or not set_id:
            return Response({"error": "message and set_id are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            answer = get_answer(query, set_id)
            return Response({"answer": answer}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
