"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSuperAdminStore } from "@/store/superAdmin.store";
import {
  Shield, ChevronDown, ChevronRight, Download, FileText,
  Filter, X, Search, RefreshCw, Printer,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
function actionColor(action) {
  if (!action) return "rgba(255,255,255,0.50)";
  const a = action.toUpperCase();
  if (a === "TERMS_ACCEPTED")              return "#22d3ee";
  if (a.includes("DONATION"))              return "#f43f5e";
  if (a.includes("TICKET"))               return "#a78bfa";
  if (a.includes("DELETE"))               return "#ef4444";
  if (a.includes("CREATE"))               return "#10b981";
  if (a.includes("ENABLED") || a.includes("DISABLED")) return "#f59e0b";
  return "rgba(255,255,255,0.60)";
}
function actionBg(action) {
  const c = actionColor(action);
  if (c.startsWith("rgba")) return "rgba(255,255,255,0.06)";
  return `${c}15`;
}
function isLegalOrTx(action) {
  const a = (action ?? "").toUpperCase();
  return a === "TERMS_ACCEPTED" || a.includes("DONATION") || a.includes("TICKET");
}

const ACTION_GROUPS = [
  { label: "All",          value: ""               },
  { label: "Transactions", value: "TICKET|DONATION" },
  { label: "Legal",        value: "TERMS_ACCEPTED" },
  { label: "Tickets",      value: "TICKET"         },
  { label: "Donations",    value: "DONATION"       },
  { label: "Admin",        value: "CREATE|DELETE|UPDATE|ENABLED|DISABLED" },
];

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, setFilters, onSearch, onReset }) {
  return (
    <div className="rounded-2xl p-4 space-y-3 mb-4"
      style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Quick action tabs */}
      <div className="flex flex-wrap gap-2">
        {ACTION_GROUPS.map(g => (
          <button key={g.value} onClick={() => setFilters(f => ({ ...f, action: g.value, page: 1 }))}
            className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={filters.action === g.value
              ? { background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.35)", color: "#c9a96e" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: "user_email",      placeholder: "User email…",       icon: "📧" },
          { key: "organization_id", placeholder: "Org ID…",           icon: "🏢" },
          { key: "from",            placeholder: "From date…",         icon: "📅", type: "date" },
          { key: "to",              placeholder: "To date…",           icon: "📅", type: "date" },
        ].map(({ key, placeholder, icon, type }) => (
          <div key={key} className="relative">
            <input
              type={type || "text"}
              placeholder={placeholder}
              value={filters[key] || ""}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value, page: 1 }))}
              className="w-full rounded-xl px-3 py-2 text-xs outline-none transition"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", colorScheme: "dark" }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onSearch}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition"
          style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.25)", color: "#c9a96e" }}>
          <Search size={12} /> Apply Filters
        </button>
        <button onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold transition"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          <X size={11} /> Reset
        </button>
      </div>
    </div>
  );
}

