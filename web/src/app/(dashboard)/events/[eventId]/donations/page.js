"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ChevronLeft, DollarSign, Users, CheckCircle2,
  Clock, AlertCircle, Loader2, Pencil, Save, X,
  ChevronDown, ChevronUp, Mail, Phone, Hash, Calendar, RefreshCw,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { api } from "@/lib/api";

const DEFAULT_AMOUNTS = [5, 10, 25];

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* ── helpers ────────────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none focus:border-rose-400 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-500/20 transition disabled:opacity-40";

/* ── Stat card ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, bgClass, borderClass, iconColorClass, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border px-3 py-3 sm:p-5 ${bgClass} ${borderClass}`}
    >
      <div className="relative flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-1 text-center sm:text-left">
        <div>
          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-2 ${iconColorClass} opacity-70`}>{label}</p>
          <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
        </div>
        <div className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${bgClass} ${borderClass}`}>
          <Icon size={18} className={iconColorClass} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Donation amounts setup card ────────────────────────────────── */
/* ONE per event. Admin sets exactly 3 required amounts.            */
function DonationSetup({ eventId, amounts, message: savedMessage, onChange }) {
  const hasSetup    = amounts.length === 3;
  const [editing, setEditing] = useState(!hasSetup);
  const [vals, setVals]       = useState(hasSetup ? amounts.map(String) : ["", "", ""]);
  const [msg, setMsg]         = useState(savedMessage ?? "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (hasSetup) setVals(amounts.map(String));
  }, [amounts]);

  useEffect(() => {
    setMsg(savedMessage ?? "");
  }, [savedMessage]);

  const handleSave = async () => {
    const parsed = vals.map((v) => Number(v)).filter(Boolean);
    if (parsed.length !== 3 || parsed.some((n) => n <= 0)) {
      setError("All 3 amounts are required and must be greater than 0.");
      return;
    }
    setSaving(true); setError("");
    try {
      await api.patch(`/engagement/events/${eventId}/donation-config`, { amounts: parsed, message: msg.trim() });
      onChange(parsed, msg.trim());
      setEditing(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-(--bg-elevated) overflow-hidden shadow-sm"
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#be185d,#f43f5e,#fb7185)" }} />

      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
            <Heart size={18} className="text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">Donation Setup</p>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Preset Amounts</h2>
          </div>
        </div>
        {hasSetup && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-white/60 hover:border-rose-200 dark:hover:border-rose-400/30 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Preview — when saved and not editing */}
        {hasSetup && !editing ? (
          <div className="space-y-4">
            {msg && (
              <div className="rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/6 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 dark:text-rose-300/60 mb-1">Donation message</p>
                <p className="text-sm text-gray-700 dark:text-white/70 leading-relaxed">{msg}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-white/40">Donors choose from these 3 amounts.</p>
            <div className="flex gap-3">
              {amounts.map((a, i) => (
                <div key={i} className="flex-1 flex flex-col items-center rounded-2xl border-2 border-rose-200 dark:border-rose-400/30 bg-rose-50/60 dark:bg-rose-500/8 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 dark:text-rose-300/60 mb-1">Option {i + 1}</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-300">{fmt(a)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Edit form */
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-white/40">
              Set exactly 3 donation amounts donors can choose from. All 3 are required.
            </p>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
                Donation message <span className="font-normal opacity-60">(shown on the event page)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Help us cover costs and make this event amazing for everyone!"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={280}
                className={`${inputCls} resize-none`}
              />
              <p className="mt-1 text-right text-[10px] text-gray-400 dark:text-white/30">{msg.length}/280</p>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
                    Amount {i + 1} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-white/40">$</span>
                    <input
                      type="number" min="1" placeholder={String(DEFAULT_AMOUNTS[i])}
                      value={vals[i] ?? ""}
                      onChange={(e) => { setError(""); setVals((v) => { const n = [...v]; n[i] = e.target.value; return n; }); }}
                      className={`${inputCls} pl-7`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <AlertCircle size={14} className="shrink-0 text-red-500 dark:text-red-400" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#be185d,#f43f5e)", boxShadow: "0 4px 16px rgba(244,63,94,0.25)" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : "Save"}
              </motion.button>
              {hasSetup && (
                <button
                  onClick={() => { setEditing(false); setVals(amounts.map(String)); setMsg(savedMessage ?? ""); setError(""); }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Record donation form — REMOVED (admin is setup only) ── */
function RecordDonationForm_UNUSED({ eventId, onDonated }) {
  const [amount, setAmount]     = useState("");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [message, setMessage]   = useState("");
  const [anon, setAnon]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const parsedAmount = parseFloat(amount);

  const handleSubmit = async () => {
    if (!parsedAmount || parsedAmount <= 0) { setError("Please enter a valid donation amount."); return; }
    setSaving(true); setError("");
    try {
      await api.post(`/engagement/events/${eventId}/donations/manual`, {
        amount:       parsedAmount,
        currency:     "USD",
        donor_name:   anon ? undefined : name.trim() || undefined,
        donor_email:  email.trim() || undefined,
        message:      message.trim() || undefined,
        is_anonymous: anon,
      });
      setDone(true);
      onDonated();
      setTimeout(() => {
        setDone(false); setAmount(""); setName(""); setEmail(""); setMessage(""); setAnon(false);
      }, 3000);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to record donation.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/5 py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25"
        >
          <Heart size={26} className="text-rose-500 dark:text-rose-400 fill-rose-200 dark:fill-rose-500/30" />
        </motion.div>
        <p className="text-lg font-black text-gray-900 dark:text-white">Recorded! 💝</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">
          Donation of <span className="font-bold text-rose-500">{fmt(parsedAmount)}</span> saved.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-(--bg-elevated) overflow-hidden shadow-sm"
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#be185d,#f43f5e,#fb7185)" }} />

      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
          <Plus size={18} className="text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">Record</p>
          <h2 className="text-base font-black text-gray-900 dark:text-white">Add a Donation</h2>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Amount input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
            Donation amount (USD) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-white/40">$</span>
            <input
              type="number" min="0.01" step="0.01" placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              className={`${inputCls} pl-8`}
            />
          </div>
          {parsedAmount > 0 && (
            <p className="mt-1.5 text-xs font-bold text-rose-500 dark:text-rose-400">
              Recording {fmt(parsedAmount)}
            </p>
          )}
        </div>

        <div className="h-px bg-gray-100 dark:bg-white/8" />

        {/* Donor info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
              Name <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input type="text" placeholder={anon ? "Anonymous" : "Full name"}
              disabled={anon} value={name} onChange={(e) => setName(e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
              Email <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input type="email" placeholder={anon ? "Anonymous" : "you@example.com"}
              disabled={anon} value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
            Message <span className="font-normal opacity-60">(optional)</span>
          </label>
          <textarea rows={2} placeholder="Leave a note…"
            value={message} onChange={(e) => setMessage(e.target.value)}
            className={`${inputCls} resize-none`} />
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/4 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Donate anonymously</p>
            <p className="text-xs text-gray-400 dark:text-white/40">Name won&apos;t appear publicly</p>
          </div>
          <button
            onClick={() => setAnon((v) => !v)}
            className={`relative flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              anon ? "bg-rose-500" : "bg-gray-200 dark:bg-white/15"
            }`}
          >
            <span
              className="absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: anon ? "calc(100% - 20px)" : 4 }}
            />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
            <AlertCircle size={14} className="shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={saving || !parsedAmount || parsedAmount <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#be185d,#f43f5e)", boxShadow: "0 6px 24px rgba(244,63,94,0.28)" }}
        >
          {saving
            ? <Loader2 size={16} className="animate-spin" />
            : <><Heart size={15} />{parsedAmount > 0 ? `Record ${fmt(parsedAmount)} Donation` : "Record Donation"}</>
          }
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Delete confirm modal ───────────────────────────────────────── */

/* ── Donation row ───────────────────────────────────────────────── */
function DonationRow({ d, index }) {
  const [open, setOpen] = useState(false);
  const isOk = d.payment_status === "SUCCEEDED";
  const ini  = (d.is_anonymous ? "?" : (d.donor_name ?? "?"))
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-(--bg-elevated) overflow-hidden transition hover:border-gray-200 dark:hover:border-white/15"
    >
      {/* Main row — click to expand */}
      <button
        onClick={() => setOpen(v => !v)}
        className="group w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-xs font-black text-rose-500 dark:text-rose-400">
          {d.is_anonymous ? <Heart size={14} /> : ini}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {d.is_anonymous ? "Anonymous" : (d.donor_name || "Anonymous")}
          </p>
          <p className="text-xs text-gray-400 dark:text-white/40 truncate">
            {(!d.is_anonymous && d.donor_email) ? d.donor_email : fmtDate(d.created_at)}
          </p>
          {d.message && !open && (
            <p className="mt-0.5 text-xs italic text-gray-400 dark:text-white/30 truncate">&ldquo;{d.message}&rdquo;</p>
          )}
        </div>
        <div className="shrink-0 text-right space-y-1">
          <p className={`text-base font-black ${isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {fmt(d.amount, d.currency)}
            {d.frequency === "monthly" && <span className="ml-1 text-[10px] font-bold text-indigo-400">/mo</span>}
          </p>
          <div className="flex items-center justify-end gap-1">
            {d.frequency === "monthly" && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black text-indigo-500 dark:text-indigo-400">Monthly</span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isOk ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                   : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {isOk ? <CheckCircle2 size={9} /> : <Clock size={9} />}
              {isOk ? "Received" : "Pending"}
            </span>
          </div>
        </div>
        <div className="shrink-0 ml-1 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/40 transition-colors">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-white/6 px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3 bg-gray-50/60 dark:bg-white/2">
              {[
                { Icon: Mail,     label: "Email",        value: d.is_anonymous ? "Anonymous" : (d.donor_email || "—") },
                { Icon: Phone,    label: "Phone",        value: d.is_anonymous ? "—" : (d.donor_phone || "—") },
                { Icon: Calendar, label: "Date",         value: fmtDate(d.created_at) },
                { Icon: Hash,     label: "Transaction",  value: d.provider_transaction_id ? d.provider_transaction_id.slice(-12) : "—" },
                { Icon: RefreshCw,label: "Frequency",    value: d.frequency === "monthly" ? "Monthly recurring" : "One-time" },
                { Icon: DollarSign,label:"Amount",       value: fmt(d.amount, d.currency) },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/6">
                    <Icon size={11} className="text-gray-400 dark:text-white/35" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">{label}</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-white/70 break-all">{value}</p>
                  </div>
                </div>
              ))}
              {d.message && (
                <div className="col-span-2 flex items-start gap-2.5 pt-1 border-t border-gray-100 dark:border-white/6">
                  <p className="text-xs text-gray-500 dark:text-white/45 italic">&ldquo;{d.message}&rdquo;</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Donut chart (pure SVG, no lib) ─────────────────────────────── */
function DonutChart({ title, segments }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const R = 44, cx = 52, cy = 52, stroke = 14;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct  = total > 0 ? seg.count / total : 0;
    const dash = pct * circumference;
    const arc  = { ...seg, dash, gap: circumference - dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-(--bg-elevated) p-5">
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/35">{title}</p>
      <div className="flex items-center gap-5">
        {/* SVG donut */}
        <div className="shrink-0 relative" style={{ width: 104, height: 104 }}>
          <svg width="104" height="104" viewBox="0 0 104 104">
            {/* track */}
            <circle cx={cx} cy={cy} r={R} fill="none"
              stroke="currentColor" strokeWidth={stroke}
              className="text-gray-100 dark:text-white/6" />
            {total === 0 ? null : arcs.map((arc, i) => (
              <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={arc.color} strokeWidth={stroke}
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={-arc.offset}
                style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 0.6s ease" }}
              />
            ))}
          </svg>
          {/* centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{total}</p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mt-0.5">total</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <p className="flex-1 text-xs font-semibold text-gray-600 dark:text-white/60 truncate">{seg.label}</p>
              <p className="text-xs font-black text-gray-900 dark:text-white">{seg.count}</p>
              <p className="text-[10px] text-gray-400 dark:text-white/30 w-9 text-right">
                {total > 0 ? `${Math.round(seg.count / total * 100)}%` : "—"}
              </p>
            </div>
          ))}
          {total === 0 && (
            <p className="text-xs text-gray-400 dark:text-white/30 italic">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function DonationsPage() {
  const { eventId } = useParams();
  const { events, fetchEvents } = useEventStore();
  const event = events.find((e) => e.id === eventId);

  const [donations, setDonations]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [fetchErr, setFetchErr]         = useState(null);
  const [configAmounts, setConfigAmounts] = useState([]);
  const [configMessage, setConfigMessage] = useState("");

  const loadDonations = useCallback(async () => {
    setLoading(true); setFetchErr(null);
    try {
      const res = await api.get(`/engagement/events/${eventId}/donations`);
      setDonations(res.data?.data ?? res.data?.donations ?? []);
    } catch (err) {
      setFetchErr(err?.response?.data?.message ?? "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDonations();
    if (!event) fetchEvents();
    api.get(`/engagement/events/${eventId}/donation-config`)
      .then((r) => { setConfigAmounts(r.data?.data?.amounts ?? []); setConfigMessage(r.data?.data?.message ?? ""); })
      .catch(() => {});
  }, [eventId]); // eslint-disable-line



  const stats = useMemo(() => {
    const confirmed = donations.filter((d) => d.payment_status === "SUCCEEDED");
    const pending   = donations.filter((d) => d.payment_status !== "SUCCEEDED");
    const monthly   = donations.filter((d) => d.frequency === "monthly");
    const once      = donations.filter((d) => d.frequency !== "monthly");
    const total     = donations.length;
    const amtRanges = [
      { label: "< $10",    count: donations.filter(d => Number(d.amount) < 10).length,   color: "#f43f5e" },
      { label: "$10–$25",  count: donations.filter(d => Number(d.amount) >= 10 && Number(d.amount) < 25).length, color: "#fb923c" },
      { label: "$25–$50",  count: donations.filter(d => Number(d.amount) >= 25 && Number(d.amount) < 50).length, color: "#facc15" },
      { label: "$50+",     count: donations.filter(d => Number(d.amount) >= 50).length,  color: "#4ade80" },
    ];
    return {
      totalRaised:    confirmed.reduce((s, d) => s + Number(d.amount), 0),
      confirmedCount: confirmed.length,
      totalCount:     total,
      currency:       donations[0]?.currency ?? "USD",
      charts: {
        status:    [
          { label: "Received", count: confirmed.length, color: "#10b981" },
          { label: "Pending",  count: pending.length,   color: "#f59e0b" },
        ],
        frequency: [
          { label: "One-time", count: once.length,    color: "#6366f1" },
          { label: "Monthly",  count: monthly.length, color: "#a78bfa" },
        ],
        amounts: amtRanges,
      },
    };
  }, [donations]);

  const PREVIEW = 5;
  const [showAll, setShowAll] = useState(false);
  const visibleDonations = showAll ? donations : donations.slice(0, PREVIEW);
  const hiddenCount      = donations.length - PREVIEW;

  return (
    <div className="space-y-8 pb-16">

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-start gap-4"
      >
        <Link
          href={`/events/${eventId}`}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={15} />
        </Link>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Heart size={11} className="text-rose-500 dark:text-rose-400" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">Donations</p>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{event?.title ?? "Event"}</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Configure donation amounts and track contributions.</p>
        </div>
      </motion.div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={DollarSign}   label="Total Raised"  value={loading ? "—" : fmt(stats.totalRaised, stats.currency)}
          bgClass="bg-rose-50 dark:bg-rose-500/10" borderClass="border-rose-100 dark:border-rose-500/20"
          iconColorClass="text-rose-500 dark:text-rose-400" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Confirmed"     value={loading ? "—" : stats.confirmedCount}
          bgClass="bg-emerald-50 dark:bg-emerald-500/10" borderClass="border-emerald-100 dark:border-emerald-500/20"
          iconColorClass="text-emerald-600 dark:text-emerald-400" delay={0.10} />
        <StatCard icon={Users}        label="Total Donors"  value={loading ? "—" : stats.totalCount}
          bgClass="bg-indigo-50 dark:bg-indigo-500/10" borderClass="border-indigo-100 dark:border-indigo-500/20"
          iconColorClass="text-indigo-600 dark:text-indigo-400" delay={0.15} />
      </div>

      {/* Donut charts */}
      {!loading && donations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DonutChart title="By Status"    segments={stats.charts.status} />
          <DonutChart title="By Frequency" segments={stats.charts.frequency} />
          <DonutChart title="By Amount"    segments={stats.charts.amounts} />
        </div>
      )}

      {fetchErr && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{fetchErr}</p>
          </div>
          <button onClick={loadDonations} className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-red-500/10 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 transition hover:bg-red-50">
            Retry
          </button>
        </div>
      )}

      {/* Two columns: setup+form left, donors list right */}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

        {/* Left: setup only */}
        <DonationSetup
          eventId={eventId}
          amounts={configAmounts}
          message={configMessage}
          onChange={(a, m) => { setConfigAmounts(a); setConfigMessage(m ?? ""); }}
        />

        {/* Right: donors list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Donors</p>
              {donations.length > 0 && (
                <span className="rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-black text-gray-500 dark:text-white/50">
                  {donations.length}
                </span>
              )}
            </div>
            <button onClick={loadDonations} className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-100 dark:border-rose-500/15 bg-rose-50/40 dark:bg-rose-500/4 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <Heart size={24} className="text-rose-300 dark:text-rose-500/50" />
              </div>
              <p className="text-sm font-bold text-gray-600 dark:text-white/60">No donations yet</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-white/35 max-w-xs">
                Set up your amounts on the left, then record the first donation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visibleDonations.map((d, i) => (
                  <DonationRow key={d.id} d={d} index={i} />
                ))}
              </AnimatePresence>

              {donations.length > PREVIEW && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/8 py-3 text-sm font-bold text-rose-500 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-500/15"
                >
                  <ChevronDown size={15} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
                  {showAll
                    ? "Show less"
                    : `Show all ${donations.length} donors (+${hiddenCount} more)`}
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
