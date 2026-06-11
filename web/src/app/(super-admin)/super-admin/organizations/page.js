"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, Plus, Building2, Users, CalendarDays, ChevronDown } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const PLANS = ["free", "starter", "pro", "enterprise"];
const PLAN_COLORS = {
  free:       { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  starter:    { bg: "rgba(99,102,241,0.15)",  text: "#818cf8" },
  pro:        { bg: "rgba(201,169,110,0.15)", text: "#c9a96e" },
  enterprise: { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CreateOrgModal({ onClose, onCreated }) {
  const { createEnterpriseOrg } = useSuperAdminStore();
  const [form, setForm]   = useState({ name: "", owner_email: "", plan: "pro" });
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await createEnterpriseOrg(form);
    setBusy(false);
    if (res.success) { onCreated(res.data); onClose(); }
    else setErr(res.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.80)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.20)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(201,169,110,0.15)" }}>
            <Building2 size={16} style={{ color: "#c9a96e" }} />
          </div>
          <h2 className="text-[16px] font-black text-white">New Enterprise Organization</h2>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[
            { key: "name",        label: "Organization Name",  placeholder: "Madison Square Garden Events" },
            { key: "owner_email", label: "Owner Email",        placeholder: "ceo@example.com" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</label>
              <input
                required
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "#111127", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Plan</label>
            <div className="relative">
              <select
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full appearance-none rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "#111127", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.40)" }} />
            </div>
          </div>
          {err && <p className="text-[12px] text-red-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}>
              {busy ? "Creating…" : "Create Organization"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddMemberModal({ org, onClose }) {
  const { addOrgMember } = useSuperAdminStore();
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("ADMIN");
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await addOrgMember(org.id, { email, role });
    setBusy(false);
    if (res.success) setDone(true);
    else setErr(res.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.80)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.20)" }}
      >
        <h2 className="text-[15px] font-black text-white">Add Member to {org.name}</h2>
        {done ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-[28px]">✅</p>
            <p className="text-[14px] font-bold text-white">Member added successfully</p>
            <button onClick={onClose} className="mt-2 text-[12px] font-bold" style={{ color: "#c9a96e" }}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Email</label>
              <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com"
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "#111127", border: "1px solid rgba(255,255,255,0.10)" }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Role</label>
              <div className="relative">
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "#111127", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {["OWNER","ADMIN","MANAGER","MEMBER"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.40)" }} />
              </div>
            </div>
            {err && <p className="text-[12px] text-red-400">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>Cancel</button>
              <button type="submit" disabled={busy}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}>
                {busy ? "Adding…" : "Add Member"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function SuperAdminOrgsPage() {
  const { orgs, orgsMeta, fetchOrgs, updateOrgPlan, loading } = useSuperAdminStore();
  const [q,          setQ]          = useState("");
  const [page,       setPage]       = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [addMember,  setAddMember]  = useState(null);

  const load = useCallback(() => {
    fetchOrgs({ q, page, limit: 50 });
  }, [q, page, fetchOrgs]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {showCreate && <CreateOrgModal onClose={() => setShowCreate(false)} onCreated={() => load()} />}
      {addMember  && <AddMemberModal org={addMember} onClose={() => { setAddMember(null); load(); }} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Super Admin</p>
          <h1 className="text-[20px] font-black tracking-tight text-white">Organizations</h1>
          {orgsMeta && <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{orgsMeta.total} total</p>}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black"
          style={{ background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}
        >
          <Plus size={14} />
          New Enterprise Org
        </button>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-3.5 max-w-sm"
        style={{ height: 42, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <Search size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search organizations…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.25)]" />
        {q && <button onClick={() => setQ("")}><X size={12} style={{ color: "rgba(255,255,255,0.40)" }} /></button>}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(201,169,110,0.10)", background: "#0d0d1a" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Organization", "Owner", "Plan", "Events", "Members", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(201,169,110,0.50)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !orgs.length ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {[180, 140, 60, 40, 40, 80, 70].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
                        {j <= 1 && <div className="h-2.5 rounded animate-pulse mt-1.5" style={{ width: w * 0.65, background: "rgba(255,255,255,0.04)" }} />}
                      </td>
                    ))}
                  </tr>
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto" style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)" }}>
                        <Building2 size={24} style={{ color: "rgba(201,169,110,0.40)" }} />
                      </div>
                      <p className="text-[14px] font-black text-white">No organizations found</p>
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {q ? `No results matching "${q}"` : "Organizations will appear here as users create accounts"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orgs.map((org, i) => {
                const pc = PLAN_COLORS[org.plan ?? "free"] ?? PLAN_COLORS.free;
                return (
                  <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(201,169,110,0.12)" }}>
                          <Building2 size={12} style={{ color: "#c9a96e" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{org.name}</p>
                          {org.is_personal && <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Personal</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{org.owner_name}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>{org.owner_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={org.plan ?? "free"}
                        onChange={e => updateOrgPlan(org.id, e.target.value)}
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer outline-none"
                        style={{ background: pc.bg, color: pc.text, border: "none" }}
                      >
                        {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-white">{org.event_count}</td>
                    <td className="px-4 py-3 tabular-nums text-white">{org.member_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>{fmtDate(org.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAddMember(org)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors hover:bg-white/10"
                        style={{ color: "#a78bfa" }}
                      >
                        <Users size={11} />
                        Add member
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orgsMeta && orgsMeta.total > 50 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>Page {page} · {orgsMeta.total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>← Prev</button>
              <button disabled={page * 50 >= orgsMeta.total} onClick={() => setPage(p => p + 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
