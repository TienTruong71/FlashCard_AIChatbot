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

// NOTE: Quizzes can only be CREATED through setApi.createQuiz(setId, payload)
// which calls POST /api/v1/sets/:id/quizzes/
// This service supports: list, retrieve, update, destroy, duplicate, share, unshare, createQuestion, listTests

const QUIZ_BASE = '/v1/quizzes'

export const quizApi = {
  // ─── Quiz CRUD ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/quizzes/
   */
  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Quiz>>(`${QUIZ_BASE}/`, { params }),

  /**
   * GET /api/v1/quizzes/:id/
   */
  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/`),


  /**
   * PATCH /api/v1/quizzes/:id/
   */
  update: (id: number, payload: UpdateQuizPayload) =>
    axiosInstance.patch<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/`, payload),

  /**
   * DELETE /api/v1/quizzes/:id/
   */
  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUIZ_BASE}/${id}/`),

  // ─── Quiz Actions ────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/quizzes/:id/duplicate/
   */
  duplicate: (id: number) =>
    axiosInstance.post<ApiResponse<Quiz>>(`${QUIZ_BASE}/${id}/duplicate/`),

  /**
   * POST /api/v1/quizzes/:id/share/
   */
  share: (id: number, payload: ShareQuizPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${QUIZ_BASE}/${id}/share/`, payload),

  /**
   * DELETE /api/v1/quizzes/:id/unshare/:user_id/
   */
  unshare: (id: number, userId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUIZ_BASE}/${id}/unshare/${userId}/`),

  // ─── Quiz Questions ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/quizzes/:id/create_questions/
   */
  createQuestion: (quizId: number, payload: CreateQuizQuestionPayload) =>
    axiosInstance.post<ApiResponse<QuizQuestion>>(
      `${QUIZ_BASE}/${quizId}/create_questions/`,
      payload
    ),

  // ─── Tests (of a specific quiz) ──────────────────────────────────────────────

  /**
   * GET /api/v1/quizzes/:id/tests/
   */
  listTests: (quizId: number, params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Test>>(`${QUIZ_BASE}/${quizId}/tests/`, { params }),
}


