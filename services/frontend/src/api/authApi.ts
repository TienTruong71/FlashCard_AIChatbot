import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  UserWithTokens,
  PaginatedResponse,
  User,
  PaginationParams,
} from '../types'

const AUTH_BASE = '/v1/auth'

export const authApi = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<UserWithTokens>>(`${AUTH_BASE}/login/`, payload),

  register: (payload: RegisterPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/register/`, payload),

  logout: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/logout/`, {
      refresh_token: refreshToken,
    }),


  refreshToken: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<UserWithTokens>>(`/v1/auth/refresh/`, {
      refresh: refreshToken,
    }),

  /**
   * GET /api/v1/auth/
   * List all users (admin)
   */
  listUsers: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<User>>(`${AUTH_BASE}/`, { params }),
}
