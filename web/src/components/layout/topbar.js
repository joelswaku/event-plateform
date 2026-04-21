"use client";

import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const user = useAuthStore?.((s) => s.user) ?? null;
  const { setMobileOpen, isMobileOpen } = useSidebarStore();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "J";

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!isMobileOpen)}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900 md:flex md:w-72">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              placeholder="Search events…"
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-2.5 py-1.5 dark:border-gray-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {user?.name ?? "Joel"}
              </p>
              <p className="text-[11px] text-gray-400">Organizer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
