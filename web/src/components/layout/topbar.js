"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, Bell, Sun, Moon, Sparkles, CreditCard, LogOut, User, ChevronRight, Star, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme }            from "@/providers/ThemeProvider";
import { useAuthStore }        from "@/store/auth.store";
import { useSidebarStore }     from "@/store/sidebar.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useChatStore }        from "@/store/chat.store";
import { useNotifications }    from "@/hooks/useNotifications";
import NotificationPanel       from "@/components/layout/NotificationPanel";
import BillingModal            from "@/components/layout/BillingModal";

export default function Topbar() {
  const router         = useRouter();
  const { theme, resolvedTheme, toggle } = useTheme();
  const user           = useAuthStore((s) => s.user);
  const isSuperAdmin   = !!user?.is_super_admin;
  const logoutAction   = useAuthStore((s) => s.logout);
  const { setMobileOpen, isMobileOpen } = useSidebarStore();
  const { isSubscribed, plan, subscriptionStatus, openCustomerPortal, openUpgradeModal, isLoading } =
    useSubscriptionStore();

  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const chatUnreadTotal = useChatStore((s) => s.unreadTotal);
  const fetchChatUnread = useChatStore((s) => s.fetchUnreadCount);

  const [billingOpen,   setBillingOpen]  = useState(false);
  const [bellOpen,      setBellOpen]     = useState(false);
  const [profileOpen,   setProfileOpen]  = useState(false);

  // Fetch chat unread count for super admins
  useEffect(() => {
    if (isSuperAdmin) {
      fetchChatUnread();
      const interval = setInterval(() => fetchChatUnread(), 10000);
      return () => clearInterval(interval);
    }
  }, [isSuperAdmin, fetchChatUnread]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const bellRef      = useRef(null);
  const profileRef   = useRef(null);
  const fileInputRef = useRef(null);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    await updateAvatar(file);
    setAvatarLoading(false);
    e.target.value = "";
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileOpen) return;
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  function openBillingOrNavigate() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setBillingOpen(true);
    } else {
      router.push("/settings/billing");
    }
  }
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  // ── FIX: await logout then navigate — store cannot call router ──────────────
  async function handleLogout() {
    // Navigate first to prevent dashboard from trying to fetch data during logout
    router.replace("/login");
    // Then clear auth state (async, but we don't wait)
    try {
      await logoutAction();
    } catch {
      // Ignore logout API errors - state is already cleared client-side
    }
  }

  return (
    <>
    <header className="sticky top-0 z-20 border-b border-border bg-(--bg-surface)/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!isMobileOpen)}
            className="rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-elevated) md:hidden"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* CENTER — logo visible only on mobile */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:hidden">
          <Image src="/lite.png" alt="LiteEvent" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm tracking-tight text-(--text-primary)">LiteEvent</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Plan badge */}
          {isSubscribed ? (
            <button
              onClick={openBillingOrNavigate}
              className="hidden items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 sm:flex"
              suppressHydrationWarning
            >
              <CreditCard className="h-3.5 w-3.5" />
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
              {subscriptionStatus === "trialing" && " · Trial"}
            </button>
          ) : (
            <button
              onClick={openBillingOrNavigate}
              className="hidden items-center gap-1.5 rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 sm:flex"
              suppressHydrationWarning
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
            suppressHydrationWarning
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Support Chat (Super Admin Only) */}
          {isSuperAdmin && (
            <Link
              href="/chat"
              className="relative rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
              aria-label="Support Messages"
            >
              <MessageSquare className="h-4 w-4" />
              {chatUnreadTotal > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                  {chatUnreadTotal > 9 ? "9+" : chatUnreadTotal}
                </span>
              )}
            </Link>
          )}

          {/* Notifications */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
              aria-label="Notifications"
              suppressHydrationWarning
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {bellOpen && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={() => setBellOpen(false)}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Avatar + profile dropdown - Hidden on mobile, visible on desktop */}
          <div ref={profileRef} className="relative hidden lg:flex items-center gap-2 pl-2 border-l border-border">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => setProfileOpen((o) => !o)}
              title="My profile"
              className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white select-none hover:opacity-80 transition-opacity"
              suppressHydrationWarning
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                : initials}
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-border shadow-2xl z-50"
                  style={{ background: "var(--bg-surface)" }}
                >
                  {/* Profile header */}
                  <div className="relative px-4 pb-4 pt-5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.08) 100%)" }}>
                    <div className="flex items-center gap-3">
                      {/* Avatar with edit-photo overlay */}
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-black text-white shadow-lg">
                          {user?.avatar_url
                            ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                            : initials}
                        </div>
                        <button
                          onClick={() => { fileInputRef.current?.click(); }}
                          title="Change photo"
                          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-opacity hover:opacity-80"
                          style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-surface)" }}
                        >
                          {avatarLoading
                            ? <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" style={{ color: "var(--text-muted)" }} />
                            : <User size={9} style={{ color: "var(--text-muted)" }} />
                          }
                        </button>
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-(--text-primary)">{user?.name || "User"}</p>
                        <p className="truncate text-xs text-(--text-muted)">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav links */}
                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--bg-elevated)"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(99,102,241,0.1)" }}>
                        <User size={13} style={{ color: "#6366f1" }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-(--text-secondary)">My Profile</span>
                      <ChevronRight size={13} className="text-(--text-muted)" />
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); openBillingOrNavigate(); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--bg-elevated)"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(245,158,11,0.1)" }}>
                        <CreditCard size={13} style={{ color: "#f59e0b" }} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-(--text-secondary)">Billing</span>
                      <ChevronRight size={13} className="text-(--text-muted)" />
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
                        <LogOut size={13} style={{ color: "#ef4444" }} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium">Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
    <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
  </>
  );
}








