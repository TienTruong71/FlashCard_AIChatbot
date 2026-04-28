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

  verifyOtp: (payload: { email: string; otp: string }) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/verify-otp/`, payload),

  resendOtp: (email: string) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/resend-otp/`, { email }),

  logout: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/logout/`, {
      refresh_token: refreshToken,
    }),


  refreshToken: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<UserWithTokens>>(`/v1/auth/refresh/`, {
      refresh: refreshToken,
    }),


  listUsers: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<User>>(`${AUTH_BASE}/`, { params }),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/forgot-password/`, { email }),

  resetPassword: (payload: { email: string; otp: string; new_password: string }) =>
    axiosInstance.post<ApiResponse<void>>(`${AUTH_BASE}/reset-password/`, payload),

  getMe: () =>
    axiosInstance.get<ApiResponse<User>>(`${AUTH_BASE}/me/`),

  updateProfile: (payload: { first_name?: string; last_name?: string; avatar?: string }) =>
    axiosInstance.patch<ApiResponse<User>>(`${AUTH_BASE}/me/update/`, payload),
}
