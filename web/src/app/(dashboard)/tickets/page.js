"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ChevronRight, Ticket, Sparkles, Search, BarChart3,
  Tag, Users, Calendar, TrendingUp, CheckCircle2, Clock, Zap,
  Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, Save,
  ArrowRight, LayoutTemplate, Palette,
} from "lucide-react";
import { useTicketStore } from "@/store/ticket.store";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import { api } from "@/lib/api";

/* ── constants ───────────────────────────────────────────── */
const ENTERTAINMENT_SUBS =
  EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

const ENTERTAINMENT_EVENT_TYPES = new Set(
  ENTERTAINMENT_SUBS.map((s) => s.eventType.toUpperCase())
);


const TYPE_ACCENTS = {
  CONCERT:    { from: "#f59e0b", to: "#ef4444", glow: "#f59e0b" },
  FESTIVAL:   { from: "#a855f7", to: "#ec4899", glow: "#a855f7" },
  LIVE_SHOW:  { from: "#06b6d4", to: "#6366f1", glow: "#06b6d4" },
  NIGHTCLUB:  { from: "#6366f1", to: "#8b5cf6", glow: "#6366f1" },
  THEATER:    { from: "#ef4444", to: "#f97316", glow: "#ef4444" },
  COMEDY:     { from: "#f97316", to: "#facc15", glow: "#f97316" },
  SPORTS:     { from: "#22c55e", to: "#06b6d4", glow: "#22c55e" },
  EXHIBITION: { from: "#14b8a6", to: "#6366f1", glow: "#14b8a6" },
};

const SORT_OPTIONS = [
  { value: "date_asc",   label: "Date: Soonest first" },
  { value: "date_desc",  label: "Date: Latest first"  },
  { value: "sold_desc",  label: "Most tickets sold"    },
  { value: "types_desc", label: "Most ticket types"    },
  { value: "name_asc",   label: "Name A–Z"             },
];

const KIND_LABELS = { PAID: "Paid", FREE: "Free", DONATION: "Donation" };
const KIND_COLORS = {
  PAID:     { bg: "#f0fdf4", text: "#16a34a" },
  FREE:     { bg: "#eff6ff", text: "#2563eb" },
  DONATION: { bg: "#fdf4ff", text: "#9333ea" },
};

/* ── helpers ─────────────────────────────────────────────── */
function getAccentForEvent(event) {
  /* Use dashboard_mode (subcategory id) for precise per-type color */
  const key = String(event.dashboard_mode ?? event.event_type ?? "").toUpperCase();
  return TYPE_ACCENTS[key] ?? { from: "#f59e0b", to: "#fbbf24", glow: "#f59e0b" };
}
function getSubForEvent(event) {
  /* Prefer dashboard_mode (precise subcategory id) over event_type (broad) */
  const byMode = ENTERTAINMENT_SUBS.find(
    (s) => s.id.toUpperCase() === String(event.dashboard_mode ?? "").toUpperCase()
  );
  if (byMode) return byMode;
  return (
    ENTERTAINMENT_SUBS.find(
      (s) => s.eventType.toUpperCase() === String(event.event_type ?? "").toUpperCase()
    ) ?? null
  );
}
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function fmtPrice(price, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price ?? 0);
}
function isUpcoming(d) {
  return d ? new Date(d) > new Date() : false;
}

/* ── Skeleton ────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-gray-100" />
        <div className="h-8 flex-1 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────── */
