"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, X, BadgeCheck, Store, Star, ToggleLeft, ToggleRight,
  Trash2, Filter, ChevronDown, RefreshCw, MapPin,
} from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

/* ── helpers ────────────────────────────────────────────────────────────── */
const GOLD = "rgba(201,169,110,0.60)";

function fmt(n) { return Number(n || 0).toLocaleString(); }
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const VSTATUS = {
  verified: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", label: "Verified"  },
  pending:  { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b", label: "Pending"   },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#ef4444", label: "Rejected"  },
};

const TIERS = {
  bronze:   { color: "#b45309", bg: "rgba(180,83,9,0.15)"   },
  silver:   { color: "#9ca3af", bg: "rgba(156,163,175,0.15)" },
  gold:     { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  platinum: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
};

const CATEGORIES = [
  "", "Photography", "Videography", "Catering", "Music & DJ",
  "Flowers & Décor", "Venue", "Lighting", "Sound & AV",
  "Hair & Makeup", "Transportation", "Security", "Entertainment",
  "Officiant", "Cake & Desserts", "Rentals",
];

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, color = "#fff" }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.10)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{label}</p>
      <p className="text-[28px] font-black leading-none tracking-tight" style={{ color }}>{fmt(value ?? 0)}</p>
    </div>
  );
}

/* ── Confirm delete dialog ──────────────────────────────────────────────── */
function ConfirmDelete({ vendor, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#0d0d1a", border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
            <Trash2 size={18} color="#ef4444" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Delete Vendor</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>This cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
          Remove <span className="text-white font-semibold">{vendor.business_name}</span> and all their data from the platform?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function SuperAdminVendorsPage() {
  const { vendors, vendorsMeta, vendorStats, fetchAdminVendors, updateAdminVendor, deleteAdminVendor, loading } = useSuperAdminStore();

  const [q,          setQ]          = useState("");
  const [status,     setStatus]     = useState("all");
  const [verified,   setVerified]   = useState("");
  const [category,   setCategory]   = useState("");
  const [page,       setPage]       = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [delTarget,  setDelTarget]  = useState(null);
  const [updating,   setUpdating]   = useState(null);

  const load = useCallback(() => {
    fetchAdminVendors({ q, status, verified, category, page, limit: 50 });
  }, [q, status, verified, category, page]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(id, payload) {
    setUpdating(id);
    await updateAdminVendor(id, payload);
    setUpdating(null);
  }

  async function handleDelete() {
    if (!delTarget) return;
    await deleteAdminVendor(delTarget.id);
    setDelTarget(null);
  }

  const totalPages = vendorsMeta?.pages ?? 1;

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Super Admin</p>
          <h1 className="text-[20px] font-black tracking-tight text-white">Vendors</h1>
          {vendorsMeta && <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(vendorsMeta.total)} vendors</p>}
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {vendorStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total"       value={vendorStats.total}           color="#fff"     />
          <StatCard label="Active"      value={vendorStats.active}          color="#10b981"  />
          <StatCard label="Verified"    value={vendorStats.verified}        color="#818cf8"  />
          <StatCard label="Pending"     value={vendorStats.pending}         color="#f59e0b"  />
          <StatCard label="Inquiries"   value={vendorStats.total_inquiries} color="rgba(201,169,110,0.9)" />
          <StatCard label="Reviews"     value={vendorStats.total_reviews}   color="rgba(255,255,255,0.7)" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3.5 flex-1 min-w-[200px] max-w-sm"
          style={{ height: 42, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)" }}>
          <Search size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name, email, category…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.25)]" />
          {q && <button onClick={() => { setQ(""); setPage(1); }}><X size={12} style={{ color: "rgba(255,255,255,0.40)" }} /></button>}
        </div>

        {/* Status filter */}
        <div className="relative">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
        </div>

        {/* Verification filter */}
        <div className="relative">
          <select value={verified} onChange={e => { setVerified(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || "All Categories"}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(201,169,110,0.10)", background: "#0d0d1a" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Vendor", "Category", "Location", "Verification", "Tier", "Rating", "Inquiries", "Active", "Featured", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ color: GOLD }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !vendors.length ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-md animate-pulse" style={{ background: "rgba(255,255,255,0.06)", width: j === 0 ? 140 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No vendors found
                </td></tr>
              ) : vendors.map((v) => {
                const vstyle = VSTATUS[v.verification_status] ?? VSTATUS.pending;
                const tStyle = TIERS[v.tier] ?? TIERS.bronze;
                const isUpdating = updating === v.id;

                return (
                  <tr key={v.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/[0.02] transition-colors">

                    {/* Vendor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                          style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8" }}>
                          {v.logo_url
                            ? <img src={v.logo_url} alt={v.business_name} className="w-full h-full object-cover rounded-lg" />
                            : (v.business_name?.[0] ?? "V").toUpperCase()
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-white whitespace-nowrap">{v.business_name}</p>
                          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{v.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(129,140,248,0.1)", color: "#818cf8" }}>
                        {v.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <MapPin size={10} />
                        {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: vstyle.bg, color: vstyle.text }}>
                          {vstyle.label}
                        </span>
                        {v.verification_status !== "verified" && (
                          <button onClick={() => handleUpdate(v.id, { verification_status: "verified" })}
                            disabled={isUpdating}
                            title="Approve verification"
                            className="p-1 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
                            style={{ background: "rgba(16,185,129,0.1)" }}>
                            <BadgeCheck size={12} color="#10b981" />
                          </button>
                        )}
                        {v.verification_status !== "rejected" && (
                          <button onClick={() => handleUpdate(v.id, { verification_status: "rejected" })}
                            disabled={isUpdating}
                            title="Reject verification"
                            className="p-1 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
                            style={{ background: "rgba(239,68,68,0.1)" }}>
                            <X size={12} color="#ef4444" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="relative">
                        <select value={v.tier || "bronze"}
                          onChange={e => handleUpdate(v.id, { tier: e.target.value })}
                          disabled={isUpdating}
                          className="appearance-none pl-2 pr-5 py-0.5 rounded-full text-[10px] font-bold outline-none cursor-pointer"
                          style={{ background: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.color}33` }}>
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                        </select>
                        <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tStyle.color }} />
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{Number(v.rating || 0).toFixed(1)}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>({v.review_count})</span>
                      </div>
                    </td>

                    {/* Inquiries */}
                    <td className="px-4 py-3 text-center">
                      <span style={{ color: "rgba(201,169,110,0.9)", fontWeight: 600 }}>{fmt(v.inquiry_count)}</span>
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      <button onClick={() => handleUpdate(v.id, { is_active: !v.is_active })}
                        disabled={isUpdating} className="disabled:opacity-50">
                        {v.is_active
                          ? <ToggleRight size={22} color="#10b981" />
                          : <ToggleLeft  size={22} color="rgba(255,255,255,0.2)" />
                        }
                      </button>
                    </td>

                    {/* Featured toggle */}
                    <td className="px-4 py-3">
                      <button onClick={() => handleUpdate(v.id, { is_featured: !v.is_featured })}
                        disabled={isUpdating} className="disabled:opacity-50">
                        {v.is_featured
                          ? <ToggleRight size={22} color="#f59e0b" />
                          : <ToggleLeft  size={22} color="rgba(255,255,255,0.2)" />
                        }
                      </button>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {fmtDate(v.created_at)}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3">
                      <button onClick={() => setDelTarget(v)}
                        className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Page {page} of {totalPages} · {fmt(vendorsMeta?.total)} vendors
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity"
                style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity"
                style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {delTarget && <ConfirmDelete vendor={delTarget} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} />}
    </div>
  );
}
