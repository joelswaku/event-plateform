"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

export const dynamic = 'force-dynamic';

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LineChart({ data }) {
  if (!data?.length) return (
    <div className="flex flex-col items-center gap-2 py-8">
      <TrendingUp size={22} style={{ color: "rgba(201,169,110,0.25)" }} />
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Revenue data will appear as transactions occur</p>
    </div>
  );
  const values = data.map(d => parseFloat(d.revenue));
  const max = Math.max(...values, 1);
  const W = 600, H = 100;
  const xs = data.map((_, i) => (i / Math.max(data.length - 1, 1)) * W);
  const ys = values.map(v => H - (v / max) * (H - 4));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const fillPath = `M 0 ${H} ${xs.map((x, i) => `L ${x} ${ys[i]}`).join(" ")} L ${W} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 4}`} style={{ width: "100%", height: 130 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#lg1)" />
      <path d={linePath} fill="none" stroke="#c9a96e" strokeWidth="2" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill="#c9a96e" opacity="0.8" />)}
    </svg>
  );
}

function KPICard({ label, value, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-6"
      style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
    >
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginTop: 6, letterSpacing: "-0.03em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</p>}
    </motion.div>
  );
}

export default function FinancialPage() {
  const { financial, fetchFinancial, loading } = useSuperAdminStore();

  useEffect(() => { fetchFinancial(); }, []);

  const f = financial;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Super Admin
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
          Financial Overview
        </h1>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {loading && !f ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-3 w-24 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-7 w-20 rounded" style={{ background: "rgba(255,255,255,0.09)" }} />
            </div>
          ))
        ) : (
          <>
            <KPICard label="Gross Merchandise Value" value={fmtMoney(f?.gmv)} delay={0} />
            <KPICard label="Net Revenue" value={fmtMoney(f?.netRevenue)} delay={0.05} />
            <KPICard label="Estimated Fees" value={fmtMoney(f?.estimatedFees)} sub="~2.9% + $0.30/txn" delay={0.1} />
            <KPICard label="Total Transactions" value={(f?.totalTransactions ?? 0).toLocaleString()} delay={0.15} />
          </>
        )}
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {loading && !f ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-3 w-24 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-7 w-20 rounded" style={{ background: "rgba(255,255,255,0.09)" }} />
            </div>
          ))
        ) : (
          <>
            <KPICard label="Last 24h Revenue" value={fmtMoney(f?.last24h?.revenue)} sub={`${f?.last24h?.tickets ?? 0} tickets`} delay={0.2} />
            <KPICard label="Last 7d Revenue" value={fmtMoney(f?.last7d?.revenue)} sub={`${f?.last7d?.tickets ?? 0} tickets`} delay={0.25} />
            <KPICard label="Avg Transaction" value={fmtMoney(f?.avgTransaction)} delay={0.3} />
          </>
        )}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl p-6 mb-6"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Daily Revenue (Last 30 Days)</p>
        <LineChart data={f?.daily30} />
        {f?.daily30?.length > 0 && (
          <div className="flex justify-between mt-2">
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{f.daily30[0]?.day}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{f.daily30[f.daily30.length - 1]?.day}</span>
          </div>
        )}
      </motion.div>

      {/* Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.40 }}
        className="rounded-2xl p-6 mb-6"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Revenue Breakdown</p>
        {(() => {
          const gmv  = parseFloat(String(f?.gmv  ?? 0));
          const net  = parseFloat(String(f?.netRevenue ?? 0));
          const fees = parseFloat(String(f?.estimatedFees ?? 0));
          if (!gmv) return (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "16px 0" }}>
              No transactions yet
            </p>
          );
          const rows = [
            { label: "Gross Revenue (GMV)",   value: fmtMoney(gmv),  pct: 100,                              color: "#c9a96e" },
            { label: "Net Revenue",            value: fmtMoney(net),  pct: Math.round((net  / gmv) * 100),  color: "#10b981" },
            { label: "Est. Processing Fees",   value: fmtMoney(fees), pct: Math.round((fees / gmv) * 100),  color: "#ef4444" },
          ];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rows.map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
                    </div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", borderRadius: 99, background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.44, duration: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </motion.div>

      {/* Top Buyers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)", overflow: "hidden" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Top Buyers</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#", "Name", "Email", "Tickets", "Total Spent"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(f?.topBuyers ?? []).map((b, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#c9a96e", fontWeight: 900 }}>#{i + 1}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff", fontWeight: 600 }}>{b.buyer_name}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{b.buyer_email}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff" }}>{b.tickets}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 700 }}>{fmtMoney(b.total_spent)}</td>
              </tr>
            ))}
            {loading && !f ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {[30, 120, 160, 50, 70].map((w, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div className="h-3 rounded animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (!f?.topBuyers?.length) && (
              <tr>
                <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center" }}>
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp size={20} style={{ color: "rgba(255,255,255,0.12)" }} />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No buyers yet — transactions will appear here</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
