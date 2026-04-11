import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserWithTokens } from '../types'
import { authApi } from '../api'

interface AuthState {
  user: UserWithTokens | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserWithTokens) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login({ email, password })
          const userData = response.data?.data

          if (!userData) throw new Error('Login failed: No user data returned')

          localStorage.setItem('access_token', userData.access_token)
          localStorage.setItem('refresh_token', userData.refresh_token)

          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token')
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken)
          }
        } catch (_) {
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({ user: null, isAuthenticated: false })
        }
      },

      setUser: (user: UserWithTokens) => {
        set({ user, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
