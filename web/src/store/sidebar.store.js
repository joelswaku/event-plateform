"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useSidebarStore = create(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setMobileOpen: (val) => set({ isMobileOpen: val }),
    }),
    {
      name: "sidebar-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ isCollapsed: s.isCollapsed }),
    }
  )
);