// ── Export bar ────────────────────────────────────────────────────────────────
function ExportBar({ filters }) {
  const buildUrl = (fmt) => {
    const params = new URLSearchParams({ format: fmt, limit: "10000" });
    if (filters.action)          params.set("action",          filters.action);
    if (filters.user_email)      params.set("user_email",      filters.user_email);
    if (filters.organization_id) params.set("organization_id", filters.organization_id);
    if (filters.from)            params.set("from",            filters.from);
    if (filters.to)              params.set("to",              filters.to);
    return `${API_BASE}/super-admin/audit-logs?${params}`;
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Export:</span>
      <a href={buildUrl("csv")} download
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition"
        style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", color: "#10b981" }}>
        <Download size={11} /> CSV
      </a>
      <a href={buildUrl("json")} download
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition"
        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)", color: "#818cf8" }}>
        <FileText size={11} /> JSON
      </a>
      <button onClick={handlePrint}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition"
        style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)", color: "#f59e0b" }}>
        <Printer size={11} /> Print / PDF
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { auditLogs, auditMeta, fetchAuditLogs, loading } = useSuperAdminStore();
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters]   = useState({ action: "", user_email: "", organization_id: "", from: "", to: "", page: 1 });

  const doFetch = useCallback(() => {
    fetchAuditLogs({
      page:            filters.page,
      limit:           50,
      action:          filters.action   || undefined,
      user_email:      filters.user_email || undefined,
      organization_id: filters.organization_id || undefined,
      from:            filters.from || undefined,
      to:              filters.to   || undefined,
    });
  }, [filters.page, filters.action, filters.user_email, filters.organization_id, filters.from, filters.to]);

  useEffect(() => { doFetch(); }, [doFetch]);

  const totalPages = auditMeta ? Math.ceil(auditMeta.total / 50) : 1;

  return (
    <div>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          table { font-size: 10px; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 no-print">
        <div>
          <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Super Admin
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Audit Log
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginTop: 2 }}>
            All transactions, legal acceptances, and admin actions — immutable record.
          </p>
        </div>
        <button onClick={doFetch}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="no-print">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onSearch={doFetch}
          onReset={() => setFilters({ action: "", user_email: "", organization_id: "", from: "", to: "", page: 1 })}
        />
      </div>

      {/* Export */}
      <ExportBar filters={filters} />

      {/* Stats strip */}
      {auditMeta && (
        <div className="flex flex-wrap gap-3 mb-4 no-print">
          {[
            ["Total entries", auditMeta.total.toLocaleString()],
            ["Page", `${filters.page} of ${totalPages}`],
            ["Showing", `${auditLogs.length} rows`],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl" style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["", "Date & Time", "User", "Action", "Event / Org", "Amount", "IP", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !auditLogs.length ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {[20, 110, 140, 110, 100, 60, 80, 20].map((w, j) => (
                    <td key={j} style={{ padding: "14px 12px" }}>
                      <div className="h-3 rounded animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.06)" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 28 }}>📋</div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>No audit logs match your filters</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)" }}>Try adjusting your search criteria</p>
                  </div>
                </td>
              </tr>
            ) : auditLogs.map((log) => (
              <>
                <tr key={log.id}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  style={{
                    borderBottom: expanded === log.id ? "none" : "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background: expanded === log.id ? "rgba(255,255,255,0.03)" : isLegalOrTx(log.action) ? "rgba(255,255,255,0.01)" : "transparent",
                    transition: "background 0.15s",
                  }}>
                  {/* expand */}
                  <td style={{ padding: "12px 6px 12px 14px", width: 20 }}>
                    {expanded === log.id
                      ? <ChevronDown size={12} color="rgba(255,255,255,0.35)" />
                      : <ChevronRight size={12} color="rgba(255,255,255,0.18)" />}
                  </td>
                  {/* date */}
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{fmtDate(log.created_at)}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>{timeAgo(log.created_at)}</div>
                  </td>
                  {/* user */}
                  <td style={{ padding: "10px 12px", maxWidth: 170, overflow: "hidden" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.user_email ?? log.admin_email}
                    </div>
                    {(log.user_name ?? log.admin_name) && (
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
                        {log.user_name ?? log.admin_name}
                      </div>
                    )}
                  </td>
                  {/* action */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.04em",
                      color: actionColor(log.action),
                      background: actionBg(log.action),
                      border: `1px solid ${actionColor(log.action)}25`,
                      borderRadius: 6, padding: "3px 8px",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {log.action === "TERMS_ACCEPTED" && <Shield size={9} />}
                      {log.action}
                    </span>
                  </td>
                  {/* event / org */}
                  <td style={{ padding: "10px 12px", maxWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.details?.event_title ?? log.details?.event_id ?? log.resource_type ?? "—"}
                    </div>
                    {log.details?.organization_id && (
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginTop: 1 }}>
                        {String(log.details.organization_id).slice(0, 8)}…
                      </div>
                    )}
                  </td>
                  {/* amount */}
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {(log.details?.total || log.details?.amount) ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#10b981" }}>
                        ${Number(log.details.total ?? log.details.amount).toFixed(2)}
                      </span>
                    ) : <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>—</span>}
                    {log.details?.currency && (
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.20)", marginLeft: 3 }}>{log.details.currency}</span>
                    )}
                  </td>
                  {/* ip */}
                  <td style={{ padding: "10px 12px", fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {log.ip_address ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", width: 16 }} />
                </tr>

                {/* Expanded row */}
                <AnimatePresence>
                  {expanded === log.id && (
                    <tr key={`exp-${log.id}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden", background: "rgba(255,255,255,0.015)" }}>
                          <div style={{ padding: "16px 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                            {[
                              ["Log ID",          log.id],
                              ["Date & Time",      fmtDate(log.created_at)],
                              ["User ID",          log.user_id],
                              ["User Email",       log.user_email ?? log.admin_email],
                              ["User Name",        log.user_name  ?? log.admin_name],
                              ["Action",           log.action],
                              ["Resource Type",    log.resource_type],
                              ["Resource ID",      log.resource_id],
                              ["Organization ID",  log.details?.organization_id],
                              ["Event ID",         log.details?.event_id],
                              ["Event Title",      log.details?.event_title],
                              ["Amount",           log.details?.total ?? log.details?.amount],
                              ["Currency",         log.details?.currency],
                              ["Platform Fee",     log.details?.platform_fee],
                              ["Subtotal",         log.details?.subtotal],
                              ["Buyer / Donor",    log.details?.buyer_name ?? log.details?.donor_name],
                              ["Email",            log.details?.buyer_email ?? log.details?.donor_email],
                              ["IP Address",       log.ip_address],
                              ["User Agent",       log.user_agent ?? log.details?.user_agent],
                              ["Terms Version",    log.details?.terms_version],
                              ["Payment Status",   log.details?.payment_status],
                              ["Order Status",     log.details?.order_status],
                            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
                              <div key={label}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", wordBreak: "break-all",
                                  fontFamily: ["ID","IP Address","User Agent"].some(x => label.includes(x)) ? "monospace" : "inherit" }}>
                                  {String(val)}
                                </p>
                              </div>
                            ))}
                          </div>
                          {/* Ticket items if present */}
                          {Array.isArray(log.details?.items) && log.details.items.length > 0 && (
                            <div style={{ padding: "0 24px 16px" }}>
                              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Ticket Items</p>
                              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    {["Ticket", "Qty", "Unit Price", "Line Total"].map(h => (
                                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "rgba(255,255,255,0.30)", fontSize: 9, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {log.details.items.map((item, i) => (
                                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                      <td style={{ padding: "4px 8px", color: "rgba(255,255,255,0.60)" }}>{item.ticket_type_name}</td>
                                      <td style={{ padding: "4px 8px", color: "rgba(255,255,255,0.45)" }}>{item.quantity}</td>
                                      <td style={{ padding: "4px 8px", color: "rgba(255,255,255,0.45)" }}>${item.unit_price}</td>
                                      <td style={{ padding: "4px 8px", color: "#10b981", fontWeight: 700 }}>${item.line_total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <details style={{ padding: "0 24px 16px" }}>
                            <summary style={{ fontSize: 10, color: "rgba(255,255,255,0.20)", cursor: "pointer" }}>Raw JSON</summary>
                            <pre style={{ marginTop: 6, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.30)", fontSize: 9, color: "rgba(255,255,255,0.40)", overflow: "auto", maxHeight: 180 }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {auditMeta && auditMeta.total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 no-print" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>
              {((filters.page - 1) * 50) + 1}–{Math.min(filters.page * 50, auditMeta.total)} of {auditMeta.total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={filters.page === 1}
                className="rounded-xl px-4 py-2 text-xs font-bold transition"
                style={{ background: filters.page === 1 ? "rgba(255,255,255,0.03)" : "rgba(201,169,110,0.10)", color: filters.page === 1 ? "rgba(255,255,255,0.15)" : "#c9a96e", border: "1px solid rgba(201,169,110,0.15)" }}>
                ← Prev
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", padding: "0 8px" }}>
                {filters.page} / {totalPages}
              </span>
              <button onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, f.page + 1) }))} disabled={filters.page >= totalPages}
                className="rounded-xl px-4 py-2 text-xs font-bold transition"
                style={{ background: filters.page >= totalPages ? "rgba(255,255,255,0.03)" : "rgba(201,169,110,0.10)", color: filters.page >= totalPages ? "rgba(255,255,255,0.15)" : "#c9a96e", border: "1px solid rgba(201,169,110,0.15)" }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