function TicketStatCard({ icon: Icon, label, value, accent, delay, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div
        className="absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl opacity-30"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <p className="mt-1.5 text-3xl font-black text-gray-900">{value}</p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Create Ticket Overlay ───────────────────────────────── */
/* Beautiful full-screen category picker. Navigates to the  */
/* create event page with the subcategory pre-selected.      */

function SubCard({ sub, index, onClick }) {
  const accent =
    TYPE_ACCENTS[sub.id?.toUpperCase()] ??
    { from: "#f59e0b", to: "#fbbf24", glow: "#f59e0b" };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.32 }}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl p-4 text-center"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* hover glow blob */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at 50% -10%,${accent.glow}35 0%,transparent 68%)` }}
      />
      {/* top shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg,transparent,${accent.from},transparent)` }}
      />

      {/* icon */}
      <div
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl leading-none transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg,${accent.from}22,${accent.to}11)`,
          border: `1px solid ${accent.from}38`,
          boxShadow: `0 0 22px ${accent.glow}22`,
        }}
      >
        {sub.icon}
      </div>

      {/* label */}
      <div className="relative z-10 space-y-1">
        <p className="text-xs font-bold leading-tight text-white/65 transition-colors duration-200 group-hover:text-white/95">
          {sub.label}
        </p>
        <div
          className="flex items-center justify-center gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ color: accent.from }}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">Select</span>
          <ChevronRight size={9} />
        </div>
      </div>
    </motion.button>
  );
}

function CreateTicketOverlay({ onClose }) {
  const router = useRouter();

  const handleSelect = useCallback(
    (sub) => {
      router.push(
        `/events/create?category=entertainment&sub=${sub.id}&from=tickets`
      );
      onClose();
    },
    [router, onClose]
  );

  /* flow steps shown in header */
  const FLOW_STEPS = [
    { icon: Ticket,        label: "Choose type"  },
    { icon: Sparkles,      label: "Event details" },
    { icon: LayoutTemplate,label: "Template"      },
    { icon: Palette,       label: "Design"        },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 28 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg,#0d0d1a 0%,#090910 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "0 48px 96px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* ── amber / red top glow line ── */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg,transparent 5%,#f59e0b 40%,#ef4444 60%,transparent 95%)",
          }}
        />

        {/* ── header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.28)",
                boxShadow: "0 0 20px rgba(245,158,11,0.12)",
              }}
            >
              <Ticket size={18} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400">
                Ticketed &amp; Entertainment
              </p>
              <h2 className="text-lg font-black text-white leading-snug">
                Choose your event type
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── flow steps strip ── */}
        <div className="mt-4 flex items-center gap-0 px-6">
          {FLOW_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-0">
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{
                    background: i === 0 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                    border: i === 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Icon
                    size={10}
                    style={{ color: i === 0 ? "#f59e0b" : "rgba(255,255,255,0.3)" }}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: i === 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight
                    size={11}
                    className="mx-1 shrink-0"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-2 px-6 text-xs text-white/30">
          Select a category — we will pre-fill the event type and take you through the setup.
        </p>

        {/* ── divider ── */}
        <div
          className="mx-6 mt-4"
          style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
        />

        {/* ── subcategory grid ── */}
        <div className="grid grid-cols-4 gap-3 p-6 pt-5">
          {ENTERTAINMENT_SUBS.map((sub, i) => (
            <SubCard
              key={sub.id}
              sub={sub}
              index={i}
              onClick={() => handleSelect(sub)}
            />
          ))}
        </div>

        {/* ── bottom note ── */}
        <div
          className="mx-6 mb-5 flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Zap size={13} style={{ color: "#f59e0b" }} className="shrink-0" />
          <p className="text-[11px] text-white/35">
            After creating your event you will pick a template and open the designer — then add ticket tiers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Edit Ticket Modal ───────────────────────────────────── */
function EditTicketModal({ ticket, onClose, onSaved }) {
  const { updateTicket } = useTicketStore();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm]     = useState({
    name:           ticket.name          ?? "",
    price:          ticket.price         ?? 0,
    kind:           ticket.kind          ?? "PAID",
    quantity_total: ticket.quantity_total != null ? String(ticket.quantity_total) : "",
    is_active:      ticket.is_active     ?? true,
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name:           form.name.trim(),
        price:          form.kind === "FREE" ? 0 : Number(form.price),
        kind:           form.kind,
        quantity_total: form.quantity_total === "" ? null : Number(form.quantity_total),
        is_active:      form.is_active,
      };
      const updated = await updateTicket(ticket.id, payload);
      onSaved(updated);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg,#12121e 0%,#0d0d18 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#6366f180,transparent)" }} />

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Pencil size={9} style={{ color: "#6366f1" }} />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-400">Edit Ticket</p>
            </div>
            <p className="mt-0.5 text-sm font-bold text-white/90 truncate max-w-56">{ticket.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="mx-5" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        <div className="p-5 space-y-4">
          {/* name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Ticket name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* kind */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Ticket kind</label>
            <div className="grid grid-cols-3 gap-2">
              {["PAID", "FREE", "DONATION"].map((k) => (
                <button
                  key={k}
                  onClick={() => set("kind", k)}
                  className="rounded-xl py-2 text-xs font-bold transition-all"
                  style={
                    form.kind === k
                      ? { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)", color: "#818cf8" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          {/* price + qty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Price (USD)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.kind === "FREE" ? 0 : form.price}
                disabled={form.kind === "FREE"}
                onChange={(e) => set("price", e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition disabled:opacity-40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">Qty (blank=∞)</label>
              <input
                type="number" min="1" placeholder="∞"
                value={form.quantity_total}
                onChange={(e) => set("quantity_total", e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>

          {/* active toggle */}
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div>
              <p className="text-sm font-semibold text-white/80">Active</p>
              <p className="text-[10px] text-white/30">Ticket is available for purchase</p>
            </div>
            <button
              onClick={() => set("is_active", !form.is_active)}
              className="relative flex h-6 w-11 items-center rounded-full transition-all duration-300"
              style={{ background: form.is_active ? "#6366f1" : "rgba(255,255,255,0.1)" }}
            >
              <span
                className="absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: form.is_active ? "calc(100% - 20px)" : 4 }}
              />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={13} className="shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 6px 20px #6366f130" }}
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><Save size={13} /> Save changes</>
              )}
            </button>
          </div>
        </div>
        <div className="h-2" />
      </motion.div>
    </div>
  );
}

/* ── Delete Confirm Modal ────────────────────────────────── */
function DeleteConfirmModal({ ticket, onClose, onConfirm, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg,#1a0a0a 0%,#120808 100%)",
          border: "1px solid rgba(239,68,68,0.15)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#ef444480,transparent)" }} />
        <div className="p-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <Trash2 size={22} className="text-red-400" />
          </div>
          <p className="text-base font-bold text-white/90">Delete ticket type?</p>
          <p className="mt-1.5 text-sm text-white/40 leading-relaxed">
            <span className="font-semibold text-white/60">{ticket.name}</span> will be permanently removed.
            {(ticket.quantity_sold ?? 0) > 0 && (
              <span className="mt-1 block text-yellow-400/80">
                Warning: {ticket.quantity_sold} ticket{ticket.quantity_sold !== 1 ? "s" : ""} already sold.
              </span>
            )}
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 6px 20px #ef444430" }}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><Trash2 size={13} /> Delete</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Ticket type row (inside expanded card) ──────────────── */
function TicketRow({ ticket, accent, onEdit, onDelete }) {
  const kindStyle = KIND_COLORS[ticket.kind] ?? KIND_COLORS.PAID;
  const sold  = ticket.quantity_sold  ?? 0;
  const total = ticket.quantity_total;
  const pct   = total ? Math.min(100, Math.round((sold / total) * 100)) : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3.5 py-3"
      style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}
    >
      <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: ticket.is_active ? accent.from : "#d1d5db" }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-bold text-gray-800">{ticket.name}</span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{ background: kindStyle.bg, color: kindStyle.text }}
          >
            {KIND_LABELS[ticket.kind]}
          </span>
          {!ticket.is_active && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-400">
              Inactive
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">
            {ticket.kind === "FREE" ? "Free" : fmtPrice(ticket.price, ticket.currency)}
          </span>
          <span className="text-[10px] text-gray-400">
            {sold} sold{total != null ? ` / ${total}` : ""}
          </span>
          {pct !== null && (
            <div className="h-1 w-14 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent.from }} />
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onEdit(ticket)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-500"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(ticket)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Event ticket card ───────────────────────────────────── */
function EventTicketCard({ event, index, onManage, onRefresh }) {
  const { updateTicket, deleteTicket } = useTicketStore();
  const accent   = getAccentForEvent(event);
  const sub      = getSubForEvent(event);
  const upcoming = isUpcoming(event.starts_at_local);
  const dateStr  = fmtDate(event.starts_at_local);

  const hasTickets = (event.ticket_count ?? 0) > 0;

  const [expanded, setExpanded]         = useState(hasTickets);
  const [tickets, setTickets]           = useState([]);
  const [loadingInner, setLoadingInner] = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const didLoad = useRef(false);

  const loadTickets = useCallback(async () => {
    setLoadingInner(true);
    try {
      const res = await api.get(`/ticket-types/events/${event.id}/tickets`);
      setTickets(res.data.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingInner(false);
    }
  }, [event.id]);

  /* Auto-load tickets when the card has ticket types */
  useEffect(() => {
    if (hasTickets && !didLoad.current) {
      didLoad.current = true;
      loadTickets();
    }
  }, [hasTickets, loadTickets]);

  const handleToggle = useCallback(() => {
    if (!expanded && tickets.length === 0) loadTickets();
    setExpanded((v) => !v);
  }, [expanded, tickets.length, loadTickets]);

  const handleSaved = useCallback((updated) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteTicket, onRefresh]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100"
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${accent.from},${accent.to})` }} />

        <div className="p-5">
          {/* header — fully clickable, navigates to ticket detail page */}
          <button
            onClick={() => onManage(event.id)}
            className="flex w-full items-start gap-3 mb-4 text-left group/header"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl leading-none transition-transform duration-200 group-hover/header:scale-105"
              style={{ background: `linear-gradient(135deg,${accent.from}18,${accent.to}10)`, border: `1px solid ${accent.from}30` }}
            >
              {sub?.icon ?? "🎟️"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-gray-900 group-hover/header:text-indigo-700 transition-colors">
                {event.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: `${accent.from}15`, color: accent.from }}
                >
                  {sub?.label ?? event.event_type ?? "Ticketed"}
                </span>
                {dateStr && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar size={9} /> {dateStr}
                  </span>
                )}
                <span
                  className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={upcoming ? { background: "#dcfce7", color: "#16a34a" } : { background: "#f3f4f6", color: "#6b7280" }}
                >
                  {upcoming ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                  {upcoming ? "Upcoming" : "Past"}
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="shrink-0 mt-1 text-gray-300 group-hover/header:text-indigo-500 transition-colors" />
          </button>

          {/* metrics */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
              <div className="flex items-center gap-1.5">
                <Tag size={11} className="text-gray-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Ticket types</span>
              </div>
              <p className="text-xl font-black text-gray-900">{event.ticket_count ?? 0}</p>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
              <div className="flex items-center gap-1.5">
                <Users size={11} className="text-gray-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tickets sold</span>
              </div>
              <p className="text-xl font-black text-gray-900">{(event.total_sold ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {/* expanded ticket list */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden mb-4"
              >
                {loadingInner ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl py-5" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
                    <Ticket size={14} className="text-gray-300" />
                    <p className="text-xs text-gray-400">No ticket types yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <TicketRow
                        key={t.id}
                        ticket={t}
                        accent={accent}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* action row */}
          {(event.ticket_count ?? 0) === 0 ? (
            /* No tickets yet — prompt to add */
            <button
              onClick={() => onManage(event.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-bold transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ borderColor: accent.from, color: accent.from, background: `${accent.from}08` }}
            >
              <Plus size={14} />
              Add ticket types
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleToggle}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50 active:scale-[0.97]"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? "Hide" : "Tickets"}
              </button>
              <button
                onClick={() => onManage(event.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg,${accent.from},${accent.to})`, color: "#fff", boxShadow: `0 4px 14px ${accent.glow}30` }}
              >
                <BarChart3 size={14} />
                Manage
                <ChevronRight size={13} className="opacity-70" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {editTarget && (
          <EditTicketModal
            ticket={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={handleSaved}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            ticket={deleteTarget}
            loading={deleting}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Filter bar ──────────────────────────────────────────── */
function FilterBar({ search, onSearch, sort, onSort, count }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <TrendingUp size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        {count > 0 && (
          <span className="hidden sm:flex items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-600 border border-amber-100">
            🎟️ {count}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ hasFilter, onClear, onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center"
    >
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg,#fef3c718,#f59e0b10)", border: "1px solid #f59e0b28" }}
      >
        <Ticket size={28} className="text-amber-400" />
      </div>
      {hasFilter ? (
        <>
          <p className="text-base font-bold text-gray-800">No events match your search</p>
          <p className="mt-1.5 text-sm text-gray-400">Try a different search term.</p>
          <button
            onClick={onClear}
            className="mt-5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Clear search
          </button>
        </>
      ) : (
        <>
          <p className="text-base font-bold text-gray-800">No ticketed events yet</p>
          <p className="mt-1.5 max-w-xs text-sm text-gray-400 leading-relaxed">
            Create your first Ticketed &amp; Entertainment event — Concerts, Festivals, Live Shows, and more.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreate}
            className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 8px 24px #f59e0b40" }}
          >
            <Plus size={15} /> Create your first ticket
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function TicketsPage() {
  const router = useRouter();

  const [ticketedEvents, setTicketedEvents] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [showOverlay, setShowOverlay]       = useState(false);
  const [search, setSearch]                 = useState("");
  const [sort, setSort]                     = useState("date_asc");

  const loadTicketedEvents = useCallback(() => {
    setLoadingTickets(true);
    setFetchError(null);
    api
      .get("/ticket-types/events-with-tickets")
      .then((r) => {
        const all = r.data.events ?? [];
        setTicketedEvents(
          all.filter((e) =>
            ENTERTAINMENT_EVENT_TYPES.has(String(e.event_type ?? "").toUpperCase())
          )
        );
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Failed to load events";
        console.error("[tickets] load error:", err?.response?.status, msg);
        setFetchError(msg);
        setTicketedEvents([]);
      })
      .finally(() => setLoadingTickets(false));
  }, []);

  useEffect(() => {
    loadTicketedEvents();
  }, [loadTicketedEvents]);

  const navigate = useCallback(
    (eventId) => router.push(`/events/${eventId}/tickets`),
    [router]
  );

  /* aggregate stats */
  const stats = useMemo(() => ({
    totalEvents: ticketedEvents.length,
    totalTypes:  ticketedEvents.reduce((s, e) => s + (e.ticket_count ?? 0), 0),
    totalSold:   ticketedEvents.reduce((s, e) => s + (e.total_sold   ?? 0), 0),
  }), [ticketedEvents]);

  /* filter + sort */
  const filtered = useMemo(() => {
    let list = [...ticketedEvents];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sort) {
        case "date_desc":  return new Date(b.starts_at_local ?? 0) - new Date(a.starts_at_local ?? 0);
        case "sold_desc":  return (b.total_sold   ?? 0) - (a.total_sold   ?? 0);
        case "types_desc": return (b.ticket_count ?? 0) - (a.ticket_count ?? 0);
        case "name_asc":   return (a.title ?? "").localeCompare(b.title ?? "");
        default:           return new Date(a.starts_at_local ?? 0) - new Date(b.starts_at_local ?? 0);
      }
    });
    return list;
  }, [ticketedEvents, search, sort]);

  const hasFilter = Boolean(search.trim());

  return (
    <div className="space-y-7">
      {/* ── header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} style={{ color: "#f59e0b" }} />
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">
              Ticketed &amp; Entertainment
            </p>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Ticket Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage tickets for your entertainment events — edit, delete, and track sales.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowOverlay(true)}
          className="flex shrink-0 items-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-all"
          style={{
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            boxShadow: "0 6px 20px #f59e0b35",
          }}
        >
          <Plus size={15} />
          New Ticket
        </motion.button>
      </motion.div>

      {/* ── stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TicketStatCard icon={Ticket} label="Ticketed events"   value={stats.totalEvents}                   accent="#f59e0b" delay={0.05} loading={loadingTickets} />
        <TicketStatCard icon={Tag}    label="Total ticket types" value={stats.totalTypes}                   accent="#6366f1" delay={0.1}  loading={loadingTickets} />
        <TicketStatCard icon={Users}  label="Total tickets sold" value={stats.totalSold.toLocaleString()}   accent="#0ea5e9" delay={0.15} loading={loadingTickets} />
      </div>

      {/* ── error banner ── */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Could not load ticketed events</p>
              <p className="text-xs text-red-500">{fetchError}</p>
            </div>
          </div>
          <button
            onClick={loadTicketedEvents}
            className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── filter bar ── */}
      {!loadingTickets && ticketedEvents.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          sort={sort}
          onSort={setSort}
          count={filtered.length}
        />
      )}

      {/* ── grid ── */}
      {loadingTickets ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClear={() => setSearch("")}
          onCreate={() => setShowOverlay(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <EventTicketCard
              key={event.id}
              event={event}
              index={i}
              onManage={navigate}
              onRefresh={loadTicketedEvents}
            />
          ))}
        </div>
      )}

      {/* ── tip ── */}
      {!loadingTickets && ticketedEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3.5"
        >
          <Zap size={16} className="shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">
            <span className="font-bold">Tip:</span> Click{" "}
            <span className="font-semibold">Tickets</span> on a card to view, edit, or delete individual ticket types inline. Click{" "}
            <span className="font-semibold">Manage</span> for full orders and revenue stats.
          </p>
        </motion.div>
      )}

      {/* ── create overlay ── */}
      <AnimatePresence>
        {showOverlay && (
          <CreateTicketOverlay onClose={() => setShowOverlay(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
