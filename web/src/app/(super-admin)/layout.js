"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard, Activity, CalendarDays, Building2,
  Users, DollarSign, TrendingUp, ShieldAlert, Sparkles,
  ToggleRight, ClipboardList, Search, LogOut, Shield,
  ChevronRight, Zap, Heart, Command, Menu, X, Bell, Store, FileText, LifeBuoy,
} from "lucide-react";
import CommandPalette from "@/components/super-admin/CommandPalette";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const NAV = [
  { href: "/super-admin",               label: "Dashboard",     Icon: LayoutDashboard },
  { href: "/super-admin/activity",      label: "Activity",      Icon: Activity        },
  { href: "/super-admin/events",        label: "Events",        Icon: CalendarDays    },
  { href: "/super-admin/organizations", label: "Organizations", Icon: Building2       },
  { href: "/super-admin/users",         label: "Users",         Icon: Users           },
  { href: "/super-admin/chat",          label: "Support",       Icon: LifeBuoy        },
  { href: "/super-admin/vendors",       label: "Vendors",       Icon: Store           },
  { href: "/super-admin/notifications", label: "Notifications", Icon: Bell            },
  { href: "/super-admin/revenue",       label: "Revenue",       Icon: DollarSign      },
  { href: "/super-admin/financial",     label: "Financial",     Icon: TrendingUp      },
  { href: "/super-admin/moderation",    label: "Moderation",    Icon: ShieldAlert     },
  { href: "/super-admin/ai",            label: "AI Insights",   Icon: Sparkles        },
  { href: "/super-admin/health",        label: "System Health", Icon: Heart           },
  { href: "/super-admin/flags",         label: "Feature Flags", Icon: ToggleRight     },
  { href: "/super-admin/audit",         label: "Audit Logs",    Icon: ClipboardList   },
  { href: "/super-admin/legal",         label: "Legal Pages",   Icon: FileText        },
  { href: "/super-admin/search",        label: "Search",        Icon: Search          },
];

export default function SuperAdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [cmdOpen,     setCmdOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { moderation, fetchModeration } = useSuperAdminStore();
  const alertCount = (moderation?.suspiciousTickets?.length ?? 0) + (moderation?.suspended?.length ?? 0);

  useEffect(() => {
    if (user && !user.is_super_admin) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { fetchModeration(); }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  if (!user?.is_super_admin) return null;

  async function handleLogout() {
    await logout().catch(() => {});
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#06060e", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          background:  "linear-gradient(180deg,#0d0d1a 0%,#09090f 100%)",
          borderRight: "1px solid rgba(201,169,110,0.12)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(201,169,110,0.10)" }}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", boxShadow: "0 4px 16px rgba(201,169,110,0.35)" }}
          >
            <Shield size={16} className="text-black" />
          </div>
          <div>
            <p className="text-[13px] font-black tracking-tight text-white">Super Admin</p>
            <p className="text-[10px]" style={{ color: "rgba(201,169,110,0.70)" }}>Platform Control</p>
          </div>
        </div>

        {/* CMD+K Search bar */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Search size={12} style={{ color: "rgba(255,255,255,0.30)" }} />
            <span className="flex-1 text-left text-[12px]" style={{ color: "rgba(255,255,255,0.28)" }}>Search…</span>
            <span className="flex items-center gap-0.5">
              <kbd className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)" }}>⌘K</kbd>
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const exact  = href === "/super-admin";
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
                style={{
                  background:  active ? "rgba(201,169,110,0.12)" : "transparent",
                  color:       active ? "#c9a96e" : "rgba(255,255,255,0.48)",
                  borderLeft:  active ? "2px solid #c9a96e" : "2px solid transparent",
                }}
              >
                <Icon size={14} />
                <span className="flex-1">{label}</span>
                {href === "/super-admin/moderation" && alertCount > 0 && !active && (
                  <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black"
                    style={{ background: "#ef4444", color: "#fff", minWidth: 16, textAlign: "center", lineHeight: "1.4" }}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
                {active && <ChevronRight size={11} className="opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid rgba(201,169,110,0.10)" }}>
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1"
            style={{ background: "rgba(201,169,110,0.07)" }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
              style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}
            >
              {(user?.full_name ?? "SA").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{user?.full_name ?? "Super Admin"}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(201,169,110,0.60)" }}>Platform Owner</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <ChevronRight size={12} className="rotate-180" />
            Back to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all hover:bg-red-500/10"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─── */}
      <main className="flex-1 lg:pl-64 min-h-screen w-full">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3.5"
          style={{ background: "rgba(6,6,14,0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(201,169,110,0.08)" }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="flex lg:hidden items-center justify-center h-8 w-8 rounded-lg transition-all hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.60)" }}
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.18)" }}
          >
            <Zap size={10} fill="#c9a96e" style={{ color: "#c9a96e" }} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline" style={{ color: "#c9a96e" }}>
              Super Admin Mode
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest sm:hidden" style={{ color: "#c9a96e" }}>
              SA
            </span>
          </div>

          {/* CMD+K button — hidden on smallest screens */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex ml-2 items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
          >
            <Command size={11} />
            <span>Command</span>
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.30)" }}>All systems operational</span>
            </div>
            <div className="h-4 w-px mx-1 hidden sm:block" style={{ background: "rgba(255,255,255,0.08)" }} />
            <Link
              href="/super-admin/moderation"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              <Bell size={15} />
              {alertCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black"
                  style={{ background: "#ef4444", color: "#fff" }}>
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black transition-all hover:opacity-80"
                style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}
              >
                {(user?.full_name ?? "SA").slice(0, 2).toUpperCase()}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                  style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.22)", boxShadow: "0 20px 60px rgba(0,0,0,0.60), 0 0 0 1px rgba(201,169,110,0.06)" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[13px] font-bold text-white truncate">{user?.full_name ?? "Super Admin"}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{user?.email}</p>
                    <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>
                      Platform Owner
                    </span>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.50)" }}
                    >
                      <ChevronRight size={12} className="rotate-180" />
                      Back to Dashboard
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all hover:bg-red-500/10"
                      style={{ color: "rgba(255,255,255,0.40)" }}
                    >
                      <LogOut size={12} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
