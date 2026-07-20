import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  currentPeriod: 'morning' | 'afternoon' | 'evening';
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCurrentPeriod: (p: 'morning' | 'afternoon' | 'evening') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPeriod: 'morning',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCurrentPeriod: (p) => set({ currentPeriod: p }),
}));
