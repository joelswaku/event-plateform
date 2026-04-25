"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { api } from "@/lib/api";

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
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${colors[color] ?? colors.indigo}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
          )}
        </div>
        {sparkData?.length > 1 && !loading && (
          <div className="shrink-0 self-end">
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {["Type", "Price", "Sold", "Revenue", "Fill"].map((h) => (
              <th key={h} className={`pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${h === "Type" ? "text-left" : "text-right"} ${h === "Fill" ? "pl-4 text-left" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
          {data.map((tt) => {
            const fillPct = tt.quantity_total > 0 ? (tt.paid_quantity / tt.quantity_total) * 100 : 0;
            return (
              <tr key={tt.ticket_type_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="py-3 pr-4">
                  <p className="font-medium text-gray-900 dark:text-white">{tt.ticket_type_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{tt.kind?.toLowerCase()}</p>
                </td>
                <td className="py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                  {tt.price === 0 ? <span className="text-emerald-500 font-semibold text-xs">FREE</span> : fmtMoney(tt.price)}
                </td>
                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                  {fmt(tt.paid_quantity)}
                  {tt.quantity_total > 0 && <span className="text-gray-400"> / {fmt(tt.quantity_total)}</span>}
                </td>
                <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{fmtMoney(tt.paid_revenue)}</td>
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${Math.min(fillPct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{fmtPct(fillPct)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
    { label: "Invited",           value: data.invited,   color: "bg-indigo-50 dark:bg-indigo-900/40",  bar: "bg-indigo-500"  },
    { label: "Attending (RSVP)",  value: data.attending, color: "bg-violet-50 dark:bg-violet-900/40",  bar: "bg-violet-500"  },
    { label: "Purchased Tickets", value: data.buyers,    color: "bg-emerald-50 dark:bg-emerald-900/40", bar: "bg-emerald-500" },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className={`rounded-xl p-3 ${s.color}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(s.value)}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-black/20">
            <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
          {i > 0 && steps[i - 1].value > 0 && (
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              {fmtPct((s.value / steps[i - 1].value) * 100)} of previous step
            </p>
          )}
        </div>
      ))}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">Overall Conversion</p>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{fmtPct(data.conversion_rate)}</p>
        <p className="text-xs text-indigo-400">invited → ticket buyers</p>
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
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl p-3 ${item.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${item.color}`} />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(item.value)}</p>
              <p className="text-[11px] text-gray-400">{fmtPct(item.pct)} of scans</p>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">Event performance overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Ticket Types" subtitle="Breakdown by type — sold, revenue, capacity">
            <TicketTypesTable data={ticketSales?.by_ticket_type ?? []} loading={loading.ticketSales} />
          </Section>
        </div>
        <Section title="Conversion Funnel" subtitle="Invited → RSVP → Buyer">
          <ConversionFunnel data={conversion} loading={loading.conversion} />
        </Section>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Check-in Analytics" subtitle="Scanner activity and scan outcomes">
          <CheckinStats data={checkins} loading={loading.checkins} />
        </Section>
        <Section title="Key Insights" subtitle="Auto-detected from your event data">
          <InsightsPanel data={insights} loading={loading.insights} />
        </Section>
      </div>

    </div>
  );
}
