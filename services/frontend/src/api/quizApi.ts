import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Quiz,
  UpdateQuizPayload,
  QuizQuestion,
  CreateQuizQuestionPayload,
  ShareQuizPayload,
  Test,
  PaginationParams,
} from '../types'


const QUIZ_BASE = '/v1/quizzes'

export const quizApi = {

  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Quiz>>(`${QUIZ_BASE}/`, { params }),


  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/`),



  update: (id: number, payload: UpdateQuizPayload) =>
    axiosInstance.patch<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/`, payload),


  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUIZ_BASE}/${id}/`),


  duplicate: (id: number) =>
    axiosInstance.post<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/duplicate/`),


  share: (id: number, payload: ShareQuizPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${QUIZ_BASE}/${id}/share/`, payload),


  unshare: (id: number, userId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUIZ_BASE}/${id}/unshare/${userId}/`),


  createQuestion: (quizId: number, payload: CreateQuizQuestionPayload) =>
    axiosInstance.post<ApiResponse<QuizQuestion>>(
      `${QUIZ_BASE}/${quizId}/create_questions/`,
      payload
    ),


  listTests: (quizId: number, params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Test>>(`${QUIZ_BASE}/${quizId}/tests/`, { params }),
}


