"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AllClear({ text }) {
  return (
    <div className="py-10 flex flex-col items-center gap-2">
      <span style={{ fontSize: 24 }}>✓</span>
      <p style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>{text}</p>
    </div>
  );
}

function SectionCard({ title, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl mb-6"
      style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)", overflow: "hidden" }}
    >
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

export default function ModerationPage() {
  const { moderation, fetchModeration, loading } = useSuperAdminStore();

  useEffect(() => { fetchModeration(); }, []);

  const suspicious = moderation?.suspiciousTickets ?? [];
  const highVelocity = moderation?.highVelocity ?? [];
  const suspended = moderation?.suspended ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Super Admin
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
          Moderation Queue
        </h1>
      </div>

      {/* Suspicious Ticket Activity */}
      <SectionCard title="Suspicious Ticket Activity (24h)" delay={0}>
        {loading && !moderation ? (
          <div className="px-6 py-4 space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                {[160, 120, 60, 80, 70].map((w, j) => (
                  <div key={j} className="h-3 rounded" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
                ))}
              </div>
            ))}
          </div>
        ) : suspicious.length === 0 ? (
          <AllClear text="All Clear — No suspicious activity in the last 24h" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Email", "Name", "Tickets (24h)", "Total Spent", "Last Activity"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suspicious.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#ef4444" }}>{row.buyer_email}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff" }}>{row.buyer_name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{row.ticket_count}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff" }}>{fmtMoney(row.total_spent)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{timeAgo(row.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* High Velocity Events */}
      <SectionCard title="High Velocity Events (last 1h)" delay={0.1}>
        {highVelocity.length === 0 ? (
          <AllClear text="No anomalies detected in the last hour" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Event", "Organization", "Tickets/hr", "Revenue/hr"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highVelocity.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff", fontWeight: 600 }}>{row.title}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{row.org_name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{row.tickets_last_hour}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981" }}>{fmtMoney(row.revenue_last_hour)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Suspended Users */}
      <SectionCard title="Recently Suspended Users (30d)" delay={0.2}>
        {suspended.length === 0 ? (
          <AllClear text="No recently suspended users" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Name", "Email", "Status", "Date", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suspended.map((u, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff", fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                        background: u.status === "SUSPENDED" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                        color: u.status === "SUSPENDED" ? "#ef4444" : "rgba(255,255,255,0.50)",
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{timeAgo(u.updated_at)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <a
                      href={`/super-admin/users?q=${encodeURIComponent(u.email)}`}
                      style={{
                        fontSize: 11, fontWeight: 700, color: "#c9a96e",
                        textDecoration: "none", padding: "4px 10px",
                        border: "1px solid rgba(201,169,110,0.25)", borderRadius: 6,
                      }}
                    >
                      Investigate
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
