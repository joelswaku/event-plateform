"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  LayoutDashboard, CheckSquare, Clock, DollarSign, Store,
  Users, FileText, Folder, Sparkles, Settings, ChevronLeft,
  ChevronRight, Heart, Bell, Search, Zap, Menu, X,
} from "lucide-react";

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard, href: ""          },
  { id: "tasks",     label: "Tasks",     icon: CheckSquare,     href: "/tasks"    },
  { id: "timeline",  label: "Timeline",  icon: Clock,           href: "/timeline" },
  { id: "budget",    label: "Budget",    icon: DollarSign,      href: "/budget"   },
  { id: "vendors",   label: "Vendors",   icon: Store,           href: "/vendors"  },
  { id: "team",      label: "Team",      icon: Users,           href: "/team"     },
  { id: "notes",     label: "Notes",     icon: FileText,        href: "/notes"    },
  { id: "files",     label: "Files",     icon: Folder,          href: "/files"    },
  { id: "ai-brief",  label: "AI Brief",  icon: Sparkles,        href: "/ai-brief" },
  { id: "settings",  label: "Settings",  icon: Settings,        href: "/settings" },
];

const EVENT_TYPE_EMOJI = {
  wedding:"💍", conference:"🎤", concert:"🎵", birthday:"🎂",
  corporate:"💼", festival:"🎪", party:"🎉", gala:"✨", networking:"🤝",
};

