import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token as string)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'

    if (error.response) {
      const { status, data, headers } = error.response
      const responseData = data as any
      const contentType = headers['content-type'] as string

      if (responseData && typeof responseData === 'object') {
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.detail) {
          errorMessage = responseData.detail
        } else {
          const firstValue = Object.values(responseData)[0]
          if (Array.isArray(firstValue)) {
            errorMessage = firstValue[0]
          } else if (typeof firstValue === 'string') {
            errorMessage = firstValue
          }
        }
      } else if (typeof responseData === 'string' && responseData && !responseData.includes('<!DOCTYPE html>')) {
        errorMessage = responseData
      }

      if (errorMessage === 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
        if (contentType && contentType.includes('text/html')) {
          if (status >= 500) {
            errorMessage = `Máy chủ đang gặp sự cố (${status}). Vui lòng thử lại sau.`
          } else if (status === 404) {
            errorMessage = 'Không tìm thấy tài nguyên yêu cầu (404).'
          } else {
            errorMessage = `Lỗi hệ thống (${status}).`
          }
        } else {
          errorMessage = `Lỗi hệ thống (${status}).`
        }
      }
    } else if (error.request) {
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    } else {
      errorMessage = error.message
    }

    ; (error as any).errorMessage = errorMessage

    const url = originalRequest?.url || ''
    const isAuthPath = url.includes('/v1/auth/') ||
      url.includes('/auth/') ||
      url.includes('login') ||
      url.includes('register')

    const shouldSkipRefresh = isAuthPath || url.includes('/refresh/')

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        const currentPath = window.location.pathname.replace(/\/$/, '')
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.clear()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh/`, {
          refresh: refreshToken,
        })

        const newAccessToken = data?.data?.access_token
        const newRefreshToken = data?.data?.refresh_token

        localStorage.setItem('access_token', newAccessToken)
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)

        processQueue(null, newAccessToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const currentPath = window.location.pathname.replace(/\/$/, '')
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.clear()
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
