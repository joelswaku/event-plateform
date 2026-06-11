"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Ticket, Building2, TrendingUp, BarChart3 } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

function MonthlyChart({ monthly }) {
  if (!monthly?.length) return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.14)" }}>
        <BarChart3 size={20} style={{ color: "rgba(201,169,110,0.40)" }} />
      </div>
      <p className="text-[13px] font-bold text-white">No revenue data yet</p>
      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>Revenue will appear as tickets are sold</p>
    </div>
  );
  const max = Math.max(...monthly.map(m => parseFloat(m.revenue)));
  return (
    <div className="flex flex-col gap-3">
      {monthly.map((m, i) => {
        const pct = max > 0 ? (parseFloat(m.revenue) / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] w-14 shrink-0 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{m.month}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#c9a96e,#f59e0b)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.04, duration: 0.6 }}
              />
            </div>
            <div className="flex items-center gap-3 w-36 shrink-0">
              <span className="text-[12px] font-black tabular-nums" style={{ color: "#c9a96e" }}>{fmtMoney(m.revenue)}</span>
              <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.30)" }}>{fmt(m.tickets)} tickets</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SuperAdminRevenuePage() {
  const { revenue, stats, fetchRevenue, fetchStats, loading } = useSuperAdminStore();

  useEffect(() => {
    fetchRevenue();
    fetchStats();
  }, [fetchRevenue, fetchStats]);

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalTickets = stats?.totalTickets ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Super Admin</p>
        <h1 className="text-[20px] font-black tracking-tight text-white">Revenue Overview</h1>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading && !stats ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-9 w-9 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-6 w-28 rounded mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 w-36 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))
        ) : (
          [
            { label: "Total Platform Revenue", value: fmtMoney(totalRevenue), Icon: DollarSign, accent: "#c9a96e" },
            { label: "Total Tickets Sold",      value: fmt(totalTickets),      Icon: Ticket,    accent: "#10b981" },
            { label: "Avg per Ticket",          value: totalTickets > 0 ? fmtMoney(totalRevenue / totalTickets) : "—", Icon: TrendingUp, accent: "#6366f1" },
          ].map(({ label, value, Icon, accent }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "#0d0d1a", border: `1px solid ${accent}22` }}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl"
                style={{ background: `${accent}20` }} />
              <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-4"
                style={{ background: `${accent}18` }}>
                <Icon size={16} style={{ color: accent }} />
              </div>
              <p className="text-[22px] font-black text-white">{value}</p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl p-6 space-y-6" style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}>
        <h2 className="text-[15px] font-black text-white">Monthly Revenue (Last 12 Months)</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9a96e] border-t-transparent" />
          </div>
        ) : <MonthlyChart monthly={revenue?.monthly} />}
      </div>

      {/* Top events + top orgs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}>
          <h2 className="text-[14px] font-black text-white">Top Events by Revenue</h2>
          <div className="space-y-2">
            {(revenue?.topEvents ?? []).map((ev, i) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: i % 2 === 0 ? "#111127" : "transparent" }}>
                <span className="text-[11px] font-black w-4 tabular-nums" style={{ color: "rgba(201,169,110,0.50)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{ev.title}</p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.30)" }}>
                    {ev.org_name} · {fmt(ev.ticket_count)} tickets
                  </p>
                </div>
                <span className="text-[13px] font-black tabular-nums" style={{ color: "#c9a96e" }}>
                  {fmtMoney(ev.revenue)}
                </span>
              </div>
            ))}
            {!revenue?.topEvents?.length && (
              <div className="flex flex-col items-center gap-2 py-8">
                <DollarSign size={20} style={{ color: "rgba(255,255,255,0.12)" }} />
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>No ticket sales yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}>
          <h2 className="text-[14px] font-black text-white">Top Organizations by Revenue</h2>
          <div className="space-y-2">
            {(revenue?.topOrgs ?? []).map((org, i) => (
              <div key={org.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: i % 2 === 0 ? "#111127" : "transparent" }}>
                <span className="text-[11px] font-black w-4 tabular-nums" style={{ color: "rgba(201,169,110,0.50)" }}>{i + 1}</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(201,169,110,0.12)" }}>
                  <Building2 size={12} style={{ color: "#c9a96e" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{org.name}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                    {fmt(org.event_count)} events · {fmt(org.ticket_count)} tickets
                  </p>
                </div>
                <span className="text-[13px] font-black tabular-nums" style={{ color: "#c9a96e" }}>
                  {fmtMoney(org.revenue)}
                </span>
              </div>
            ))}
            {!revenue?.topOrgs?.length && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Building2 size={20} style={{ color: "rgba(255,255,255,0.12)" }} />
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>No organization revenue yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
