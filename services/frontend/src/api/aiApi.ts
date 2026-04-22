import axiosInstance from "./axiosInstance";

const AI_API_URL = "http://localhost:9007/api/v1/chatbot";

export const aiApi = {
  ingestSet: (setId: number) => {
    return axiosInstance.post(`${AI_API_URL}/ingest/`, { set_id: setId });
  },
  chat: (setId: number, message: string) => {
    return axiosInstance.post(`${AI_API_URL}/chat/`, { set_id: setId, message });
  },
};
