"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, Shield, ShieldOff, ToggleLeft, ToggleRight } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS = {
  ACTIVE:    { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  INACTIVE:  { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  SUSPENDED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};
const PLAN_COLORS = {
  free:       "rgba(107,114,128,0.50)",
  starter:    "#818cf8",
  pro:        "#c9a96e",
  enterprise: "#f87171",
};

export default function SuperAdminUsersPage() {
  const { users, usersMeta, fetchUsers, updateUser, loading } = useSuperAdminStore();
  const [q,    setQ]    = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    fetchUsers({ q, page, limit: 50 });
  }, [q, page, fetchUsers]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(user) {
    const next = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateUser(user.id, { status: next });
  }

  async function toggleSuperAdmin(user) {
    await updateUser(user.id, { is_super_admin: !user.is_super_admin });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Super Admin</p>
          <h1 className="text-[20px] font-black tracking-tight text-white">All Users</h1>
          {usersMeta && <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{usersMeta.total} total</p>}
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-3.5 max-w-sm"
        style={{ height: 42, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <Search size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.25)]" />
        {q && <button onClick={() => setQ("")}><X size={12} style={{ color: "rgba(255,255,255,0.40)" }} /></button>}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(201,169,110,0.10)", background: "#0d0d1a" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User", "Plan", "Events", "Status", "Last Login", "Joined", "Super Admin", "Active"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(201,169,110,0.50)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !users.length ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                          <div className="h-2.5 w-36 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                        </div>
                      </div>
                    </td>
                    {[50, 30, 60, 70, 70, 50, 40].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                        <Search size={24} style={{ color: "rgba(99,102,241,0.45)" }} />
                      </div>
                      <p className="text-[14px] font-black text-white">No users found</p>
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {q ? `No results matching "${q}"` : "Registered users will appear here"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : users.map((user, i) => {
                const sc = STATUS_COLORS[user.status] ?? STATUS_COLORS.INACTIVE;
                return (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                          style={{
                            background: user.is_super_admin
                              ? "linear-gradient(135deg,#c9a96e,#f59e0b)"
                              : "rgba(99,102,241,0.20)",
                            color: user.is_super_admin ? "#000" : "#a78bfa",
                          }}
                        >
                          {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.full_name ?? "—"}</p>
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold" style={{ color: PLAN_COLORS[user.plan ?? "free"] }}>
                        {user.plan ?? "free"}
                      </span>
                      {user.org_name && <p className="text-[10px] truncate max-w-25" style={{ color: "rgba(255,255,255,0.25)" }}>{user.org_name}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-white">{user.event_count}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>
                      {fmtDate(user.last_login_at)}
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>
                      {fmtDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSuperAdmin(user)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all hover:scale-105"
                        style={{
                          background: user.is_super_admin ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)",
                          color:      user.is_super_admin ? "#c9a96e" : "rgba(255,255,255,0.35)",
                          border:     `1px solid ${user.is_super_admin ? "rgba(201,169,110,0.30)" : "rgba(255,255,255,0.08)"}`,
                        }}
                        title={user.is_super_admin ? "Remove super admin" : "Grant super admin"}
                      >
                        {user.is_super_admin ? <Shield size={11} /> : <ShieldOff size={11} />}
                        {user.is_super_admin ? "Super" : "Grant"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(user)}
                        style={{ color: user.status === "ACTIVE" ? "#10b981" : "rgba(255,255,255,0.30)" }}
                        title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      >
                        {user.status === "ACTIVE" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {usersMeta && usersMeta.total > 50 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>Page {page} · {usersMeta.total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>← Prev</button>
              <button disabled={page * 50 >= usersMeta.total} onClick={() => setPage(p => p + 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
