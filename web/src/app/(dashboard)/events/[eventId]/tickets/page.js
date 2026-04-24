"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, Plus, Trash2, Pencil, BarChart3, ShoppingBag,
  DollarSign, Users, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, X, TrendingUp, AlertCircle,
  Sparkles, ArrowRight, Zap,
} from "lucide-react";
import { useTicketStore } from "@/store/ticket.store";
import { useEventStore } from "@/store/event.store";
import { EVENT_CATEGORIES } from "@/config/event-categories";

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }) : "—";

const ENTERTAINMENT_SUBS = EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

function getSubForEvent(eventType) {
  return ENTERTAINMENT_SUBS.find(
    (s) => s.eventType.toUpperCase() === String(eventType ?? "").toUpperCase()
  ) ?? null;
}

/* ── Setup screen (first-time, no tickets yet) ───────────── */
function SetupScreen({ event, onStartFresh }) {
  const sub = getSubForEvent(event?.event_type);
  const icon = sub?.icon ?? "🎟️";
  const typeName = sub?.label ?? (event?.event_type ?? "Event");

  const options = [
    {
      icon: <Zap size={20} style={{ color: "#f59e0b" }} />,
      label: "Start from scratch",
      description: "Create ticket tiers manually — General Admission, VIP, Early Bird and more.",
      accent: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b18, #ef444408)",
      border: "rgba(245,158,11,0.2)",
      onClick: onStartFresh,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16"
    >
      {/* event badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="flex items-center gap-2 rounded-full px-4 py-2 mb-8"
        style={{
          background: "linear-gradient(135deg, #1a1a2e, #12121e)",
          border: "1px solid rgba(245,158,11,0.2)",
          boxShadow: "0 0 30px rgba(245,158,11,0.08)",
        }}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-bold text-white/80">{event?.title ?? typeName}</span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
          style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
        >
          Ticketed
        </span>
      </motion.div>

      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: "#f59e0b" }} />
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-500">
            Ticket Setup
          </p>
        </div>
        <h2 className="text-3xl font-black text-gray-900 leading-tight">
          How do you want to<br />set up?
        </h2>
        <p className="mt-3 text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          Configure your ticket tiers, pricing, and availability for{" "}
          <span className="font-semibold text-gray-600">{event?.title ?? "this event"}</span>.
        </p>
      </motion.div>

      {/* option cards */}
      <div className="w-full max-w-sm space-y-3">
        {options.map((opt, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={opt.onClick}
            className="group w-full flex items-center gap-4 rounded-3xl p-5 text-left transition-shadow hover:shadow-lg"
            style={{
              background: opt.gradient,
              border: `1.5px solid ${opt.border}`,
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: `${opt.accent}12`,
                border: `1px solid ${opt.accent}28`,
                boxShadow: `0 0 16px ${opt.accent}18`,
              }}
            >
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{opt.label}</p>
              <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{opt.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: opt.accent }}
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: { bg: "bg-indigo-50",  icon: "text-indigo-600",  ring: "ring-indigo-100"  },
    green:  { bg: "bg-green-50",   icon: "text-green-600",   ring: "ring-green-100"   },
    amber:  { bg: "bg-amber-50",   icon: "text-amber-600",   ring: "ring-amber-100"   },
    violet: { bg: "bg-violet-50",  icon: "text-violet-600",  ring: "ring-violet-100"  },
  }[color];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4 ${colors.bg} ${colors.ring}`}>
        <Icon size={18} className={colors.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Ticket type form modal ─────────────────────────────── */
function TicketFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name:           initial?.name          ?? "",
    description:    initial?.description   ?? "",
    price:          initial?.price         ?? "",
    quantity_total: initial?.quantity_total ?? "",
    currency:       initial?.currency      ?? "USD",
    kind:           initial?.kind          ?? "PAID",
    sale_starts_at: initial?.sale_starts_at ? initial.sale_starts_at.slice(0, 16) : "",
    sale_ends_at:   initial?.sale_ends_at   ? initial.sale_ends_at.slice(0, 16)   : "",
    is_active:      initial?.is_active     ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        price:          form.price         === "" ? 0    : Number(form.price),
        quantity_total: form.quantity_total === "" ? null : Number(form.quantity_total),
        sale_starts_at: form.sale_starts_at || null,
        sale_ends_at:   form.sale_ends_at   || null,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to save ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {initial ? "Edit ticket type" : "New ticket type"}
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Type</label>
              <div className="mt-1.5 flex gap-2">
                {["PAID", "FREE", "DONATION"].map((k) => (
                  <button key={k} type="button"
                    onClick={() => set("kind", k)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      form.kind === k
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. General Admission"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                placeholder="Optional details about this ticket…"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Price</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                  disabled={form.kind === "FREE"}
                  className="w-full rounded-xl border border-gray-200 pl-7 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 bg-white"
              >
                {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Quantity available{" "}
                <span className="text-gray-400 normal-case font-normal">(leave blank for unlimited)</span>
              </label>
              <input
                type="number" min="1"
                value={form.quantity_total}
                onChange={(e) => set("quantity_total", e.target.value)}
                placeholder="Unlimited"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sale starts</label>
              <input
                type="datetime-local"
                value={form.sale_starts_at}
                onChange={(e) => set("sale_starts_at", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sale ends</label>
              <input
                type="datetime-local"
                value={form.sale_ends_at}
                onChange={(e) => set("sale_ends_at", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Active</p>
                <p className="text-[11px] text-gray-400">Visible to buyers on the event page</p>
              </div>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Create ticket"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Ticket type row ─────────────────────────────────────── */
function TicketRow({ ticket, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);
  const sold  = ticket.quantity_sold  ?? 0;
  const total = ticket.quantity_total;
  const pct   = total ? Math.min((sold / total) * 100, 100) : 0;

  const kindColor = {
    PAID:     "bg-indigo-50 text-indigo-700",
    FREE:     "bg-green-50 text-green-700",
    DONATION: "bg-amber-50 text-amber-700",
  }[ticket.kind] ?? "bg-gray-100 text-gray-600";

  async function handleDelete() {
    if (!confirm(`Delete "${ticket.name}"?`)) return;
    setDeleting(true);
    try { await onDelete(ticket.id); } finally { setDeleting(false); }
  }

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${kindColor}`}>
              {ticket.kind}
            </span>
            {!ticket.is_active && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">{ticket.name}</p>
          {ticket.description && (
            <p className="text-[12px] text-gray-400 leading-relaxed mt-0.5">{ticket.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-gray-900">
            {ticket.kind === "FREE" ? "Free" : fmt(ticket.price, ticket.currency)}
          </p>
          {ticket.currency && ticket.kind === "PAID" && (
            <p className="text-[10px] text-gray-400">{ticket.currency}</p>
          )}
        </div>
      </div>

      {total != null && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-gray-400">{sold} sold</p>
            <p className="text-[11px] text-gray-400">{total - sold} left</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 100 ? "#EF4444" : pct >= 75 ? "#F59E0B" : "#6366F1",
              }}
            />
          </div>
        </div>
      )}

      {(ticket.sale_starts_at || ticket.sale_ends_at) && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Clock size={11} />
          {ticket.sale_starts_at ? fmtDate(ticket.sale_starts_at) : "Now"}
          {" → "}
          {ticket.sale_ends_at ? fmtDate(ticket.sale_ends_at) : "Event end"}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onToggle(ticket)}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
            ticket.is_active
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {ticket.is_active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onEdit(ticket)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Order helpers ───────────────────────────────────────── */
function OrderStatusBadge({ status }) {
  const map = {
    PAID:     "bg-green-50 text-green-700",
    PENDING:  "bg-amber-50 text-amber-700",
    FAILED:   "bg-red-50 text-red-600",
    REFUNDED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{order.buyer_name}</p>
          <p className="text-[11px] text-gray-400 truncate">{order.buyer_email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <OrderStatusBadge status={order.payment_status} />
          <p className="text-sm font-bold text-gray-900">{fmt(order.total, order.currency)}</p>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 py-4 space-y-2">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-gray-500 mb-3">
                {order.buyer_phone && <span>Phone: {order.buyer_phone}</span>}
                <span>Order: {fmtDateTime(order.created_at)}</span>
                {order.paid_at && <span>Paid: {fmtDateTime(order.paid_at)}</span>}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Items</p>
              {(order.items ?? []).map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2">
                  <span className="text-[12px] font-medium text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="text-[12px] font-bold text-gray-900">{fmt(item.line_total, order.currency)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function TicketsPage() {
  const { eventId } = useParams();
  const {
    tickets, orders, stats, loading,
    fetchTickets, createTicket, updateTicket, deleteTicket, fetchStats, fetchOrders,
  } = useTicketStore();
  const event = useEventStore((s) => s.events.find((e) => e.id === eventId));

  const [tab, setTab]           = useState("types");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);

  useEffect(() => {
    fetchTickets(eventId);
    fetchStats(eventId);
    fetchOrders(eventId);
  }, [eventId]);

  const handleSave = useCallback(async (payload) => {
    if (editing) await updateTicket(editing.id, payload);
    else         await createTicket(eventId, payload);
  }, [editing, eventId]);

  const handleDelete = useCallback((id) => deleteTicket(id), []);
  const handleToggle = useCallback((ticket) => updateTicket(ticket.id, { is_active: !ticket.is_active }), []);

  const openCreate = useCallback(() => { setEditing(null); setFormOpen(true); }, []);

  const tabs = [
    { id: "types",  label: "Ticket Types", icon: Ticket      },
    { id: "orders", label: "Orders",       icon: ShoppingBag },
    { id: "stats",  label: "Stats",        icon: BarChart3   },
  ];

  /* ── show setup screen when no tickets exist ── */
  const showSetup = !loading && tickets.length === 0 && tab === "types";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage ticket types, track orders &amp; revenue</p>
        </div>
        {!showSetup && tab === "types" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition active:scale-95"
          >
            <Plus size={15} /> New ticket type
          </motion.button>
        )}
      </div>

      {/* Stat cards — only when tickets exist */}
      {stats && !showSetup && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={DollarSign}  label="Gross Revenue"   value={fmt(stats.gross_revenue, stats.currency)}   color="green"  />
          <StatCard icon={ShoppingBag} label="Paid Orders"     value={stats.paid_orders}  sub={`${stats.total_orders} total`}     color="indigo" />
          <StatCard icon={Users}       label="Tickets Issued"  value={stats.total_issued} sub={`${stats.checked_in} checked in`}  color="violet" />
          <StatCard icon={TrendingUp}  label="Pending Rev."    value={fmt(stats.pending_revenue, stats.currency)} color="amber"  />
        </div>
      )}

      {/* Tabs — only when tickets exist */}
      {!showSetup && (
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-max rounded-2xl border border-[#e5e7eb] bg-white p-1.5 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-[#111827] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showSetup ? "setup" : tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── SETUP SCREEN ── */}
          {showSetup && (
            <SetupScreen event={event} onStartFresh={openCreate} />
          )}

          {/* ── TICKET TYPES ── */}
          {!showSetup && tab === "types" && (
            <div>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((t) => (
                    <TicketRow
                      key={t.id}
                      ticket={t}
                      onEdit={(t) => { setEditing(t); setFormOpen(true); }}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                  <button
                    onClick={openCreate}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-10 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition"
                  >
                    <Plus size={20} />
                    <span className="text-sm font-medium">Add ticket type</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
                  <ShoppingBag size={28} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">No orders yet</p>
                  <p className="text-xs text-gray-400">Orders will appear here once guests purchase tickets</p>
                </div>
              ) : (
                orders.map((o) => <OrderRow key={o.id} order={o} />)
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {tab === "stats" && stats && (
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 space-y-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">By ticket type</p>
                <div className="space-y-3">
                  {stats.ticket_types.map((t) => {
                    const pct = t.quantity_total
                      ? Math.min(((t.quantity_sold ?? 0) / t.quantity_total) * 100, 100)
                      : 0;
                    return (
                      <div key={t.id} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                            <p className="text-xs text-gray-500 shrink-0 ml-2">
                              {t.quantity_sold ?? 0}{t.quantity_total ? ` / ${t.quantity_total}` : " sold"}
                            </p>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <p className="w-20 shrink-0 text-right text-sm font-bold text-gray-900">
                          {t.kind === "FREE" ? "Free" : fmt(t.price, t.currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{stats.active_tickets}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Active passes</p>
                </div>
                <div className="text-center">
                  <CheckCircle2 size={20} className="mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-black text-gray-900">{stats.checked_in}</p>
                  <p className="text-[11px] text-gray-400">Checked in</p>
                </div>
                <div className="text-center">
                  <XCircle size={20} className="mx-auto text-red-400 mb-1" />
                  <p className="text-2xl font-black text-gray-900">{stats.revoked}</p>
                  <p className="text-[11px] text-gray-400">Revoked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{stats.total_issued}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Total issued</p>
                </div>
              </div>
            </div>
          )}

          {tab === "stats" && !stats && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white py-20">
              <BarChart3 size={28} className="text-gray-300" />
              <p className="text-sm text-gray-400">Loading stats…</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <TicketFormModal
            initial={editing}
            onSave={handleSave}
            onClose={() => { setFormOpen(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
