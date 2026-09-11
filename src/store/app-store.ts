import { create } from 'zustand'

interface AppState {
  selectedProjectId: string | null
  sidebarOpen: boolean
  setSelectedProject: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedProjectId: null,
  sidebarOpen: false,
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
