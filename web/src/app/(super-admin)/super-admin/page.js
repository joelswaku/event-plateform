"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CalendarDays, Building2, DollarSign, Ticket,
  Activity, TrendingUp, ArrowRight, Shield, Globe, Zap,
  Sparkles, Heart, ShieldAlert, AlertCircle, CheckCircle2,
  UserPlus, CreditCard, Star,
} from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

/* ─── Animated counter ─── */
function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start  = Date.now();
    let frame;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

/* ─── Formatting ─── */
function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/* ─── Skeleton ─── */
function Sk({ w = "100%", h = 16, r = 8 }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: "rgba(255,255,255,0.06)" }}
    />
  );
}
function KpiSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between mb-4">
        <Sk w={40} h={40} r={12} />
        <Sk w={60} h={10} />
      </div>
      <Sk w="60%" h={28} r={6} />
      <div className="mt-2"><Sk w="40%" h={10} /></div>
    </div>
  );
}

/* ─── SVG Revenue Line Chart ─── */
function RevenueLineChart({ data }) {
  if (!data?.length || data.every(d => parseFloat(d.revenue) === 0)) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl"
        style={{ height: 140, background: "rgba(201,169,110,0.04)", border: "1px dashed rgba(201,169,110,0.15)" }}
      >
        <TrendingUp size={24} style={{ color: "rgba(201,169,110,0.25)" }} />
        <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.22)" }}>Revenue data will appear here once tickets are sold</p>
      </div>
    );
  }
  const values = data.map(d => parseFloat(d.revenue));
  const max    = Math.max(...values, 1);
  const W = 580; const H = 100;
  const pts = data.map((_, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - ((values[i] / max) * (H - 8)) - 4,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fill = `M 0 ${H} ${pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${W} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 4}`} style={{ width: "100%", height: 140 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#revFill)" />
      <path d={line} fill="none" stroke="#c9a96e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c9a96e" opacity="0.9" />
      ))}
    </svg>
  );
}

