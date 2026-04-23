import axiosInstance from "./axiosInstance";


const AI_API_URL = "/v1/chatbot";

export interface AIChatConversation {
  id: number;
  title: string;
  quiz: number;
  created: string;
}

export interface AIChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created: string;
}

export const aiApi = {
  ingestQuiz: (quizId: number) => {
    return axiosInstance.post(`http://localhost:9007/api/v1/chatbot/ingest/`, { quiz_id: quizId });
  },
  getConversations: () => {
    return axiosInstance.get<AIChatConversation[]>(`http://localhost:9007/api/v1/chatbot/conversations/`);
  },
  createConversation: (quizId: number, title?: string) => {
    return axiosInstance.post<AIChatConversation>(`http://localhost:9007/api/v1/chatbot/create_conversation/`, { quiz_id: quizId, title });
  },
  getMessages: (conversationId: number) => {
    return axiosInstance.get<AIChatMessage[]>(`http://localhost:9007/api/v1/chatbot/conversations/${conversationId}/messages/`);
  },
  chat: (conversationId: number, message: string) => {
    return axiosInstance.post(`http://localhost:9007/api/v1/chatbot/chat/`, { conversation_id: conversationId, message });
  },
};

