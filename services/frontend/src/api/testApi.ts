import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Test,
  CreateTestPayload,
  PaginationParams,
} from '../types'

const TEST_BASE = '/v1/tests'

export interface SaveAnswerPayload {
  /** For SINGLE choice: provide quiz_question_answer_id */
  quiz_question_answer_id?: number
  /** For CHECKBOX: provide array of answer ids */
  answer_ids?: number[]
  /** For TEXT: provide text */
  text?: string
}

export interface SubmitResult {
  score: number
  correct: number
  total: number
  time_spent: number
}

export interface StartTestResult {
  started_at: string
  current_question: { id: number; title: string } | null
  remaining_time: number
}

export const testApi = {
  /**
   * GET /api/v1/tests/
   */
  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Test>>(`${TEST_BASE}/`, { params }),

  /**
   * POST /api/v1/tests/
   * Create a new test session for a given quiz
   */
  create: (payload: CreateTestPayload) =>
    axiosInstance.post<ApiResponse<Test>>(`${TEST_BASE}/`, payload),

  /**
   * POST /api/v1/tests/:id/start/
   * Start or resume a test session
   */
  start: (id: number) =>
    axiosInstance.post<ApiResponse<StartTestResult>>(`${TEST_BASE}/${id}/start/`),

  /**
   * POST /api/v1/tests/:id/cancel/
   * Cancel (interrupt) a test that is in_progress
   */
  cancel: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${TEST_BASE}/${id}/cancel/`),

  /**
   * POST /api/v1/tests/:id/pending/
   * Pause a test (in_progress → pending)
   */
  pending: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${TEST_BASE}/${id}/pending/`),

  /**
   * POST /api/v1/tests/:id/submit/
   * Submit a test and calculate score
   */
  submit: (id: number) =>
    axiosInstance.post<ApiResponse<SubmitResult>>(`${TEST_BASE}/${id}/submit/`),

  /**
   * GET /api/v1/tests/:id/results/
   * Get detailed result of a submitted test
   */
  results: (id: number) =>
    axiosInstance.get<ApiResponse<Test>>(`${TEST_BASE}/${id}/results/`),

  /**
   * POST /api/v1/tests/:id/answers/?quiz_question_id=<id>
   * Autosave a single answer (supports single, checkbox, text question types)
   */
  saveAnswer: (id: number, quizQuestionId: number, payload: SaveAnswerPayload) =>
    axiosInstance.post<ApiResponse<{ test_id: number; question_id: number }>>(
      `${TEST_BASE}/${id}/answers/`,
      payload,
      { params: { quiz_question_id: quizQuestionId } }
    ),
}