/* ─── Mini bar chart ─── */
function MiniBarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(m => parseFloat(m.revenue)), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.slice(-12).map((m, i) => {
        const pct = (parseFloat(m.revenue) / max) * 100;
        return (
          <div key={i} title={`${m.month}: ${fmtMoney(m.revenue)}`} className="flex-1 flex flex-col items-center gap-0.5">
            <motion.div
              className="w-full rounded-t-sm"
              style={{ background: "linear-gradient(180deg,#c9a96e,#92672a)", minHeight: 2 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(pct, 2)}%` }}
              transition={{ delay: i * 0.03, duration: 0.5 }}
            />
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.20)" }}>
              {m.month?.split(" ")[0]?.slice(0, 3) ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Activity icon by type ─── */
const ACT_CFG = {
  user_registered:  { color: "#6366f1", Icon: UserPlus,  label: "Registered" },
  ticket_purchased: { color: "#10b981", Icon: CreditCard, label: "Ticket" },
  event_published:  { color: "#f59e0b", Icon: CalendarDays, label: "Published" },
  plan_upgraded:    { color: "#c9a96e", Icon: Star,      label: "Upgraded" },
};
function actDesc(item) {
  switch (item.type) {
    case "user_registered":  return `${item.full_name ?? item.email} joined the platform`;
    case "ticket_purchased": return `${item.buyer_name} bought ${item.ticket_type ?? "ticket"} · ${item.event_title}`;
    case "event_published":  return `${item.title} published by ${item.org_name}`;
    case "plan_upgraded":    return `${item.full_name} upgraded to ${item.subscription_plan}`;
    default: return "Platform event";
  }
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, sub, Icon, accent, delay = 0, animValue, isMoney }) {
  const display = animValue !== undefined
    ? (isMoney ? fmtMoney(animValue) : fmt(animValue))
    : value;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-5 group cursor-default"
      style={{ background: "#0d0d1a", border: `1px solid ${accent}20` }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl transition-opacity group-hover:opacity-150"
        style={{ background: `${accent}16` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${accent}70` }}>
          {label}
        </span>
      </div>
      <p className="text-[26px] font-black tracking-tight text-white tabular-nums">{display}</p>
      {sub && <p className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>{sub}</p>}
    </motion.div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ title, href, linkLabel, live }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-black text-white">{title}</h2>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.20)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: "#10b981" }}>Live</span>
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:text-white" style={{ color: "#c9a96e" }}>
          {linkLabel ?? "View all"} <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

/* ─── Insight type config ─── */
const INSIGHT_CFG = {
  opportunity: { bg: "rgba(201,169,110,0.15)", text: "#c9a96e", dot: "#c9a96e" },
  warning:     { bg: "rgba(239,68,68,0.15)",   text: "#ef4444", dot: "#ef4444" },
  growth:      { bg: "rgba(16,185,129,0.15)",  text: "#10b981", dot: "#10b981" },
  alert:       { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b", dot: "#f59e0b" },
  insight:     { bg: "rgba(99,102,241,0.15)",  text: "#818cf8", dot: "#818cf8" },
};

/* ─── Main dashboard ─── */
export default function SuperAdminDashboard() {
  const {
    stats, revenue, activity, health, aiInsights, financial,
    fetchStats, fetchRevenue, fetchActivity, fetchHealth, fetchAiInsights, fetchFinancial,
    loading,
  } = useSuperAdminStore();

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Show page as soon as fast DB queries complete; AI insights + financial load in background
    Promise.all([
      fetchStats(), fetchRevenue(), fetchActivity(), fetchHealth(),
    ]).then(() => setDataLoaded(true));
    fetchAiInsights();
    fetchFinancial();
  }, []);

  const s = stats ?? {};

  /* Animated counters */
  const cRevenue  = useCountUp(s.totalRevenue  ?? 0);
  const cUsers    = useCountUp(s.totalUsers    ?? 0);
  const cEvents   = useCountUp(s.totalEvents   ?? 0);
  const cTickets  = useCountUp(s.totalTickets  ?? 0);
  const cOrgs     = useCountUp(s.totalOrgs     ?? 0);
  const cActive   = useCountUp(s.activeEvents  ?? 0);
  const cNew      = useCountUp(s.newUsersLast30 ?? 0);

  const recentActivity = (activity ?? []).slice(0, 8);
  const topInsights    = (aiInsights?.insights ?? []).slice(0, 3);
  const svc            = health?.services ?? {};
  const allOk          = Object.values(svc).every(s => ["operational","connected"].includes(s?.status));

  if (!dataLoaded) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Sk w={44} h={44} r={16} />
          <div className="space-y-2"><Sk w={120} h={10} /><Sk w={220} h={22} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(8).fill(0).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[240, 240, 240].map((h, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ height: h, background: "#0d0d1a" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", boxShadow: "0 6px 24px rgba(201,169,110,0.30)" }}
        >
          <Shield size={20} className="text-black" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Platform Overview</p>
          <h1 className="text-[22px] font-black tracking-tight text-white">Super Admin Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: allOk ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${allOk ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
          <div className={`h-2 w-2 rounded-full ${allOk ? "bg-[#10b981] animate-pulse" : "bg-[#ef4444]"}`} />
          <span className="text-[11px] font-bold" style={{ color: allOk ? "#10b981" : "#ef4444" }}>
            {allOk ? "All systems operational" : "System issue detected"}
          </span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Revenue"   isMoney animValue={cRevenue}  sub="Gross platform revenue"         Icon={DollarSign}   accent="#c9a96e" delay={0}    />
        <KpiCard label="Total Users"              animValue={cUsers}   sub={`+${fmt(s.newUsersLast30)} last 30d`} Icon={Users} accent="#6366f1" delay={0.05} />
        <KpiCard label="Total Events"             animValue={cEvents}  sub={`${fmt(s.activeEvents)} published`}  Icon={CalendarDays} accent="#10b981" delay={0.10} />
        <KpiCard label="Tickets Sold"             animValue={cTickets} sub="Issued across platform"          Icon={Ticket}       accent="#f59e0b" delay={0.15} />
        <KpiCard label="Organizations"            animValue={cOrgs}   sub="Active accounts"                  Icon={Building2}    accent="#a78bfa" delay={0.20} />
        <KpiCard label="Live Events"              animValue={cActive} sub="Currently published"               Icon={Activity}     accent="#10b981" delay={0.25} />
        <KpiCard label="New Users (30d)"          animValue={cNew}    sub="Past 30 days"                     Icon={TrendingUp}   accent="#06b6d4" delay={0.30} />
        <KpiCard label="Avg / Ticket" isMoney
          animValue={s.totalTickets > 0 ? Math.round((s.totalRevenue ?? 0) / s.totalTickets) : 0}
          sub="Revenue per ticket sold" Icon={Globe} accent="#10b981" delay={0.35} />
      </div>

      {/* Row 2: Revenue chart + Activity + AI */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="lg:col-span-2 rounded-2xl p-6 space-y-4"
          style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
        >
          <SectionHeader title="Revenue Trend (30 days)" href="/super-admin/financial" linkLabel="Full report" />
          <RevenueLineChart data={financial?.daily30 ?? revenue?.monthly ?? []} />
          {/* Mini monthly bars */}
          {revenue?.monthly?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Monthly overview</p>
              <MiniBarChart data={revenue.monthly} />
            </div>
          )}
        </motion.div>

        {/* Live activity mini-feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
        >
          <SectionHeader title="Live Activity" href="/super-admin/activity" live />
          <div className="flex-1 space-y-2 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Activity size={28} style={{ color: "rgba(255,255,255,0.12)" }} />
                <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.22)" }}>
                  Activity will appear here as users register and purchase tickets
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {recentActivity.map((item, i) => {
                  const cfg = ACT_CFG[item.type] ?? ACT_CFG.user_registered;
                  const Icon = cfg.Icon;
                  return (
                    <motion.div
                      key={item.id || i}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-2.5 rounded-xl px-2.5 py-2"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{ background: `${cfg.color}18` }}
                      >
                        <Icon size={11} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white leading-snug line-clamp-2">
                          {actDesc(item)}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                          {timeAgo(item.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Top events + AI insights + System health */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top events */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.50 }}
          className="rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}
        >
          <SectionHeader title="Top Events · Revenue" href="/super-admin/events" />
          <div className="space-y-2">
            {(revenue?.topEvents ?? []).slice(0, 5).map((ev, i) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: i % 2 === 0 ? "#111127" : "transparent" }}>
                <span className="text-[11px] font-black w-4 tabular-nums" style={{ color: "rgba(201,169,110,0.50)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{ev.title}</p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.28)" }}>{ev.org_name}</p>
                </div>
                <span className="text-[12px] font-black tabular-nums" style={{ color: "#c9a96e" }}>{fmtMoney(ev.revenue)}</span>
              </div>
            ))}
            {!revenue?.topEvents?.length && (
              <div className="flex flex-col items-center gap-2 py-8">
                <DollarSign size={24} style={{ color: "rgba(255,255,255,0.10)" }} />
                <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.22)" }}>Revenue data appears once tickets are sold</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
          className="rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}
        >
          <SectionHeader title="AI Insights" href="/super-admin/ai" linkLabel="Full analysis" />
          <div className="space-y-3">
            {topInsights.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Sparkles size={24} style={{ color: "rgba(255,255,255,0.10)" }} />
                <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.22)" }}>Loading AI insights…</p>
              </div>
            ) : topInsights.map((ins, i) => {
              const cfg = INSIGHT_CFG[ins.type] ?? INSIGHT_CFG.insight;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.dot}22` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                    <p className="text-[11px] font-black text-white">{ins.title}</p>
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider" style={{ color: cfg.text }}>{ins.priority}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                    {ins.description?.slice(0, 90)}{ins.description?.length > 90 ? "…" : ""}
                  </p>
                  {ins.metric && (
                    <p className="text-[12px] font-black" style={{ color: cfg.dot }}>{ins.metric}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* System health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
          className="rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}
        >
          <SectionHeader title="System Health" href="/super-admin/health" />
          <div className="space-y-2.5">
            {Object.entries(svc).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Heart size={24} style={{ color: "rgba(255,255,255,0.10)" }} />
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>Checking services…</p>
              </div>
            ) : (
              Object.entries(svc).map(([name, info]) => {
                const ok = ["operational", "connected"].includes(info?.status);
                const na = info?.status === "not_configured";
                const color = ok ? "#10b981" : na ? "rgba(255,255,255,0.25)" : "#ef4444";
                return (
                  <div key={name} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color, boxShadow: ok ? `0 0 8px ${color}60` : "none" }} />
                    <span className="flex-1 text-[12px] font-semibold capitalize text-white">{name}</span>
                    <span className="text-[10px] font-bold capitalize" style={{ color }}>
                      {na ? "Not configured" : info?.status ?? "unknown"}
                    </span>
                    {info?.latency > 0 && (
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{info.latency}ms</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {health && (
            <div className="mt-4 pt-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: "rgba(255,255,255,0.30)" }}>Uptime</span>
                <span className="font-bold text-white">
                  {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: "rgba(255,255,255,0.30)" }}>Environment</span>
                <span className="font-bold text-white capitalize">{health.environment}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick nav */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
        <h2 className="text-[14px] font-black text-white mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/super-admin/events",        label: "Manage Events",       Icon: CalendarDays, accent: "#10b981", sub: `${fmt(s.totalEvents)} total` },
            { href: "/super-admin/organizations",  label: "Organizations",       Icon: Building2,    accent: "#a78bfa", sub: `${fmt(s.totalOrgs)} accounts` },
            { href: "/super-admin/users",          label: "Users & Permissions", Icon: Users,        accent: "#6366f1", sub: `${fmt(s.totalUsers)} members` },
            { href: "/super-admin/moderation",     label: "Moderation Center",   Icon: ShieldAlert,  accent: "#ef4444", sub: "Safety & fraud" },
            { href: "/super-admin/financial",      label: "Financial Center",    Icon: DollarSign,   accent: "#c9a96e", sub: fmtMoney(s.totalRevenue) + " GMV" },
            { href: "/super-admin/ai",             label: "AI Insights",         Icon: Sparkles,     accent: "#818cf8", sub: "Platform analytics" },
            { href: "/super-admin/flags",          label: "Feature Flags",       Icon: Zap,          accent: "#f59e0b", sub: "Toggle features" },
            { href: "/super-admin/audit",          label: "Audit Logs",          Icon: AlertCircle,  accent: "#06b6d4", sub: "Admin actions" },
          ].map(({ href, label, Icon, accent, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "#0d0d1a", border: `1px solid ${accent}20` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
                <Icon size={15} style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white">{label}</p>
                {sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{sub}</p>}
              </div>
              <ArrowRight size={12} className="shrink-0 opacity-25 transition-transform group-hover:translate-x-0.5" style={{ color: accent }} />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
