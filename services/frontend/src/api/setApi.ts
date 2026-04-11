import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Set,
  CreateSetPayload,
  Quiz,
  Question,
  ShareQuizPayload,
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
  // ─── Set CRUD ───────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/sets/
   */
  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Set>>(`${SET_BASE}/`, { params }),

  /**
   * GET /api/v1/sets/:id/
   */
  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Set>>(`${SET_BASE}/${id}/`),

  /**
   * POST /api/v1/sets/
   */
  create: (payload: CreateSetPayload) =>
    axiosInstance.post<ApiResponse<Set>>(`${SET_BASE}/`, payload),

  /**
   * PATCH /api/v1/sets/:id/
   */
  update: (id: number, payload: Partial<CreateSetPayload>) =>
    axiosInstance.patch<ApiResponse<Set>>(`${SET_BASE}/${id}/`, payload),

  /**
   * DELETE /api/v1/sets/:id/
   */
  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${SET_BASE}/${id}/`),

  // ─── Set Actions ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/sets/:id/share/
   * Share a set with one or more users
   */
  share: (id: number, payload: ShareQuizPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${SET_BASE}/${id}/share/`, payload),

  /**
   * DELETE /api/v1/sets/:id/unshare/:user_id/
   * Remove sharing from a specific user
   */
  unshare: (id: number, userId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${SET_BASE}/${id}/unshare/${userId}/`),

  /**
   * POST /api/v1/sets/:id/quizzes/
   * Create a quiz from a set (randomly picks questions)
   */
  createQuiz: (id: number, payload: CreateQuizFromSetPayload) =>
    axiosInstance.post<ApiResponse<Quiz>>(`${SET_BASE}/${id}/quizzes/`, payload),

  /**
   * POST /api/v1/sets/:id/questions/
   * Create a new question inside a set
   */
  createQuestion: (id: number, payload: CreateQuestionInSetPayload) =>
    axiosInstance.post<ApiResponse<Question>>(`${SET_BASE}/${id}/questions/`, payload),

  /**
   * GET /api/v1/sets/:id/list_quizzes/
   * List all quizzes that belong to a specific set
   */
  listQuizzes: (id: number, params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Quiz>>(`${SET_BASE}/${id}/list_quizzes/`, { params }),
}
