import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Question,
  PaginationParams,
} from '../types'

const QUESTION_BASE = '/v1/questions'


export const questionApi = {

  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Question>>(`${QUESTION_BASE}/`, { params }),


  retrieve: (id: number) =>
    axiosInstance.get<ApiResponse<Question>>(`${QUESTION_BASE}/${id}/`),


  update: (id: number, payload: { title?: string; type?: string; answers?: { content: string; is_correct: boolean }[] }) =>
    axiosInstance.patch<ApiResponse<Question>>(`${QUESTION_BASE}/${id}/`, payload),


  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${QUESTION_BASE}/${id}/`),
}
