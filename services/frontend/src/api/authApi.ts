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
  /**
   * POST /api/v1/auth/login/
   * Returns user info + access_token + refresh_token
   */
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<UserWithTokens>>(`${AUTH_BASE}/login/`, payload),

  /**
   * POST /api/v1/auth/register/
   */
  register: (payload: RegisterPayload) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/register/`, payload),

  /**
   * POST /api/v1/auth/logout/
   * Requires refresh_token in body
   */
  logout: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/logout/`, {
      refresh_token: refreshToken,
    }),

  /**
   * POST /api/v1/auth/refresh/
   */
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
