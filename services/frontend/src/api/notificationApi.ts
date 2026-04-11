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
  /**
   * GET /api/v1/notifications/
   * List current user's notifications (supports filtering)
   */
  list: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Notification>>(`${NOTIFICATION_BASE}/`, { params }),

  /**
   * POST /api/v1/notifications/
   * Create notifications for a list of users (internal/admin use)
   */
  create: (payload: CreateNotificationPayload) =>
    axiosInstance.post<ApiResponse<Notification[]>>(`${NOTIFICATION_BASE}/`, payload),

  /**
   * POST /api/v1/notifications/:id/mark_as_read/
   * Mark a single notification as read
   */
  markAsRead: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`${NOTIFICATION_BASE}/${id}/mark_as_read/`),

  /**
   * POST /api/v1/notifications/mark_all_as_read/
   * Mark all of the current user's notifications as read
   */
  markAllAsRead: () =>
    axiosInstance.post<ApiResponse<void>>(`${NOTIFICATION_BASE}/mark_all_as_read/`),


  unreadCount: () =>
    axiosInstance.get<ApiResponse<number>>(`${NOTIFICATION_BASE}/unread_notification_count/`),
}