// "use client";

// import { Menu, Search, Bell, Sun, Moon, Sparkles, CreditCard, LogOut } from "lucide-react";
// import { useTheme } from "@/providers/ThemeProvider";
// import { useAuthStore } from "@/store/auth.store";
// import { useSidebarStore } from "@/store/sidebar.store";
// import { useSubscriptionStore } from "@/store/subscription.store";

// export default function Topbar() {
//   const { theme, toggle } = useTheme();
//   const user   = useAuthStore?.((s) => s.user) ?? null;
//   const logout = useAuthStore?.((s) => s.logout);
//   const { setMobileOpen, isMobileOpen } = useSidebarStore();
//   const { isSubscribed, plan, subscriptionStatus, openCustomerPortal, openUpgradeModal, isLoading } =
//     useSubscriptionStore();

//   const initials = user?.name
//     ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
//     : "J";

//   return (
//     <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
//       <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

//         {/* LEFT */}
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => setMobileOpen(!isMobileOpen)}
//             className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
//           >
//             <Menu className="h-5 w-5" />
//           </button>

//           <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900 md:flex md:w-72">
//             <Search className="h-4 w-4 shrink-0 text-gray-400" />
//             <input
//               placeholder="Search events…"
//               className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
//             />
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div className="flex items-center gap-2">

//           {/* Plan badge / upgrade CTA */}
//           {isSubscribed ? (
//             <button
//               onClick={openCustomerPortal}
//               disabled={isLoading}
//               title="Manage billing"
//               className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400"
//             >
//               <Sparkles className="w-3 h-3" />
//               Premium
//               <CreditCard className="w-3 h-3 opacity-60" />
//             </button>
//           ) : (
//             <button
//               onClick={() => openUpgradeModal()}
//               className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-semibold transition-all shadow-sm shadow-amber-200 dark:shadow-none"
//             >
//               <Sparkles className="w-3 h-3" />
//               Upgrade
//             </button>
//           )}

//           {/* Theme toggle */}
//           <button
//             onClick={toggle}
//             title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
//             className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
//           >
//             {theme === "dark" ? (
//               <Sun className="h-4 w-4" />
//             ) : (
//               <Moon className="h-4 w-4" />
//             )}
//           </button>

//           {/* Notifications */}
//           <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800">
//             <Bell className="h-4 w-4" />
//             <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
//           </button>

//           {/* User avatar + logout */}
//           <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-1.5 dark:border-gray-800">
//             <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
//               {initials}
//             </div>
//             <div className="hidden md:block">
//               <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
//                 {user?.name ?? "Joel"}
//               </p>
//               <p className="text-[11px] text-gray-400">Organizer</p>
//             </div>
//             <button
//               onClick={logout}
//               title="Log out"
//               className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
//             >
//               <LogOut className="h-3.5 w-3.5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }
