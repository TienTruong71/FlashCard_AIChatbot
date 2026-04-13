import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  toggle: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      toggle: () => set({ language: get().language === 'en' ? 'vi' : 'en' }),
    }),
    { name: 'quiztt-language' }
  )
)
