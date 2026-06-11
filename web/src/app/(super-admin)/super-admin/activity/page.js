"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, UserPlus, CreditCard, CalendarDays, Star, RefreshCw, Zap } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function timeAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const TYPE_CFG = {
  user_registered:  { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  Icon: UserPlus,    label: "Registrations",   dot: "#6366f1" },
  ticket_purchased: { color: "#10b981", bg: "rgba(16,185,129,0.12)",  Icon: CreditCard,  label: "Ticket Sales",    dot: "#10b981" },
  event_published:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  Icon: CalendarDays,label: "Event Publishes", dot: "#f59e0b" },
  plan_upgraded:    { color: "#c9a96e", bg: "rgba(201,169,110,0.12)", Icon: Star,        label: "Plan Upgrades",   dot: "#c9a96e" },
};

const FILTERS = [
  { key: "all",              label: "All Activity" },
  { key: "ticket_purchased", label: "Ticket Sales" },
  { key: "user_registered",  label: "Registrations" },
  { key: "event_published",  label: "Events" },
  { key: "plan_upgraded",    label: "Upgrades" },
];

function getDesc(item) {
  switch (item.type) {
    case "user_registered":  return { title: item.full_name ?? item.email, sub: `New user registered · ${item.email}` };
    case "ticket_purchased": return { title: `${item.buyer_name} purchased ${item.ticket_type ?? "ticket"}`, sub: item.event_title };
    case "event_published":  return { title: item.title, sub: `Published by ${item.org_name}` };
    case "plan_upgraded":    return { title: item.full_name, sub: `Upgraded to ${item.subscription_plan} plan` };
    default: return { title: "Platform event", sub: "" };
  }
}

/* Skeleton row */
function SkRow() {
  return (
    <div className="flex items-start gap-4 rounded-2xl px-5 py-4 animate-pulse" style={{ background: "#0d0d1a" }}>
      <div className="h-10 w-10 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded" style={{ width: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 rounded" style={{ width: "70%", background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div className="h-3 w-14 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

export default function ActivityPage() {
  const { activity, fetchActivity, loading } = useSuperAdminStore();
  const [filter,    setFilter]    = useState("all");
  const [countdown, setCountdown] = useState(15);
  const [ticking,   setTicking]   = useState(false);

  const refresh = useCallback(() => {
    fetchActivity();
    setCountdown(15);
  }, [fetchActivity]);

  useEffect(() => {
    refresh();
    const refInterval = setInterval(refresh, 15000);
    const tickInterval = setInterval(() => setCountdown(c => (c <= 1 ? 15 : c - 1)), 1000);
    setTicking(true);
    return () => { clearInterval(refInterval); clearInterval(tickInterval); };
  }, [refresh]);

  const filtered = filter === "all" ? (activity ?? []) : (activity ?? []).filter(a => a.type === filter);

  /* Count by type */
  const counts = (activity ?? []).reduce((acc, a) => { acc[a.type] = (acc[a.type] ?? 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Super Admin</p>
          <h1 className="text-[20px] font-black tracking-tight text-white">Live Activity</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Real-time platform events</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <div className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#10b981" }}>LIVE</span>
          </div>
          {/* Refresh countdown */}
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh in {countdown}s
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(TYPE_CFG).map(([type, cfg]) => (
          <div key={type} className="rounded-2xl p-4" style={{ background: "#0d0d1a", border: `1px solid ${cfg.dot}18` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-3" style={{ background: cfg.bg }}>
              <cfg.Icon size={14} style={{ color: cfg.color }} />
            </div>
            <p className="text-[20px] font-black text-white tabular-nums">{counts[type] ?? 0}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-full px-3 py-1.5 text-[12px] font-bold border transition-all"
            style={{
              background:   filter === f.key ? "rgba(201,169,110,0.15)" : "transparent",
              borderColor:  filter === f.key ? "rgba(201,169,110,0.40)" : "rgba(255,255,255,0.12)",
              color:        filter === f.key ? "#c9a96e" : "rgba(255,255,255,0.45)",
            }}
          >
            {f.label}
            {f.key !== "all" && counts[f.key] > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {loading && filtered.length === 0
          ? Array(8).fill(0).map((_, i) => <SkRow key={i} />)
          : filtered.length === 0
          ? (
            <div
              className="flex flex-col items-center gap-4 rounded-2xl py-16"
              style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)" }}
              >
                <Activity size={28} style={{ color: "rgba(201,169,110,0.40)" }} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-black text-white">No activity yet</p>
                <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.30)" }}>
                  {filter === "all"
                    ? "Activity will appear here as users register, buy tickets, and publish events"
                    : `No ${FILTERS.find(f => f.key === filter)?.label?.toLowerCase()} in this time window`}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[11px]" style={{ color: "rgba(16,185,129,0.70)" }}>Feed is live · auto-refreshes every 15s</span>
              </div>
            </div>
          )
          : (
            <AnimatePresence>
              {filtered.map((item, i) => {
                const cfg  = TYPE_CFG[item.type] ?? TYPE_CFG.user_registered;
                const Icon = cfg.Icon;
                const { title, sub } = getDesc(item);
                return (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.3) }}
                    className="flex items-start gap-4 rounded-2xl px-5 py-4 transition-all hover:bg-white/2"
                    style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.dot}25` }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{title}</p>
                      {sub && <p className="text-[12px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
                      {item.amount_paid > 0 && (
                        <span
                          className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                        >
                          ${parseFloat(item.amount_paid).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label.replace(/s$/, "")}
                      </span>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )
        }
      </div>
    </div>
  );
}
