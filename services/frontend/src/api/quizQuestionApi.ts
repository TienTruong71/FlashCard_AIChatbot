import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  QuizQuestion,
} from '../types'

const QQ_BASE = '/v1/quiz_questions'

export interface UpdateQuizQuestionPayload {
  title?: string
  type?: string
  answers?: { id?: number; content: string; is_correct: boolean }[]
}

export const quizQuestionApi = {

  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<QuizQuestion>>(`${QQ_BASE}/${id}/`),


  update: (id: number, payload: UpdateQuizQuestionPayload) =>
    axiosInstance.patch<ApiResponse<QuizQuestion>>(`${QQ_BASE}/${id}/`, payload),


  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QQ_BASE}/${id}/`),
}
