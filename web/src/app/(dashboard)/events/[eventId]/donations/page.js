"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Users, CheckCircle, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

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
    <div className="space-y-6">

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
  );
}
