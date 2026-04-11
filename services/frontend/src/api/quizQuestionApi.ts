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
  /**
   * GET /api/v1/quiz_questions/:id/
   * Retrieve a single quiz question with its answers
   */
  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<QuizQuestion>>(`${QQ_BASE}/${id}/`),

  /**
   * PATCH /api/v1/quiz_questions/:id/
   * Update a quiz question (only if quiz is NOT published)
   */
  update: (id: number, payload: UpdateQuizQuestionPayload) =>
    axiosInstance.patch<ApiResponse<QuizQuestion>>(`${QQ_BASE}/${id}/`, payload),

  /**
   * DELETE /api/v1/quiz_questions/:id/
   * Delete a quiz question (only if quiz is NOT published)
   */
  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QQ_BASE}/${id}/`),
}
