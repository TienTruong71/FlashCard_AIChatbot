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
  quiz_question_answer_id?: number
  answer_ids?: number[]
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

  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Test>>(`${TEST_BASE}/`, { params }),


  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Test>>(`${TEST_BASE}/${id}/`),


  create: (payload: CreateTestPayload) =>
    axiosInstance.post<ApiResponse<Test>>(`${TEST_BASE}/`, payload),


  start: (id: number) =>
    axiosInstance.post<ApiResponse<StartTestResult>>(`${TEST_BASE}/${id}/start/`),


  cancel: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${TEST_BASE}/${id}/cancel/`),


  pending: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${TEST_BASE}/${id}/pending/`),


  submit: (id: number) =>
    axiosInstance.post<ApiResponse<SubmitResult>>(`${TEST_BASE}/${id}/submit/`),


  results: (id: number) =>
    axiosInstance.get<ApiResponse<Test>>(`${TEST_BASE}/${id}/results/`),

  saveAnswer: (id: number, quizQuestionId: number, payload: SaveAnswerPayload) =>
    axiosInstance.post<ApiResponse<{ test_id: number; question_id: number }>>(
      `${TEST_BASE}/${id}/answers/`,
      payload,
      { params: { quiz_question_id: quizQuestionId } }
    ),
}
