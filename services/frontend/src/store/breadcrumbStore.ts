import { create } from 'zustand'

interface BreadcrumbState {
  titles: Record<string, string>
  setTitle: (id: string, title: string) => void
  clearTitles: () => void
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  titles: {},
  setTitle: (id, title) => 
    set((state) => ({ 
      titles: { ...state.titles, [id]: title } 
    })),
  clearTitles: () => set({ titles: {} }),
}))
