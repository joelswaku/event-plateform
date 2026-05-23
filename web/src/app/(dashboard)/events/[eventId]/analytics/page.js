"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Ticket,
  DollarSign,
  Users,
  ScanLine,
  BarChart3,
  RefreshCw,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronLeft, Home, User, CalendarDays, Plus,
} from "lucide-react";
import { api } from "@/lib/api";

function MobileBottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: "Home",    Icon: Home,         active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: CalendarDays, active: pathname.startsWith("/events") && !pathname.includes("create") },
    null,
    { href: "/tickets",   label: "Tickets", Icon: Ticket,       active: pathname === "/tickets" },
    { href: "/settings",  label: "Account", Icon: User,         active: pathname === "/settings" },
  ];
  return (
    <div className="shrink-0 border-t px-1 pt-2"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
      <div className="flex items-end justify-around">
        {tabs.map((tab) => {
          if (!tab) return (
            <Link key="create" href="/events/create" className="-mt-5 flex flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}>
                <Plus size={24} className="text-white" />
              </div>
              <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>Create</span>
            </Link>
          );
          const { href, label, Icon, active } = tab;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
              <Icon size={22} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return "—";
  return `${Number(n).toFixed(1)}%`;
}

function fmtHour(h) {
  if (h == null) return "—";
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:00 ${ampm}`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = "#6366f1", height = 32, width = 80 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map(
    (v, i) =>
      `${pad + (i / (data.length - 1)) * (width - pad * 2)},${
        height - pad - ((v - min) / range) * (height - pad * 2)
      }`
  );
  const path = `M ${pts.join(" L ")}`;
  const area = `${path} L ${width - pad},${height - pad} L ${pad},${height - pad} Z`;
  const gradId = `sg${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={width - pad}
        cy={height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, sparkData, sparkColor, loading }) {
  const iconCls = {
    indigo:  "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    violet:  "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    amber:   "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    rose:    "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    sky:     "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
  };
  const accentBar = {
    indigo:  "bg-indigo-500",
    emerald: "bg-emerald-500",
    violet:  "bg-violet-500",
    amber:   "bg-amber-500",
    rose:    "bg-rose-500",
    sky:     "bg-sky-500",
  };
  const valCls = {
    indigo:  "dark:text-indigo-300",
    emerald: "dark:text-emerald-300",
    violet:  "dark:text-violet-300",
    amber:   "dark:text-amber-300",
    rose:    "dark:text-rose-300",
    sky:     "dark:text-sky-300",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accentBar[color] ?? accentBar.indigo}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl ${iconCls[color] ?? iconCls.indigo}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            {label}
          </p>
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ) : (
            <p className={`text-xl font-bold tracking-tight text-gray-900 sm:text-2xl ${valCls[color] ?? valCls.indigo}`}>{value}</p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
          )}
        </div>
        {sparkData?.length > 1 && !loading && (
          <div className="shrink-0 self-end opacity-80">
            <Sparkline data={sparkData} color={sparkColor ?? "#6366f1"} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ data = [], loading }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />;
  }
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No revenue data yet
      </div>
    );
  }

  const W = 560, H = 160;
  const padL = 48, padR = 16, padT = 12, padB = 28;
  const iW = W - padL - padR;
  const iH = H - padT - padB;

  const revenues = data.map((d) => Number(d.revenue ?? 0));
  const maxR = Math.max(...revenues, 1);
  const xScale = (i) => padL + (i / Math.max(data.length - 1, 1)) * iW;
  const yScale = (v) => padT + iH - (v / maxR) * iH;

  const linePts = data.map((d, i) => `${xScale(i)},${yScale(Number(d.revenue ?? 0))}`).join(" L ");
  const linePath = `M ${linePts}`;
  const areaPath = `${linePath} L ${xScale(data.length - 1)},${padT + iH} L ${xScale(0)},${padT + iH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + iH * (1 - t),
    label: fmtMoney(maxR * t),
  }));

  const xStep = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data
    .map((d, i) => ({
      i,
      label: new Date(d.bucket).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }))
    .filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const relX = ((e.clientX - rect.left) / rect.width) * W - padL;
          const idx = Math.max(0, Math.min(data.length - 1, Math.round((relX / iW) * (data.length - 1))));
          setTooltip({ idx, x: xScale(idx), y: yScale(Number(data[idx]?.revenue ?? 0)) });
        }}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t.y}>
            <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            <text x={padL - 6} y={t.y + 4} textAnchor="end" fontSize="9" className="fill-gray-400 dark:fill-gray-500">{t.label}</text>
          </g>
        ))}
        {xTicks.map(({ i, label }) => (
          <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">{label}</text>
        ))}
        <path d={areaPath} fill="url(#revGrad)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {tooltip && (
          <g>
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + iH} stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
          </g>
        )}
      </svg>
      {tooltip && data[tooltip.idx] && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <p className="font-semibold text-gray-900 dark:text-white">{fmtMoney(data[tooltip.idx]?.revenue)}</p>
          <p className="text-gray-400">{data[tooltip.idx]?.orders} orders</p>
          <p className="text-gray-400 text-[10px]">
            {new Date(data[tooltip.idx]?.bucket).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Ticket Types Table ───────────────────────────────────────────────────────

function TicketTypesTable({ data = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }
  if (!data.length) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">No ticket types found.</p>;
  }

  const maxRev = Math.max(...data.map((d) => d.paid_revenue ?? 0), 1);

  const COLORS = ["#6366f1","#7c3aed","#10b981","#f59e0b","#06b6d4"];
  return (
    <div className="space-y-2">
      {data.map((tt, idx) => {
        const fillPct = tt.quantity_total > 0 ? Math.min((tt.paid_quantity / tt.quantity_total) * 100, 100) : 0;
        const accent  = COLORS[idx % COLORS.length];
        return (
          <div key={tt.ticket_type_id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{tt.ticket_type_name}</p>
                <p className="text-[11px] text-gray-400 capitalize mt-0.5">
                  {tt.kind?.toLowerCase()} · {tt.price === 0 ? <span className="text-emerald-500 font-semibold">Free</span> : fmtMoney(tt.price)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtMoney(tt.paid_revenue)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {fmt(tt.paid_quantity)}{tt.quantity_total > 0 && <span> / {fmt(tt.quantity_total)}</span>} sold
                </p>
              </div>
            </div>
            {tt.quantity_total > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, backgroundColor: accent }} />
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">{fmtPct(fillPct)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Conversion Funnel ────────────────────────────────────────────────────────

function ConversionFunnel({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const steps = [
    { label: "Invited",           value: data.invited,   color: "bg-indigo-50/80 dark:bg-indigo-950/50",  bar: "bg-indigo-500",  txt: "text-indigo-500"  },
    { label: "Attending (RSVP)",  value: data.attending, color: "bg-violet-50/80 dark:bg-violet-950/50",  bar: "bg-violet-500",  txt: "text-violet-500"  },
    { label: "Purchased Tickets", value: data.buyers,    color: "bg-emerald-50/80 dark:bg-emerald-950/50", bar: "bg-emerald-500", txt: "text-emerald-500" },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className={`rounded-xl p-3 ${s.color}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.label}</p>
            <p className={`text-sm font-bold ${s.txt}`}>{fmt(s.value)}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
            <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
          {i > 0 && steps[i - 1].value > 0 && (
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              {fmtPct((s.value / steps[i - 1].value) * 100)} of previous step
            </p>
          )}
        </div>
      ))}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Overall Conversion</p>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{fmtPct(data.conversion_rate)}</p>
        <p className="text-[11px] text-indigo-400">invited → ticket buyers</p>
      </div>
    </div>
  );
}

