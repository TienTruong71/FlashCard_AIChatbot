import { create } from 'zustand'

interface LayoutState {
  fullScreen: boolean
  setFullScreen: (v: boolean) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  fullScreen: false,
  setFullScreen: (v) => set({ fullScreen: v }),
}))
