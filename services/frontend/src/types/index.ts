// =====================
// Generic API Response
// =====================
export interface ApiResponse<T> {
  status: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  status: boolean
  data: T[]
  pagination: {
    total_items: number
    page_size: number
    current_page: number
    total_pages: number
    next_page: string | null
    previous_page: string | null
  }
}

// =====================
// Auth & User
// =====================
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface UserWithTokens extends User {
  access_token: string
  refresh_token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
}

// =====================
// Set
// =====================
export interface Set {
  id: number
  title: string
  description?: string
  user: number
  is_public: boolean
  permission?: 'view' | 'edit'
  created_at: string
  updated_at: string
}

export interface CreateSetPayload {
  title: string
  description?: string
  is_public?: boolean
}

// =====================
// Question
// =====================
export interface Question {
  id: number
  title: string
  type: string
  set: number
  answers?: QuizQuestionAnswer[]
  created_at: string
  updated_at: string
}

export interface CreateQuestionPayload {
  title: string
  type: string
  set: number
  answers: { content: string; is_correct: boolean }[]
}

// =====================
// Quiz
// =====================
export interface QuizQuestionAnswer {
  id: number
  content: string
  is_correct: boolean
}

export interface QuizQuestion {
  id: number
  quiz: number
  question?: number
  title: string
  type: string
  answers: QuizQuestionAnswer[]
  created_at: string
}

export interface Quiz {
  id: number
  title: string
  set: number
  user: number
  is_published: boolean
  question_count: number
  time_limit: number | null
  allow_resuming: boolean
  questions?: QuizQuestion[]
  permission?: 'view' | 'edit'
  set_title?: string
  created_at: string
  updated_at: string
}

export interface CreateQuizPayload {
  title: string
  set: number
}

export interface UpdateQuizPayload {
  title?: string
  is_published?: boolean
  time_limit?: number | null
  allow_resuming?: boolean
}

export interface CreateQuizQuestionPayload {
  question?: number
  title: string
  type: string
  answers: { content: string; is_correct: boolean }[]
}

export interface ShareQuizPayload {
  shares: { email: string; permission: string }[]
}

export interface ShareSetPayload {
  shares: { email: string; permission: string }[]
}


export interface QuizQuestionItem {
  id: number
  quiz: number
  question: number
  order?: number
}


export interface TestAnswer {
  id: number
  quiz_question: number
  answer_id?: number
  content?: string
  is_correct: boolean
}

export interface Test {
  id: number
  quiz: number
  user: number
  score?: number
  remaining_time?: number | null
  answers: TestAnswer[]
  started_at: string
}

export interface CreateTestPayload {
  quiz: number
}

export interface AnswerTestPayload {
  answers: { quiz_question_id: number; answer_id?: number; content?: string }[]
}


export interface Notification {
  id: number
  user: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}


export interface PaginationParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  [key: string]: string | number | boolean | undefined
}
