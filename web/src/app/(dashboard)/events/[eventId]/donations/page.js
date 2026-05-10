"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Users, CheckCircle, Clock, DollarSign, ChevronLeft, Home, User, Ticket, CalendarDays, Plus } from "lucide-react";
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

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

function StatusBadge({ status }) {
  const styles = {
    SUCCEEDED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Received" },
    PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   label: "Pending"  },
  };
  const s = styles[status] ?? styles.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}>
      {status === "SUCCEEDED" ? <CheckCircle size={11} /> : <Clock size={11} />}
      {s.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-1.5 text-2xl font-black ${color}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace("text-", "bg-").replace("-600", "-50")}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DonationsPage() {
  const { eventId } = useParams();
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!eventId) return;
    api.get(`/engagement/events/${eventId}/donations`)
      .then(r => setDonations(r.data.data ?? r.data.donations ?? []))
      .catch(e => setError(e.response?.data?.message || e.message || "Failed to load donations"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const succeeded  = donations.filter(d => d.payment_status === "SUCCEEDED");
  const totalRaised = succeeded.reduce((s, d) => s + Number(d.amount), 0);
  const totalCount  = donations.length;
  const paidCount   = succeeded.length;

  return (
    <>
      {/* ── MOBILE OVERLAY ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col overflow-hidden dark"
        style={{ background: "#07070f" }}>
        <div className="flex shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "rgba(255,255,255,0.08)", paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}>
          <Link href={`/events/${eventId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "#14141f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-black text-white leading-tight">Donations</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Track contributions</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {/* Mobile stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Raised",     value: `$${totalRaised.toFixed(0)}`, color: "#10b981" },
                { label: "Confirmed",  value: paidCount,                    color: "#6366f1" },
                { label: "Total",      value: totalCount,                   color: "rgba(255,255,255,0.5)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 rounded-[14px] border py-3"
                  style={{ background: `${color === "rgba(255,255,255,0.5)" ? "rgba(255,255,255" : color}${color === "rgba(255,255,255,0.5)" ? ",0.5)" : ""}10`, borderColor: `${color}22` }}>
                  <span className="text-[18px] font-black leading-none" style={{ color }}>{value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                </div>
              ))}
            </div>
            {/* Donation list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.08)", borderTopColor: "#6366f1" }} />
              </div>
            ) : error ? (
              <div className="rounded-[16px] border px-4 py-8 text-center text-[13px]"
                style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>{error}</div>
            ) : donations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <Heart size={24} style={{ color: "#f43f5e" }} />
                </div>
                <p className="text-[16px] font-extrabold text-white">No donations yet</p>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>Enable donations in event settings.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-[16px] border px-4 py-3.5"
                    style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.2)" }}>
                      <Heart size={16} style={{ color: "#f43f5e" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold text-white">{d.donor_name || "Anonymous"}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{d.donor_email || "No email"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-black" style={{ color: "#10b981" }}>${Number(d.amount).toFixed(0)}</p>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        d.payment_status === "SUCCEEDED"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}>
                        {d.payment_status === "SUCCEEDED" ? "✓ Received" : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <MobileBottomNav />
      </div>

      {/* ── DESKTOP UI ── */}
      <div className="hidden sm:block space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart size={22} className="text-rose-500" /> Donations
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Track contributions made to your event</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={DollarSign} label="Total Raised"   value={fmt(totalRaised)} color="text-emerald-600" delay={0}    />
        <KpiCard icon={CheckCircle} label="Confirmed"     value={paidCount}        color="text-indigo-600"  delay={0.05} />
        <KpiCard icon={Users}       label="All Donations" value={totalCount}       color="text-gray-600"    delay={0.1}  />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-bold text-gray-700">Donation Log</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-500">{error}</div>
        ) : donations.length === 0 ? (
          <div className="p-16 text-center">
            <Heart size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No donations yet</p>
            <p className="text-xs text-gray-300 mt-1">Make sure donations are enabled in event settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Donor", "Amount", "Message", "Date", "Status"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.map((d, i) => (
                  <motion.tr key={d.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                          <Heart size={13} className="text-rose-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {d.is_anonymous ? <span className="italic text-gray-400">Anonymous</span> : (d.donor_name || <span className="text-gray-400">—</span>)}
                          </p>
                          <p className="text-xs text-gray-400">{d.donor_email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      {fmt(Number(d.amount), d.currency)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {d.message || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {fmtDate(d.donated_at || d.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.payment_status} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