function useCountdown(targetDate) {
  const [time, setTime] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    function tick() {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setTime({ days: 0, hrs: 0, mins: 0, past: true }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hrs:  Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        past: false,
      });
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

function ProgressRing({ pct = 0, size = 36, stroke = 3.5, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ minWidth: size }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

function SidebarLink({ tab, base, pathname, collapsed }) {
  const Icon = tab.icon;
  const to = base + tab.href;
  const active = tab.href === ""
    ? pathname === base
    : pathname.startsWith(base + tab.href);

  return (
    <Link
      href={to}
      title={collapsed ? tab.label : undefined}
      className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 group active:scale-[0.97]
        ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"}
        ${active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
          : "text-gray-400 hover:text-white hover:bg-white/6"
        }`}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-300 rounded-r-full" />
      )}
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{tab.label}</span>}

      {/* Tooltip for collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity shadow-xl">
          {tab.label}
        </span>
      )}
    </Link>
  );
}

function MobileTabBar({ base, pathname }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll active tab into view on route change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      className="lg:hidden flex overflow-x-auto bg-[#0b0b18] border-b border-white/6 px-3 py-2.5 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0"
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        const to = base + tab.href;
        const active = tab.href === ""
          ? pathname === base
          : pathname.startsWith(base + tab.href);
        return (
          <Link
            key={tab.id}
            href={to}
            ref={active ? activeRef : null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
              active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white/6 text-gray-400 hover:text-white hover:bg-white/10 border border-white/8"
              }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function PlannerShell({ children }) {
  const { projectId } = useParams();
  const pathname = usePathname();
  const { currentProject, tasks, team, aiGenerating } = usePlannerStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = `/planner/${projectId}`;
  const countdown = useCountdown(currentProject?.event_date);

  const allTasks = Object.values(tasks).flat();
  const donePct = allTasks.length > 0
    ? Math.round((tasks.DONE.length / allTasks.length) * 100)
    : 0;
  const health = currentProject?.health_score ?? 0;
  const healthColor = health >= 70 ? "#10b981" : health >= 40 ? "#f59e0b" : "#ef4444";
  const emoji = EVENT_TYPE_EMOJI[currentProject?.event_type?.toLowerCase()] ?? "📋";

  const memberAvatars = team.slice(0, 4);

  return (
    <div className="relative flex h-full flex-1 min-h-0 bg-[#07070f] overflow-hidden">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Left Sidebar ── */}
      <aside className={[
        "z-50 flex flex-col bg-[#0b0b18] border-r border-white/6 transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-15" : "w-55",
        mobileOpen ? "translate-x-0 absolute inset-y-0 left-0 h-full shadow-2xl" : "-translate-x-full lg:translate-x-0 absolute lg:relative",
      ].join(" ")}>
        {/* Mobile sidebar header — close button */}
        <div className="lg:hidden flex items-center justify-between px-3 pt-3 pb-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Project</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project identity */}
        <div className="px-3 py-4 border-b border-white/6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-base shrink-0">
              {emoji}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white leading-tight truncate">
                  {currentProject?.title || "Loading…"}
                </p>
                <p className="text-[10px] text-gray-500 capitalize mt-0.5">
                  {currentProject?.event_type || "Planner"}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ProgressRing pct={donePct} size={28} stroke={3} color="#6366f1" />
                <div>
                  <p className="text-[10px] font-bold text-white">{donePct}%</p>
                  <p className="text-[9px] text-gray-500">done</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" style={{ color: healthColor }} />
                <span className="text-[10px] font-bold" style={{ color: healthColor }}>{health}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav items — hidden on mobile (tab bar handles nav), shown on desktop */}
        <nav className={`hidden lg:flex flex-1 flex-col overflow-y-auto py-3 space-y-0.5 ${collapsed ? "px-2" : "px-2"}`}>
          {TABS.map(tab => (
            <SidebarLink key={tab.id} tab={tab} base={base} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        {/* Mobile-only sidebar content: project stats overview */}
        <div className="lg:hidden flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {/* Countdown */}
          {countdown && !countdown.past && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Time Remaining</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-lg font-black text-white tabular-nums">{countdown.days}d {countdown.hrs}h</span>
              </div>
            </div>
          )}
          {countdown?.past && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
              <span className="text-sm font-bold text-gray-400">Event passed</span>
            </div>
          )}
          {/* Tasks progress */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Tasks Progress</p>
            <div className="flex items-center gap-2 mb-2">
              <ProgressRing pct={donePct} size={36} stroke={3.5} color="#6366f1" />
              <div>
                <p className="text-base font-black text-white">{donePct}%</p>
                <p className="text-[10px] text-gray-500">{tasks.DONE?.length ?? 0} of {allTasks.length} done</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${donePct}%` }} />
            </div>
          </div>
          {/* Health */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Health Score</p>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" style={{ color: healthColor }} />
              <span className="text-lg font-black" style={{ color: healthColor }}>{health}</span>
              <span className="text-[10px] text-gray-500">/ 100</span>
            </div>
          </div>
          {/* Team */}
          {memberAvatars.length > 0 && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Team</p>
              <div className="flex -space-x-2">
                {memberAvatars.map(m => (
                  <div key={m.user_id || m.id || m.email} title={m.name}
                    className="w-8 h-8 rounded-full border-2 border-[#0b0b18] bg-indigo-600/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.name} className="w-full h-full rounded-full object-cover" />
                      : m.name?.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back + collapse toggle */}
        <div className="px-2 pb-3 pt-2 border-t border-white/6 space-y-1">
          {!collapsed && (
            <Link
              href="/planner"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/6 text-xs transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              All Projects
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(p => !p)}
            className="flex items-center justify-center w-full py-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/6 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Sticky project header */}
        <header className="sticky top-0 z-30 bg-[#07070f]/90 backdrop-blur-md border-b border-white/6">
          <div className="flex items-center gap-3 px-4 py-2.5 lg:px-5 lg:py-3">
            {/* Mobile menu — opens sidebar with project stats */}
            <button
              type="button"
              onClick={() => setMobileOpen(p => !p)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Project title + badge */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-base">{emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {currentProject?.title || "Loading…"}
                </p>
                {currentProject?.event_date && (
                  <p className="text-[11px] text-gray-500 leading-tight">
                    {new Date(currentProject.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              {currentProject?.status && (
                <span className={`hidden sm:inline-flex shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentProject.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                  currentProject.status === "ARCHIVED" ? "bg-gray-500/20 text-gray-400" :
                  "bg-indigo-500/20 text-indigo-400"
                }`}>
                  {currentProject.status}
                </span>
              )}
            </div>

            {/* Countdown */}
            {countdown && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {countdown.past ? (
                  <span className="text-xs text-gray-500 font-semibold">Event passed</span>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5">
                    <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-white tabular-nums">
                      {countdown.days}d {countdown.hrs}h
                    </span>
                    <span className="text-[10px] text-gray-500">remaining</span>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <ProgressRing pct={donePct} size={32} stroke={3} color="#6366f1" />
              <div>
                <p className="text-xs font-bold text-white leading-none">{donePct}%</p>
                <p className="text-[10px] text-gray-500">planned</p>
              </div>
            </div>

            {/* Team avatars */}
            {memberAvatars.length > 0 && (
              <div className="hidden sm:flex -space-x-1.5 shrink-0">
                {memberAvatars.map((m, i) => (
                  <div key={m.user_id || m.id || m.email} title={m.name}
                    className="w-7 h-7 rounded-full border-2 border-[#07070f] bg-indigo-600/40 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.name} className="w-full h-full rounded-full object-cover" />
                      : m.name?.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            )}

            {/* AI status indicator */}
            {aiGenerating && (
              <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-[11px] text-indigo-300 font-semibold">AI thinking…</span>
              </div>
            )}
          </div>

          {/* Progress bar strip */}
          <div className="h-0.5 bg-white/4">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${donePct}%` }}
            />
          </div>
        </header>

        {/* Mobile horizontal tab bar — replaces sidebar nav on small screens */}
        <MobileTabBar base={base} pathname={pathname} />

        {/* Content area — pb-16 clears the fixed bottom nav (visible up to md) */}
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
