"use client";

import { Menu, Search, Bell, Sun, Moon, Sparkles, CreditCard, LogOut } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";
import { useSubscriptionStore } from "@/store/subscription.store";

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const user   = useAuthStore?.((s) => s.user) ?? null;
  const logout = useAuthStore?.((s) => s.logout);
  const { setMobileOpen, isMobileOpen } = useSidebarStore();
  const { isSubscribed, plan, subscriptionStatus, openCustomerPortal, openUpgradeModal, isLoading } =
    useSubscriptionStore();

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

          {/* Plan badge / upgrade CTA */}
          {isSubscribed ? (
            <button
              onClick={openCustomerPortal}
              disabled={isLoading}
              title="Manage billing"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400"
            >
              <Sparkles className="w-3 h-3" />
              Premium
              <CreditCard className="w-3 h-3 opacity-60" />
            </button>
          ) : (
            <button
              onClick={() => openUpgradeModal()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-semibold transition-all shadow-sm shadow-amber-200 dark:shadow-none"
            >
              <Sparkles className="w-3 h-3" />
              Upgrade
            </button>
          )}

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

          {/* User avatar + logout */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-1.5 dark:border-gray-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {user?.name ?? "Joel"}
              </p>
              <p className="text-[11px] text-gray-400">Organizer</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
