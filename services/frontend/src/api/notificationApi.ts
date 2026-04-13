import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  PaginatedResponse,
  Notification,
  PaginationParams,
} from '../types'

const NOTIFICATION_BASE = '/v1/notifications'

export interface CreateNotificationPayload {
  user_ids: number[]
  data: Record<string, unknown>
  notify_type: string
}

export const notificationApi = {

  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Notification>>(`${NOTIFICATION_BASE}/`, { params }),


  create: (payload: CreateNotificationPayload) =>
    axiosInstance.post<ApiResponse<Notification[]>>(`${NOTIFICATION_BASE}/`, payload),


  markAsRead: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${NOTIFICATION_BASE}/${id}/mark_as_read/`),

  markAllAsRead: () =>
    axiosInstance.post<ApiResponse<void>>(`${NOTIFICATION_BASE}/mark_all_as_read/`),


  unreadCount: () =>
    axiosInstance.get<ApiResponse<number>>(`${NOTIFICATION_BASE}/unread_notification_count/`),
}
