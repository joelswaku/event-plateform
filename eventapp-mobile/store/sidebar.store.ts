import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SidebarState {
  isCollapsed:  boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed:    (val: boolean) => void;
  setMobileOpen:   (val: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed:  false,
      isMobileOpen: false,
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed:    (val) => set({ isCollapsed: val }),
      setMobileOpen:   (val) => set({ isMobileOpen: val }),
    }),
    {
      name:    'sidebar-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ isCollapsed: s.isCollapsed }),
    }
  )
);