// ─── Check-in Stats ───────────────────────────────────────────────────────────

function CheckinStats({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }
  if (!data?.summary) return null;

  const { success, already_used, invalid, revoked } = data.summary;
  const total = success + already_used + invalid + revoked;

  const items = [
    { label: "Successful", value: success,      icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", pct: total > 0 ? (success / total) * 100 : 0 },
    { label: "Duplicate",  value: already_used, icon: Copy,         color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/40",   pct: total > 0 ? (already_used / total) * 100 : 0 },
    { label: "Invalid",    value: invalid,      icon: XCircle,      color: "text-rose-500",   bg: "bg-rose-50 dark:bg-rose-950/40",     pct: total > 0 ? (invalid / total) * 100 : 0 },
    { label: "Revoked",    value: revoked,      icon: AlertCircle,  color: "text-gray-400",   bg: "bg-gray-50 dark:bg-gray-800",        pct: total > 0 ? (revoked / total) * 100 : 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl p-3 ${item.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{fmt(item.value)}</p>
              <p className="text-[10px] text-gray-400">{fmtPct(item.pct)} of scans</p>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Scan breakdown</p>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {items.map((item) => (
              <div
                key={item.label}
                className="h-full transition-all duration-700"
                style={{
                  width: `${item.pct}%`,
                  background:
                    item.label === "Successful" ? "#10b981"
                    : item.label === "Duplicate" ? "#f59e0b"
                    : item.label === "Invalid"   ? "#f43f5e"
                    : "#9ca3af",
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">{fmt(total)} total scans</p>
        </div>
      )}
      {data.by_hour?.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Check-ins over time</p>
          <Sparkline data={data.by_hour.map((h) => h.successful_scans)} color="#10b981" width={240} height={40} />
        </div>
      )}
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────

function InsightsPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-3">
      {data.top_ticket ? (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <Ticket className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-0.5">Top Selling Ticket</p>
            <p className="font-semibold text-gray-900 dark:text-white">{data.top_ticket.name}</p>
            <p className="text-xs text-indigo-400">{fmt(data.top_ticket.sold)} units sold</p>
          </div>
        </div>
      ) : null}

      {data.peak_hour ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-0.5">Peak Sales Hour</p>
            <p className="font-semibold text-gray-900 dark:text-white">{fmtHour(data.peak_hour.hour)}</p>
            <p className="text-xs text-amber-400">{fmt(data.peak_hour.orders)} orders in that hour</p>
          </div>
        </div>
      ) : null}

      {!data.top_ticket && !data.peak_hour && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 p-4 dark:border-gray-700">
          <Zap className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Insights appear once sales begin.</p>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children, action }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Interval tabs ────────────────────────────────────────────────────────────

function IntervalTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
      {["hour", "day", "month"].map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            value === o
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          }`}
        >
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── Mobile dark variants ────────────────────────────────────────────────────

function MKpiCard({ icon: Icon, label, value, sub, accent, loading }) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-[18px] border p-3.5"
      style={{ borderColor: `${accent}30`, background: `${accent}08` }}
    >
      <div
        className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-[9px]"
        style={{ background: `${accent}20` }}
      >
        <Icon size={13} style={{ color: accent }} />
      </div>
      {loading
        ? <div className="h-6 w-14 animate-pulse rounded-lg" style={{ background: "#14141f" }} />
        : <p className="text-[22px] font-black leading-none tracking-tight" style={{ color: accent }}>{value}</p>
      }
      <p className="text-[10px] font-bold uppercase tracking-[0.4px]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      {sub && !loading && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</p>}
    </div>
  );
}

function MSection({ title, subtitle, children, action }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[20px] border p-4"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-extrabold text-white">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MIntervalTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background: "#14141f" }}>
      {["hour", "day", "month"].map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
          style={{
            background: value === o ? "#1e1e2e" : "transparent",
            color:      value === o ? "#fff" : "rgba(255,255,255,0.35)",
          }}
        >
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { eventId } = useParams();

  const [interval, setInterval] = useState("day");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboard,   setDashboard]   = useState(null);
  const [ticketSales, setTicketSales] = useState(null);
  const [checkins,    setCheckins]    = useState(null);
  const [revenue,     setRevenue]     = useState(null);
  const [conversion,  setConversion]  = useState(null);
  const [insights,    setInsights]    = useState(null);

  const [loading, setLoading] = useState({
    dashboard: true, ticketSales: true, checkins: true,
    revenue: true, conversion: true, insights: true,
  });
  const [error, setError] = useState(null);

  // ── All 6 API paths use /dashboard/events/... prefix ──────────────────────
  const fetchAll = useCallback(async () => {
    if (!eventId) return;
    setError(null);
    setLoading({ dashboard: true, ticketSales: true, checkins: true, revenue: true, conversion: true, insights: true });

    const safe = async (key, fn) => {
      try {
        const data = await fn();
        switch (key) {
          case "dashboard":   setDashboard(data);   break;
          case "ticketSales": setTicketSales(data);  break;
          case "checkins":    setCheckins(data);     break;
          case "revenue":     setRevenue(data);      break;
          case "conversion":  setConversion(data);   break;
          case "insights":    setInsights(data);     break;
        }
      } catch (err) {
        console.error(`[analytics] ${key}:`, err?.response?.status, err?.response?.data?.message ?? err.message);
        if (key === "dashboard") setError("Failed to load analytics.");
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    };

    await Promise.all([
      safe("dashboard",   () => api.get(`/dashboard/events/${eventId}/analytics/dashboard`).then((r) => r.data?.data)),
      safe("ticketSales", () => api.get(`/dashboard/events/${eventId}/analytics/ticket-sales`).then((r) => r.data?.data)),
      safe("checkins",    () => api.get(`/dashboard/events/${eventId}/analytics/ticket-checkins`).then((r) => r.data?.data)),
      safe("revenue",     () => api.get(`/dashboard/events/${eventId}/analytics/revenue`, { params: { interval } }).then((r) => r.data?.data)),
      safe("conversion",  () => api.get(`/dashboard/events/${eventId}/analytics/conversion`).then((r) => r.data?.data)),
      safe("insights",    () => api.get(`/dashboard/events/${eventId}/analytics/insights`).then((r) => r.data?.data)),
    ]);
  }, [eventId, interval]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const kpiRevenue     = ticketSales?.by_ticket_type?.reduce((s, t) => s + (t.paid_revenue  ?? 0), 0) ?? 0;
  const kpiTicketsSold = ticketSales?.by_ticket_type?.reduce((s, t) => s + (t.paid_quantity ?? 0), 0) ?? 0;
  const kpiCheckins    = checkins?.summary?.success ?? 0;
  const kpiConvRate    = conversion?.conversion_rate ?? 0;
  const kpiInvited     = conversion?.invited ?? 0;
  const kpiBuyers      = conversion?.buyers ?? 0;

  const revSparkData = (revenue ?? []).map((d) => Number(d.revenue ?? 0)).slice(-12);
  const tixSparkData = (ticketSales?.timeline ?? []).map((t) => Number(t.paid_revenue ?? 0)).slice(-12);

  if (error && !loading.dashboard) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
          <AlertCircle className="h-6 w-6 text-rose-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE OVERLAY ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{ background: "#07070f" }}>

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "rgba(255,255,255,0.08)", paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}>
          <Link href={`/events/${eventId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "#14141f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-black text-white leading-tight">Analytics</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Event performance overview</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "#14141f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 pb-8">
            {error && (
              <div className="rounded-[14px] border px-4 py-3 text-[13px]"
                style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                {error}
              </div>
            )}

            {/* KPI grid */}
            <MSection title="Overview" subtitle="Key performance indicators">
              <div className="grid grid-cols-2 gap-2.5">
                <MKpiCard icon={DollarSign} label="Revenue"      value={fmtMoney(kpiRevenue)}   sub={`${fmt(kpiBuyers)} buyers`}  accent="#6366f1" loading={loading.ticketSales} />
                <MKpiCard icon={Ticket}     label="Tickets Sold" value={fmt(kpiTicketsSold)}     sub="paid tickets"                accent="#a78bfa" loading={loading.ticketSales} />
                <MKpiCard icon={ScanLine}   label="Check-ins"    value={fmt(kpiCheckins)}        sub="successful"                  accent="#10b981" loading={loading.checkins}    />
                <MKpiCard icon={Users}      label="Invited"      value={fmt(kpiInvited)}         sub="total guests"                accent="#06b6d4" loading={loading.conversion}  />
                <MKpiCard icon={TrendingUp} label="Conversion"   value={fmtPct(kpiConvRate)}     sub="invited → buyer"             accent="#f59e0b" loading={loading.conversion}  />
                <MKpiCard icon={BarChart3}  label="Total Scans"
                  value={fmt((checkins?.summary?.success ?? 0) + (checkins?.summary?.already_used ?? 0) + (checkins?.summary?.invalid ?? 0))}
                  sub="all scan attempts" accent="#ef4444" loading={loading.checkins}
                />
              </div>
            </MSection>

            {/* Revenue timeline */}
            <MSection
              title="Revenue Timeline"
              subtitle="Paid orders grouped by period"
              action={
                <MIntervalTabs
                  value={interval}
                  onChange={(v) => { setInterval(v); setRefreshKey((k) => k + 1); }}
                />
              }
            >
              <RevenueChart data={revenue ?? []} loading={loading.revenue} />
            </MSection>

            {/* Ticket types */}
            <MSection title="Ticket Types" subtitle="Sold, revenue and capacity">
              <TicketTypesTable data={ticketSales?.by_ticket_type ?? []} loading={loading.ticketSales} />
            </MSection>

            {/* Conversion funnel */}
            <MSection title="Conversion Funnel" subtitle="Invited → RSVP → Buyer">
              <ConversionFunnel data={conversion} loading={loading.conversion} />
            </MSection>

            {/* Check-in analytics */}
            <MSection title="Check-in Analytics" subtitle="Scanner activity and outcomes">
              <CheckinStats data={checkins} loading={loading.checkins} />
            </MSection>

            {/* Key insights */}
            <MSection title="Key Insights" subtitle="Auto-detected from your event data">
              <InsightsPanel data={insights} loading={loading.insights} />
            </MSection>
          </div>
        </div>

        <MobileBottomNav />
      </div>

      {/* ── DESKTOP UI ── */}
      <div className="hidden sm:block space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Analytics</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 sm:text-sm">Event performance overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={DollarSign} label="Revenue"      value={fmtMoney(kpiRevenue)}     sub={`${fmt(kpiBuyers)} buyers`}        color="indigo"  sparkData={revSparkData} sparkColor="#6366f1" loading={loading.ticketSales} />
        <KpiCard icon={Ticket}     label="Tickets Sold" value={fmt(kpiTicketsSold)}       sub="paid tickets"                      color="violet"  sparkData={tixSparkData} sparkColor="#7c3aed" loading={loading.ticketSales} />
        <KpiCard icon={ScanLine}   label="Check-ins"    value={fmt(kpiCheckins)}          sub="successful scans"                  color="emerald" loading={loading.checkins} />
        <KpiCard icon={Users}      label="Invited"      value={fmt(kpiInvited)}           sub="total guests"                      color="sky"     loading={loading.conversion} />
        <KpiCard icon={TrendingUp} label="Conversion"   value={fmtPct(kpiConvRate)}       sub="invited → buyer"                   color="amber"   loading={loading.conversion} />
        <KpiCard
          icon={BarChart3}
          label="Total Scans"
          value={fmt((checkins?.summary?.success ?? 0) + (checkins?.summary?.already_used ?? 0) + (checkins?.summary?.invalid ?? 0))}
          sub="all scan attempts"
          color="rose"
          loading={loading.checkins}
        />
      </div>

      {/* Revenue Chart */}
      <Section
        title="Revenue Timeline"
        subtitle="Paid orders grouped by period"
        action={
          <IntervalTabs
            value={interval}
            onChange={(v) => { setInterval(v); setRefreshKey((k) => k + 1); }}
          />
        }
      >
        <RevenueChart data={revenue ?? []} loading={loading.revenue} />
      </Section>

      {/* Middle row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Section title="Ticket Types" subtitle="Breakdown by type — sold, revenue, capacity">
            <TicketTypesTable data={ticketSales?.by_ticket_type ?? []} loading={loading.ticketSales} />
          </Section>
        </div>
        <Section title="Conversion Funnel" subtitle="Invited → RSVP → Buyer">
          <ConversionFunnel data={conversion} loading={loading.conversion} />
        </Section>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Check-in Analytics" subtitle="Scanner activity and scan outcomes">
          <CheckinStats data={checkins} loading={loading.checkins} />
        </Section>
        <Section title="Key Insights" subtitle="Auto-detected from your event data">
          <InsightsPanel data={insights} loading={loading.insights} />
        </Section>
      </div>

      </div>
    </>
  );
}
