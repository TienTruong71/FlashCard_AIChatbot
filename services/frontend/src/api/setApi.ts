import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Set,
  CreateSetPayload,
  Quiz,
  Question,
  ShareSetPayload,
  PaginationParams,
} from '../types'

const SET_BASE = '/v1/sets'

export interface CreateQuizFromSetPayload {
  title: string
  question_count: number
  is_published?: boolean
}

export interface CreateQuestionInSetPayload {
  title: string
  type: string
  answers: { content: string; is_correct: boolean }[]
}

export const setApi = {

  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Set>>(`${SET_BASE}/`, { params }),


  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Set>>(`${SET_BASE}/${id}/`),


  create: (payload: CreateSetPayload) =>
    axiosInstance.post<ApiResponse<Set>>(`${SET_BASE}/`, payload),


  update: (id: number, payload: Partial<CreateSetPayload>) =>
    axiosInstance.patch<ApiResponse<Set>>(`${SET_BASE}/${id}/`, payload),


  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${SET_BASE}/${id}/`),


  share: (id: number, payload: ShareSetPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${SET_BASE}/${id}/share/`, payload),


  unshare: (id: number, userId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${SET_BASE}/${id}/unshare/${userId}/`),


  createQuiz: (id: number, payload: CreateQuizFromSetPayload) =>
    axiosInstance.post<ApiResponse<Quiz>>(`${SET_BASE}/${id}/quizzes/`, payload),


  createQuestion: (id: number, payload: CreateQuestionInSetPayload) =>
    axiosInstance.post<ApiResponse<Question>>(`${SET_BASE}/${id}/questions/`, payload),


  listQuizzes: (id: number, params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Quiz>>(`${SET_BASE}/${id}/list_quizzes/`, { params }),
}
