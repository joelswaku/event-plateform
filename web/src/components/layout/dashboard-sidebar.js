
"use client";

import Link          from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  LayoutDashboard, CalendarDays, PlusSquare, Ticket,
  Settings, Sparkles, ChevronLeft, ChevronRight, X, Star, LogOut,
} from "lucide-react";
import { useSidebarStore }      from "@/store/sidebar.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useAuthStore }         from "@/store/auth.store";

const navItems = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Events",       href: "/events",        icon: CalendarDays },
  { label: "Tickets",      href: "/tickets",       icon: Ticket },
  { label: "Create Event", href: "/events/create", icon: PlusSquare },
];

function SidebarItem({ item, showExpanded }) {
  const pathname = usePathname();
  const Icon     = item.icon;
  const active   = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      title={!showExpanded ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        !showExpanded ? "justify-center" : ""
      } ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {showExpanded && <span className="truncate">{item.label}</span>}
      {!showExpanded && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export default function DashboardSidebar() {
  const router = useRouter();
  const { isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();
  const isSubscribed     = useSubscriptionStore((s) => s.isSubscribed);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const logoutAction     = useAuthStore((s) => s.logout);

  const isClient      = useSyncExternalStore(() => () => {}, () => true, () => false);
  const safeCollapsed = isClient ? isCollapsed  : false;

  const showExpanded = !safeCollapsed;

  // ── FIX: await store logout then navigate with router ───────────────────────
  async function handleLogout() {
    try {
      await logoutAction();
    } catch {
      // Even if server call fails, always navigate to login
    }
    router.push("/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950 md:sticky md:top-0 md:h-screen ${
          safeCollapsed ? "w-16" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className={`flex h-16 items-center border-b border-gray-200 dark:border-gray-800 ${showExpanded ? "justify-between px-4" : "justify-center px-2"}`}>
          {showExpanded && (
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">EventPlatform</span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapsed}
              className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 md:flex"
              title={safeCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {safeCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.href} item={item} showExpanded={showExpanded} />
          ))}
        </nav>

        {/* Upgrade banner */}
        {!isSubscribed && showExpanded && (
          <div className="mx-3 mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Go Premium</span>
            </div>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mb-2.5 leading-relaxed">
              Unlock unlimited events, all templates, and advanced features.
            </p>
            <button
              onClick={() => openUpgradeModal("general")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade now
            </button>
          </div>
        )}

        {/* Footer: Settings + Logout */}
        <div className={`border-t border-gray-200 dark:border-gray-800 p-3 space-y-1`}>
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors ${!showExpanded ? "justify-center" : ""}`}
            title={!showExpanded ? "Settings" : undefined}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {showExpanded && <span>Settings</span>}
          </Link>

          {/* ── Logout button — calls handleLogout which awaits + navigates ── */}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors ${!showExpanded ? "justify-center" : ""}`}
            title={!showExpanded ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showExpanded && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}















// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSyncExternalStore } from "react";
// import {
//   LayoutDashboard,
//   CalendarDays,
//   PlusSquare,
//   Ticket,
//   Settings,
//   Sparkles,
//   ChevronLeft,
//   ChevronRight,
//   X,
//   Star,
//   LogOut,
// } from "lucide-react";
// import { useSidebarStore } from "@/store/sidebar.store";
// import { useSubscriptionStore } from "@/store/subscription.store";
// import { useAuthStore } from "@/store/auth.store";

// const navItems = [
//   { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
//   { label: "Events",       href: "/events",        icon: CalendarDays },
//   { label: "Tickets",      href: "/tickets",       icon: Ticket },
//   { label: "Create Event", href: "/events/create", icon: PlusSquare },
// ];

// function SidebarItem({ item, showExpanded }) {
//   const pathname = usePathname();
//   const Icon = item.icon;
//   const active = pathname === item.href || pathname.startsWith(item.href + "/");

//   return (
//     <Link
//       href={item.href}
//       title={!showExpanded ? item.label : undefined}
//       className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
//         !showExpanded ? "justify-center" : ""
//       } ${
//         active
//           ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
//           : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
//       }`}
//     >
//       <Icon className="h-4 w-4 shrink-0" />
//       {showExpanded && <span className="truncate">{item.label}</span>}
//       {!showExpanded && (
//         <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
//           {item.label}
//         </span>
//       )}
//     </Link>
//   );
// }

// export default function DashboardSidebar() {
//   const { isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } =
//     useSidebarStore();
//   const isSubscribed     = useSubscriptionStore((s) => s.isSubscribed);
//   const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
//   const logout           = useAuthStore((s) => s.logout);

//   // useSyncExternalStore returns false on the server and true on the client,
//   // so both the server render and the first client render use the same safe
//   // defaults — preventing the localStorage-rehydration attribute mismatch.
//   const isClient = useSyncExternalStore(
//     () => () => {},
//     () => true,
//     () => false,
//   );

//   const safeCollapsed  = isClient ? isCollapsed  : false;
//   const safeSubscribed = isClient ? isSubscribed : false;
//   const showExpanded   = !safeCollapsed || isMobileOpen;

//   return (
//     <>
//       {/* Mobile backdrop */}
//       {isMobileOpen && (
//         <div
//           className="fixed inset-0 z-30 bg-black/50 md:hidden"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`
//           fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white
//           transition-all duration-300 ease-in-out
//           dark:border-gray-800 dark:bg-gray-950
//           md:static md:z-auto
//           ${isCollapsed ? "md:w-20" : "md:w-64"}
//           ${isMobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
//         `}
//       >
//         {/* Logo row */}
//         <div
//           className={`flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800 ${
//             showExpanded ? "justify-between px-4" : "justify-center px-2"
//           }`}
//         >
//           {showExpanded ? (
//             <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
//               <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
//                 <Sparkles className="h-4 w-4 text-white" />
//               </div>
//               <div className="min-w-0">
//                 <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
//                   MeetCraft
//                 </p>
//                 <p className="truncate text-[11px] text-gray-400">Event Platform</p>
//               </div>
//             </Link>
//           ) : (
//             <Link
//               href="/dashboard"
//               className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600"
//             >
//               <Sparkles className="h-4 w-4 text-white" />
//             </Link>
//           )}

//           {/* Desktop collapse toggle */}
//           <button
//             onClick={toggleCollapsed}
//             className="hidden h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 md:flex"
//           >
//             {isCollapsed ? (
//               <ChevronRight className="h-4 w-4" />
//             ) : (
//               <ChevronLeft className="h-4 w-4" />
//             )}
//           </button>

//           {/* Mobile close */}
//           <button
//             onClick={() => setMobileOpen(false)}
//             className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         {/* Nav */}
//         <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
//           {navItems.map((item) => (
//             <SidebarItem key={item.href} item={item} showExpanded={showExpanded} />
//           ))}
//         </nav>

//         {/* Plan card — expanded only */}
//         {showExpanded && (
//           safeSubscribed ? (
//             <div className="mx-3 mb-4 rounded-2xl bg-linear-to-br from-amber-50 to-yellow-50 border border-amber-100 p-4 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/30">
//               <div className="flex items-center gap-2 mb-1">
//                 <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
//                 <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
//                   Premium
//                 </p>
//               </div>
//               <p className="text-[11px] leading-relaxed text-amber-700/70 dark:text-amber-300/60">
//                 All templates and features unlocked.
//               </p>
//             </div>
//           ) : (
//             <div className="mx-3 mb-4 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/40 dark:to-violet-950/40">
//               <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
//                 Upgrade plan
//               </p>
//               <p className="mt-1 text-[11px] leading-relaxed text-indigo-700/70 dark:text-indigo-300/60">
//                 Unlock custom domains, analytics &amp; more.
//               </p>
//               <button
//                 onClick={() => openUpgradeModal()}
//                 className="mt-3 w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
//               >
//                 Upgrade now
//               </button>
//             </div>
//           )
//         )}

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-2 dark:border-gray-800 space-y-0.5">
//           <SidebarItem
//             item={{ label: "Settings", href: "/settings", icon: Settings }}
//             showExpanded={showExpanded}
//           />
//           <button
//             onClick={logout}
//             title="Log out"
//             className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${
//               !showExpanded ? "justify-center" : ""
//             }`}
//           >
//             <LogOut className="h-4 w-4 shrink-0" />
//             {showExpanded && <span className="truncate">Log out</span>}
//             {!showExpanded && (
//               <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
//                 Log out
//               </span>
//             )}
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }
