import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Question,
  PaginationParams,
} from '../types'

const QUESTION_BASE = '/v1/questions'

// NOTE: Questions can only be CREATED through setApi.createQuestion(setId, payload)
// which calls POST /api/v1/sets/:id/questions/
// This service only supports: list, retrieve, update, destroy

export const questionApi = {
  /**
   * GET /api/v1/questions/
   */
  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Question>>(`${QUESTION_BASE}/`, { params }),

  /**
   * GET /api/v1/questions/:id/
   */
  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Question>>(`${QUESTION_BASE}/${id}/`),

  /**
   * PATCH /api/v1/questions/:id/
   */
  update: (id: number, payload: { title?: string; type?: string; answers?: { content: string; is_correct: boolean }[] }) =>
    axiosInstance.patch<ApiResponse<Question>>(`${QUESTION_BASE}/${id}/`, payload),

  /**
   * DELETE /api/v1/questions/:id/
   */
  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUESTION_BASE}/${id}/`),
}
