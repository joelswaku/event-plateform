
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Plus,
  Trash2,
  Pencil,
  BarChart3,
  ShoppingBag,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Zap,
  ChevronLeft,
  Palette,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
  Tag,
  Hash,
  Infinity,
  ArrowUpRight,
  Package,
  CircleDot,
} from "lucide-react";
import { useTicketStore } from "@/store/ticket.store";
import { useEventStore } from "@/store/event.store";
import { EVENT_CATEGORIES } from "@/config/event-categories";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const ENTERTAINMENT_SUBS =
  EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

function getSubForEvent(eventType) {
  return (
    ENTERTAINMENT_SUBS.find(
      (s) => s.eventType?.toUpperCase() === String(eventType ?? "").toUpperCase()
    ) ?? null
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, colorClass, bgClass, borderClass, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border p-5 ${bgClass} ${borderClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {label}
          </p>
          <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bgClass} border ${borderClass}`}>
          <Icon size={16} className={colorClass} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Ticket Type Card ─────────────────────────────────────────────────────────

function TicketTypeCard({ ticket, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const soldPct =
    ticket.quantity_total > 0
      ? Math.min((ticket.quantity_sold / ticket.quantity_total) * 100, 100)
      : null;

  const handleDelete = async () => {
    if (!confirm(`Delete "${ticket.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDelete(ticket.id); } finally { setDeleting(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(ticket); } finally { setToggling(false); }
  };

  const isFree = ticket.kind === "FREE" || ticket.price === 0;
  const almostFull = soldPct !== null && soldPct >= 80;
  const isFull = soldPct !== null && soldPct >= 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col rounded-2xl border bg-white dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        ticket.is_active
          ? "border-gray-200 dark:border-gray-700"
          : "border-gray-100 dark:border-gray-800 opacity-60"
      }`}
    >
      {/* Top status bar */}
      <div
        className={`h-1 w-full rounded-t-2xl transition-all ${
          isFull
            ? "bg-rose-400"
            : almostFull
            ? "bg-amber-400"
            : ticket.is_active
            ? "bg-indigo-500"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg leading-none ${
                isFree
                  ? "bg-emerald-50 dark:bg-emerald-950/40"
                  : "bg-indigo-50 dark:bg-indigo-950/40"
              }`}
            >
              {isFree ? "🎁" : "🎟️"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate text-sm leading-tight">
                {ticket.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    ticket.kind === "FREE"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : ticket.kind === "DONATION"
                      ? "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                  }`}
                >
                  {ticket.kind}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="shrink-0 text-right">
            <p
              className={`text-lg font-bold tracking-tight ${
                isFree ? "text-emerald-500" : "text-gray-900 dark:text-white"
              }`}
            >
              {isFree ? "Free" : fmt(ticket.price, ticket.currency)}
            </p>
          </div>
        </div>

        {/* Capacity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {ticket.quantity_sold ?? 0} sold
              {ticket.quantity_total ? ` of ${ticket.quantity_total}` : " (unlimited)"}
            </span>
            {soldPct !== null && (
              <span
                className={`text-xs font-semibold ${
                  isFull
                    ? "text-rose-500"
                    : almostFull
                    ? "text-amber-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {isFull ? "Sold out" : almostFull ? `${soldPct.toFixed(0)}% full` : `${soldPct.toFixed(0)}%`}
              </span>
            )}
            {soldPct === null && (
              <span className="flex items-center gap-0.5 text-xs text-gray-300 dark:text-gray-600">
                <Infinity size={12} /> Unlimited
              </span>
            )}
          </div>
          {soldPct !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${soldPct}%` }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${
                  isFull ? "bg-rose-400" : almostFull ? "bg-amber-400" : "bg-indigo-500"
                }`}
              />
            </div>
          )}
        </div>

        {/* Sale dates if present */}
        {(ticket.sale_starts_at || ticket.sale_ends_at) && (
          <div className="mb-4 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <Clock size={11} />
            <span>
              {ticket.sale_starts_at ? fmtDateTime(ticket.sale_starts_at) : "Now"}
              {" → "}
              {ticket.sale_ends_at ? fmtDateTime(ticket.sale_ends_at) : "No end"}
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          {/* Toggle active */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              ticket.is_active
                ? "text-indigo-500 hover:text-indigo-600"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            {ticket.is_active ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
            {toggling ? "…" : ticket.is_active ? "Active" : "Inactive"}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(ticket)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-all"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all"
              title="Delete"
            >
              {deleting ? <span className="text-[10px]">…</span> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Ticket Card ──────────────────────────────────────────────────────────

function AddTicketCard({ onClick }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent py-10 text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-200"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-current transition-all group-hover:scale-110">
        <Plus size={18} />
      </div>
      <span className="text-sm font-medium">Add ticket type</span>
    </motion.button>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);

  const statusConfig = {
    PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
    PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
    FAILED: { label: "Failed", cls: "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400" },
    REFUNDED: { label: "Refunded", cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  };
  const sc = statusConfig[order.payment_status] ?? statusConfig.PENDING;

  const initials = (order.buyer_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-sm">
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {initials}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {order.buyer_name ?? "—"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{order.buyer_email}</p>
        </div>

        {/* Amount */}
        <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
          {fmt(order.total, order.currency)}
        </p>

        {/* Status badge */}
        <span className={`hidden sm:inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sc.cls}`}>
          {sc.label}
        </span>

        {/* Date */}
        <p className="hidden md:block shrink-0 text-xs text-gray-400 dark:text-gray-500 w-28 text-right">
          {fmtDateTime(order.created_at)}
        </p>

        {/* Chevron */}
        <div className="shrink-0 ml-1">
          {open ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3">
              {/* Meta row */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                {order.buyer_phone && <span>📞 {order.buyer_phone}</span>}
                <span>🕐 Ordered {fmtDateTime(order.created_at)}</span>
                {order.paid_at && <span>✅ Paid {fmtDateTime(order.paid_at)}</span>}
                {/* Mobile status */}
                <span className={`sm:hidden inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${sc.cls}`}>
                  {sc.label}
                </span>
              </div>

              {/* Items */}
              {(order.items ?? []).length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-gray-600">
                    Items
                  </p>
                  <div className="space-y-1.5">
                    {(order.items ?? []).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Ticket size={12} className="text-indigo-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {item.name}
                          </span>
                          <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            ×{item.quantity}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {fmt(item.line_total, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ticket Form Modal ────────────────────────────────────────────────────────

function TicketFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    kind: initial?.kind ?? "PAID",
    price: initial?.price ?? "",
    quantity_total: initial?.quantity_total != null ? String(initial.quantity_total) : "",
    description: initial?.description ?? "",
    sale_starts_at: initial?.sale_starts_at?.slice(0, 16) ?? "",
    sale_ends_at: initial?.sale_ends_at?.slice(0, 16) ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Ticket name is required.");
    if (form.kind === "PAID" && (isNaN(Number(form.price)) || Number(form.price) < 0))
      return setError("Enter a valid price.");
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: form.name.trim(),
        kind: form.kind,
        price: form.kind === "FREE" ? 0 : Number(form.price),
        quantity_total: form.quantity_total === "" ? null : Number(form.quantity_total),
        description: form.description.trim() || null,
        sale_starts_at: form.sale_starts_at || null,
        sale_ends_at: form.sale_ends_at || null,
        is_active: form.is_active,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const kindOptions = [
    { value: "PAID", label: "Paid", icon: "💳", desc: "Guests pay to attend" },
    { value: "FREE", label: "Free", icon: "🎁", desc: "No charge required" },
    { value: "DONATION", label: "Donation", icon: "💝", desc: "Pay what you want" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {initial ? "Edit ticket type" : "New ticket type"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {initial ? "Update ticket details below" : "Configure your new ticket tier"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Kind selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {kindOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("kind", opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    form.kind === opt.value
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="text-lg leading-none">{opt.icon}</span>
                  <span
                    className={`text-xs font-semibold ${
                      form.kind === opt.value
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. General Admission, VIP, Early Bird"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition"
            />
          </div>

          {/* Price */}
          {form.kind !== "FREE" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-8 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition"
                />
              </div>
            </div>
          )}

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              Capacity{" "}
              <span className="normal-case font-normal text-gray-300 dark:text-gray-600">
                (leave blank for unlimited)
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={form.quantity_total}
              onChange={(e) => set("quantity_total", e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition"
            />
          </div>

          {/* Sale window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Sale starts
              </label>
              <input
                type="datetime-local"
                value={form.sale_starts_at}
                onChange={(e) => set("sale_starts_at", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Sale ends
              </label>
              <input
                type="datetime-local"
                value={form.sale_ends_at}
                onChange={(e) => set("sale_ends_at", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Visible and purchasable by guests</p>
            </div>
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.is_active ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  form.is_active ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs text-rose-500 border border-rose-100 dark:border-rose-900/40">
              <AlertCircle size={13} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors active:scale-95"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              <>{initial ? "Save changes" : "Create ticket"}</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ event, onStartFresh }) {
  const sub = getSubForEvent(event?.event_type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[55vh] px-4 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-3xl">
        {sub?.icon ?? "🎟️"}
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Set up ticketing
      </h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed mb-8">
        Create ticket tiers for your event — General Admission, VIP, Early Bird, and more.
        Each tier can have its own price, capacity, and sale window.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onStartFresh}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors active:scale-95 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
        >
          <Plus size={15} />
          Create first ticket type
        </button>
        <Link
          href={`/events/${event?.id ?? ""}/builder`}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Palette size={14} />
          Go to builder
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats }) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart3 size={28} className="text-gray-200 dark:text-gray-700" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading stats…</p>
      </div>
    );
  }

  const totalCapacity = stats.ticket_types.reduce(
    (s, t) => s + (t.quantity_total ?? 0),
    0
  );
  const fillRate = totalCapacity > 0
    ? ((stats.total_issued / totalCapacity) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active passes", value: stats.active_tickets, icon: Ticket, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-100 dark:border-indigo-900/30" },
          { label: "Checked in", value: stats.checked_in, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-100 dark:border-emerald-900/30" },
          { label: "Total issued", value: stats.total_issued, icon: Hash, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-100 dark:border-violet-900/30" },
          { label: "Revoked", value: stats.revoked, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-100 dark:border-rose-900/30" },
        ].map((item, i) => (
          <KpiCard key={i} {...item} delay={i * 0.05} />
        ))}
      </div>

      {/* By ticket type */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">By ticket type</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sales and fill rate per tier</p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {stats.ticket_types.map((t) => {
            const pct = t.quantity_total
              ? Math.min(((t.quantity_sold ?? 0) / t.quantity_total) * 100, 100)
              : null;
            return (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          t.is_active
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                        }`}
                      >
                        {t.is_active ? "Active" : "Off"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                      {t.quantity_sold ?? 0}
                      {t.quantity_total ? ` / ${t.quantity_total}` : " sold"}
                    </p>
                  </div>
                  {pct !== null ? (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${
                          pct >= 100 ? "bg-rose-400" : pct >= 80 ? "bg-amber-400" : "bg-indigo-500"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600">
                      <Infinity size={11} /> Unlimited capacity
                    </div>
                  )}
                </div>
                <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
                  {t.kind === "FREE" ? (
                    <span className="text-emerald-500">Free</span>
                  ) : (
                    fmt(t.price, t.currency)
                  )}
                </p>
              </div>
            );
          })}
        </div>
        {fillRate !== null && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Overall fill rate:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{fillRate}%</span>
              <span className="ml-1">({stats.total_issued} of {totalCapacity} seats)</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { eventId } = useParams();
  const {
    tickets, orders, stats, loading,
    fetchTickets, createTicket, updateTicket, deleteTicket, fetchStats, fetchOrders,
  } = useTicketStore();
  const { events, fetchEvents } = useEventStore();
  const event = events.find((e) => e.id === eventId);

  const [tab, setTab]           = useState("types");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);

  useEffect(() => {
    fetchTickets(eventId);
    fetchStats(eventId);
    fetchOrders(eventId);
    if (!event) fetchEvents();
  }, [eventId]); // eslint-disable-line

  const handleSave   = useCallback(async (payload) => {
    if (editing) await updateTicket(editing.id, payload);
    else         await createTicket(eventId, payload);
  }, [editing, eventId]);

  const handleDelete = useCallback((id) => deleteTicket(id), []);
  const handleToggle = useCallback((t) => updateTicket(t.id, { is_active: !t.is_active }), []);
  const openCreate   = useCallback(() => { setEditing(null); setFormOpen(true); }, []);

  const sub       = getSubForEvent(event?.event_type);
  const showSetup = !loading && tickets.length === 0 && tab === "types";

  const tabs = [
    { id: "types",  label: "Ticket Types", icon: Ticket,      count: tickets.length },
    { id: "orders", label: "Orders",       icon: ShoppingBag, count: orders.length  },
    { id: "stats",  label: "Stats",        icon: BarChart3,   count: null           },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Back */}
          <Link
            href="/tickets"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="All events"
          >
            <ChevronLeft size={15} />
          </Link>

          {/* Event identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {sub && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <span>{sub.icon}</span> {sub.label}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Ticket size={9} /> Ticketed
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {event?.title ?? "Loading…"}
            </h1>
            {event?.starts_at_local && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <CalendarDays size={11} />
                {new Date(event.starts_at_local).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/events/${eventId}/builder`}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Palette size={13} />
            Builder
          </Link>
          {!showSetup && tab === "types" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors active:scale-95 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New ticket type</span>
              <span className="sm:hidden">New</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      {stats && !showSetup && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={DollarSign}
            label="Gross Revenue"
            value={fmt(stats.gross_revenue, stats.currency)}
            sub={`${fmt(stats.pending_revenue, stats.currency)} pending`}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-50 dark:bg-emerald-950/40"
            borderClass="border-emerald-100 dark:border-emerald-900/30"
            delay={0}
          />
          <KpiCard
            icon={ShoppingBag}
            label="Paid Orders"
            value={stats.paid_orders}
            sub={`${stats.total_orders} total`}
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-50 dark:bg-indigo-950/40"
            borderClass="border-indigo-100 dark:border-indigo-900/30"
            delay={0.05}
          />
          <KpiCard
            icon={Users}
            label="Tickets Issued"
            value={stats.total_issued}
            sub={`${stats.checked_in} checked in`}
            colorClass="text-violet-600 dark:text-violet-400"
            bgClass="bg-violet-50 dark:bg-violet-950/40"
            borderClass="border-violet-100 dark:border-violet-900/30"
            delay={0.1}
          />
          <KpiCard
            icon={TrendingUp}
            label="Pending Revenue"
            value={fmt(stats.pending_revenue, stats.currency)}
            sub="awaiting payment"
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-50 dark:bg-amber-950/40"
            borderClass="border-amber-100 dark:border-amber-900/30"
            delay={0.15}
          />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      {!showSetup && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    tab === t.id
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                        tab === t.id
                          ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile builder link */}
          <Link
            href={`/events/${eventId}/builder`}
            className="sm:hidden flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            <Palette size={12} /> Builder
          </Link>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showSetup ? "setup" : tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Setup */}
          {showSetup && <SetupScreen event={event} onStartFresh={openCreate} />}

          {/* Ticket Types */}
          {!showSetup && tab === "types" && (
            <>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((t) => (
                    <TicketTypeCard
                      key={t.id}
                      ticket={t}
                      onEdit={(t) => { setEditing(t); setFormOpen(true); }}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                  <AddTicketCard onClick={openCreate} />
                </div>
              )}
            </>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div>
              {/* Table header */}
              {orders.length > 0 && (
                <div className="hidden md:flex items-center gap-4 px-5 py-2 mb-1">
                  <div className="w-9 shrink-0" />
                  <p className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600">
                    Buyer
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600">
                    Amount
                  </p>
                  <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600 w-20 text-center">
                    Status
                  </p>
                  <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600 w-28 text-right">
                    Date
                  </p>
                  <div className="w-5 shrink-0" />
                </div>
              )}
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <ShoppingBag size={22} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No orders yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Orders appear here once guests purchase tickets
                      </p>
                    </div>
                  </div>
                ) : (
                  orders.map((o) => <OrderRow key={o.id} order={o} />)
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {tab === "stats" && <StatsTab stats={stats} />}
        </motion.div>
      </AnimatePresence>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
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
















// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Ticket, Plus, Trash2, Pencil, BarChart3, ShoppingBag,
//   DollarSign, Users, CheckCircle2, XCircle, Clock,
//   ChevronDown, ChevronUp, X, TrendingUp, AlertCircle,
//   Sparkles, ArrowRight, Zap, ChevronLeft, Palette, CalendarDays,
// } from "lucide-react";
// import { useTicketStore } from "@/store/ticket.store";
// import { useEventStore } from "@/store/event.store";
// import { EVENT_CATEGORIES } from "@/config/event-categories";

// /* ── helpers ─────────────────────────────────────────────── */
// const fmt = (n, currency = "USD") =>
//   new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n ?? 0);

// const fmtDate = (d) =>
//   d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// const fmtDateTime = (d) =>
//   d ? new Date(d).toLocaleString("en-US", {
//     month: "short", day: "numeric", year: "numeric",
//     hour: "numeric", minute: "2-digit",
//   }) : "—";

// const ENTERTAINMENT_SUBS = EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

// function getSubForEvent(eventType) {
//   return ENTERTAINMENT_SUBS.find(
//     (s) => s.eventType.toUpperCase() === String(eventType ?? "").toUpperCase()
//   ) ?? null;
// }

// /* ── Setup screen (first-time, no tickets yet) ───────────── */
// function SetupScreen({ event, onStartFresh }) {
//   const sub = getSubForEvent(event?.event_type);
//   const icon = sub?.icon ?? "🎟️";
//   const typeName = sub?.label ?? (event?.event_type ?? "Event");

//   const options = [
//     {
//       icon: <Zap size={20} style={{ color: "#f59e0b" }} />,
//       label: "Start from scratch",
//       description: "Create ticket tiers manually — General Admission, VIP, Early Bird and more.",
//       accent: "#f59e0b",
//       gradient: "linear-gradient(135deg, #f59e0b18, #ef444408)",
//       border: "rgba(245,158,11,0.2)",
//       onClick: onStartFresh,
//     },
//   ];

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 16 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
//       className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16"
//     >
//       {/* event badge */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ delay: 0.05, duration: 0.35 }}
//         className="flex items-center gap-2 rounded-full px-4 py-2 mb-8"
//         style={{
//           background: "linear-gradient(135deg, #1a1a2e, #12121e)",
//           border: "1px solid rgba(245,158,11,0.2)",
//           boxShadow: "0 0 30px rgba(245,158,11,0.08)",
//         }}
//       >
//         <span className="text-xl leading-none">{icon}</span>
//         <span className="text-sm font-bold text-white/80">{event?.title ?? typeName}</span>
//         <span
//           className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
//           style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
//         >
//           Ticketed
//         </span>
//       </motion.div>

//       {/* headline */}
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1, duration: 0.35 }}
//         className="text-center mb-10"
//       >
//         <div className="flex items-center justify-center gap-2 mb-3">
//           <Sparkles size={14} style={{ color: "#f59e0b" }} />
//           <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-500">
//             Ticket Setup
//           </p>
//         </div>
//         <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
//           How do you want to<br />set up?
//         </h2>
//         <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
//           Configure your ticket tiers, pricing, and availability for{" "}
//           <span className="font-semibold text-gray-600 dark:text-gray-300">{event?.title ?? "this event"}</span>.
//         </p>
//       </motion.div>

//       {/* option cards */}
//       <div className="w-full max-w-sm space-y-3">
//         {options.map((opt, i) => (
//           <motion.button
//             key={i}
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
//             whileHover={{ scale: 1.02, y: -2 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={opt.onClick}
//             className="group w-full flex items-center gap-4 rounded-3xl p-5 text-left transition-shadow hover:shadow-lg"
//             style={{
//               background: opt.gradient,
//               border: `1.5px solid ${opt.border}`,
//             }}
//           >
//             <div
//               className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
//               style={{
//                 background: `${opt.accent}12`,
//                 border: `1px solid ${opt.accent}28`,
//                 boxShadow: `0 0 16px ${opt.accent}18`,
//               }}
//             >
//               {opt.icon}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-bold text-gray-900 dark:text-white">{opt.label}</p>
//               <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{opt.description}</p>
//             </div>
//             <ArrowRight
//               size={16}
//               className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
//               style={{ color: opt.accent }}
//             />
//           </motion.button>
//         ))}
//       </div>
//     </motion.div>
//   );
// }

// /* ── Stat card ───────────────────────────────────────────── */
// function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
//   const colors = {
//     indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20",  icon: "text-indigo-600 dark:text-indigo-400",  ring: "ring-indigo-100 dark:ring-indigo-900/30"  },
//     green:  { bg: "bg-green-50 dark:bg-green-900/20",    icon: "text-green-600 dark:text-green-400",    ring: "ring-green-100 dark:ring-green-900/30"    },
//     amber:  { bg: "bg-amber-50 dark:bg-amber-900/20",    icon: "text-amber-600 dark:text-amber-400",    ring: "ring-amber-100 dark:ring-amber-900/30"    },
//     violet: { bg: "bg-violet-50 dark:bg-violet-900/20",  icon: "text-violet-600 dark:text-violet-400",  ring: "ring-violet-100 dark:ring-violet-900/30"  },
//   }[color];

//   return (
//     <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
//       <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4 ${colors.bg} ${colors.ring}`}>
//         <Icon size={18} className={colors.icon} />
//       </div>
//       <div className="min-w-0">
//         <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
//         <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
//         {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
//       </div>
//     </div>
//   );
// }

// /* ── Ticket type form modal ─────────────────────────────── */
// function TicketFormModal({ initial, onSave, onClose }) {
//   const [form, setForm] = useState({
//     name:           initial?.name          ?? "",
//     description:    initial?.description   ?? "",
//     price:          initial?.price         ?? "",
//     quantity_total: initial?.quantity_total ?? "",
//     currency:       initial?.currency      ?? "USD",
//     kind:           initial?.kind          ?? "PAID",
//     sale_starts_at: initial?.sale_starts_at ? initial.sale_starts_at.slice(0, 16) : "",
//     sale_ends_at:   initial?.sale_ends_at   ? initial.sale_ends_at.slice(0, 16)   : "",
//     is_active:      initial?.is_active     ?? true,
//   });
//   const [saving, setSaving] = useState(false);
//   const [error,  setError]  = useState("");

//   const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

//   async function handleSubmit(e) {
//     e.preventDefault();
//     if (!form.name.trim()) { setError("Name is required"); return; }
//     setSaving(true);
//     setError("");
//     try {
//       await onSave({
//         ...form,
//         price:          form.price         === "" ? 0    : Number(form.price),
//         quantity_total: form.quantity_total === "" ? null : Number(form.quantity_total),
//         sale_starts_at: form.sale_starts_at || null,
//         sale_ends_at:   form.sale_ends_at   || null,
//       });
//       onClose();
//     } catch (err) {
//       setError(err?.response?.data?.message ?? "Failed to save ticket");
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: 40 }}
//         className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
//       >
//         <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
//           <h2 className="text-base font-bold text-gray-900 dark:text-white">
//             {initial ? "Edit ticket type" : "New ticket type"}
//           </h2>
//           <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500">
//             <X size={18} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
//           {error && (
//             <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
//               <AlertCircle size={15} /> {error}
//             </div>
//           )}

//           <div className="grid grid-cols-2 gap-3">
//             <div className="col-span-2">
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</label>
//               <div className="mt-1.5 flex gap-2">
//                 {["PAID", "FREE", "DONATION"].map((k) => (
//                   <button key={k} type="button"
//                     onClick={() => set("kind", k)}
//                     className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
//                       form.kind === k
//                         ? "bg-indigo-600 text-white shadow-sm"
//                         : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
//                     }`}
//                   >
//                     {k}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="col-span-2">
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Name *</label>
//               <input
//                 value={form.name}
//                 onChange={(e) => set("name", e.target.value)}
//                 placeholder="e.g. General Admission"
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
//                 required
//               />
//             </div>

//             <div className="col-span-2">
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</label>
//               <textarea
//                 value={form.description}
//                 onChange={(e) => set("description", e.target.value)}
//                 rows={2}
//                 placeholder="Optional details about this ticket…"
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
//               />
//             </div>

//             <div>
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Price</label>
//               <div className="relative mt-1.5">
//                 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">$</span>
//                 <input
//                   type="number" min="0" step="0.01"
//                   value={form.price}
//                   onChange={(e) => set("price", e.target.value)}
//                   placeholder="0.00"
//                   disabled={form.kind === "FREE"}
//                   className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Currency</label>
//               <select
//                 value={form.currency}
//                 onChange={(e) => set("currency", e.target.value)}
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400"
//               >
//                 {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
//                   <option key={c}>{c}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="col-span-2">
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
//                 Quantity available{" "}
//                 <span className="text-gray-400 dark:text-gray-500 normal-case font-normal">(leave blank for unlimited)</span>
//               </label>
//               <input
//                 type="number" min="1"
//                 value={form.quantity_total}
//                 onChange={(e) => set("quantity_total", e.target.value)}
//                 placeholder="Unlimited"
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
//               />
//             </div>

//             <div>
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sale starts</label>
//               <input
//                 type="datetime-local"
//                 value={form.sale_starts_at}
//                 onChange={(e) => set("sale_starts_at", e.target.value)}
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400"
//               />
//             </div>
//             <div>
//               <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sale ends</label>
//               <input
//                 type="datetime-local"
//                 value={form.sale_ends_at}
//                 onChange={(e) => set("sale_ends_at", e.target.value)}
//                 className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400"
//               />
//             </div>

//             <div className="col-span-2 flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3">
//               <div>
//                 <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
//                 <p className="text-[11px] text-gray-400 dark:text-gray-500">Visible to buyers on the event page</p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => set("is_active", !form.is_active)}
//                 className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"}`}
//               >
//                 <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
//               </button>
//             </div>
//           </div>
//         </form>

//         <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
//           <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={saving}
//             className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
//           >
//             {saving ? "Saving…" : initial ? "Save changes" : "Create ticket"}
//           </button>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// /* ── Ticket type row ─────────────────────────────────────── */
// function TicketRow({ ticket, onEdit, onDelete, onToggle }) {
//   const [deleting, setDeleting] = useState(false);
//   const sold  = ticket.quantity_sold  ?? 0;
//   const total = ticket.quantity_total;
//   const pct   = total ? Math.min((sold / total) * 100, 100) : 0;

//   const kindColor = {
//     PAID:     "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300",
//     FREE:     "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
//     DONATION: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
//   }[ticket.kind] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";

//   async function handleDelete() {
//     if (!confirm(`Delete "${ticket.name}"?`)) return;
//     setDeleting(true);
//     try { await onDelete(ticket.id); } finally { setDeleting(false); }
//   }

//   return (
//     <div className="group flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm">
//       <div className="flex items-start justify-between gap-3">
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${kindColor}`}>
//               {ticket.kind}
//             </span>
//             {!ticket.is_active && (
//               <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
//                 Inactive
//               </span>
//             )}
//           </div>
//           <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">{ticket.name}</p>
//           {ticket.description && (
//             <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-relaxed mt-0.5">{ticket.description}</p>
//           )}
//         </div>
//         <div className="shrink-0 text-right">
//           <p className="text-lg font-bold text-gray-900 dark:text-white">
//             {ticket.kind === "FREE" ? "Free" : fmt(ticket.price, ticket.currency)}
//           </p>
//           {ticket.currency && ticket.kind === "PAID" && (
//             <p className="text-[10px] text-gray-400 dark:text-gray-500">{ticket.currency}</p>
//           )}
//         </div>
//       </div>

//       {total != null && (
//         <div>
//           <div className="flex items-center justify-between mb-1.5">
//             <p className="text-[11px] text-gray-400 dark:text-gray-500">{sold} sold</p>
//             <p className="text-[11px] text-gray-400 dark:text-gray-500">{total - sold} left</p>
//           </div>
//           <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
//             <div
//               className="h-full rounded-full transition-all"
//               style={{
//                 width: `${pct}%`,
//                 background: pct >= 100 ? "#EF4444" : pct >= 75 ? "#F59E0B" : "#6366F1",
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {(ticket.sale_starts_at || ticket.sale_ends_at) && (
//         <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
//           <Clock size={11} />
//           {ticket.sale_starts_at ? fmtDate(ticket.sale_starts_at) : "Now"}
//           {" → "}
//           {ticket.sale_ends_at ? fmtDate(ticket.sale_ends_at) : "Event end"}
//         </div>
//       )}

//       <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
//         <button
//           onClick={() => onToggle(ticket)}
//           className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
//             ticket.is_active
//               ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
//               : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
//           }`}
//         >
//           {ticket.is_active ? "Deactivate" : "Activate"}
//         </button>
//         <button
//           onClick={() => onEdit(ticket)}
//           className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
//         >
//           <Pencil size={12} /> Edit
//         </button>
//         <button
//           onClick={handleDelete}
//           disabled={deleting}
//           className="flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
//         >
//           <Trash2 size={12} />
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ── Order helpers ───────────────────────────────────────── */
// function OrderStatusBadge({ status }) {
//   const map = {
//     PAID:     "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
//     PENDING:  "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
//     FAILED:   "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
//     REFUNDED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
//   };
//   return (
//     <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
//       {status}
//     </span>
//   );
// }

// function OrderRow({ order }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="rounded-2xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
//       <button
//         onClick={() => setOpen((v) => !v)}
//         className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
//       >
//         <div className="flex-1 min-w-0">
//           <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.buyer_name}</p>
//           <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{order.buyer_email}</p>
//         </div>
//         <div className="flex items-center gap-3 shrink-0">
//           <OrderStatusBadge status={order.payment_status} />
//           <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(order.total, order.currency)}</p>
//           {open ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />}
//         </div>
//       </button>
//       <AnimatePresence>
//         {open && (
//           <motion.div
//             initial={{ height: 0 }}
//             animate={{ height: "auto" }}
//             exit={{ height: 0 }}
//             className="overflow-hidden"
//           >
//             <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-2">
//               <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
//                 {order.buyer_phone && <span>Phone: {order.buyer_phone}</span>}
//                 <span>Order: {fmtDateTime(order.created_at)}</span>
//                 {order.paid_at && <span>Paid: {fmtDateTime(order.paid_at)}</span>}
//               </div>
//               <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Items</p>
//               {(order.items ?? []).map((item, i) => (
//                 <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700 px-4 py-2">
//                   <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{item.name} × {item.quantity}</span>
//                   <span className="text-[12px] font-bold text-gray-900 dark:text-white">{fmt(item.line_total, order.currency)}</span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// /* ── Main page ───────────────────────────────────────────── */
// export default function TicketsPage() {
//   const { eventId } = useParams();
//   const router = useRouter();
//   const {
//     tickets, orders, stats, loading,
//     fetchTickets, createTicket, updateTicket, deleteTicket, fetchStats, fetchOrders,
//   } = useTicketStore();
//   const { events, fetchEvents } = useEventStore();
//   const event = events.find((e) => e.id === eventId);

//   const [tab, setTab]           = useState("types");
//   const [formOpen, setFormOpen] = useState(false);
//   const [editing, setEditing]   = useState(null);

//   useEffect(() => {
//     fetchTickets(eventId);
//     fetchStats(eventId);
//     fetchOrders(eventId);
//     if (!event) fetchEvents();
//   }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

//   const handleSave = useCallback(async (payload) => {
//     if (editing) await updateTicket(editing.id, payload);
//     else         await createTicket(eventId, payload);
//   }, [editing, eventId]);

//   const handleDelete = useCallback((id) => deleteTicket(id), []);
//   const handleToggle = useCallback((ticket) => updateTicket(ticket.id, { is_active: !ticket.is_active }), []);
//   const openCreate   = useCallback(() => { setEditing(null); setFormOpen(true); }, []);

//   const sub = ENTERTAINMENT_SUBS.find(
//     (s) => s.eventType.toUpperCase() === String(event?.event_type ?? "").toUpperCase()
//   );

//   const tabs = [
//     { id: "types",  label: "Ticket Types", icon: Ticket      },
//     { id: "orders", label: "Orders",       icon: ShoppingBag },
//     { id: "stats",  label: "Stats",        icon: BarChart3   },
//   ];

//   const showSetup = !loading && tickets.length === 0 && tab === "types";

//   return (
//     <div className="space-y-5">

//       {/* ── Rich header ── */}
//       <motion.div
//         initial={{ opacity: 0, y: -6 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         {/* back + builder row */}
//         <div className="flex items-center justify-between mb-4">
//           <Link
//             href="/tickets"
//             className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
//           >
//             <ChevronLeft size={15} />
//             All events
//           </Link>

//           <Link
//             href={`/events/${eventId}/builder`}
//             className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
//             style={{
//               background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
//               boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
//             }}
//           >
//             <Palette size={14} />
//             Go to Builder
//           </Link>
//         </div>

//         {/* event identity */}
//         <div className="flex items-start gap-4">
//           <div
//             className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl leading-none"
//             style={{
//               background: "linear-gradient(135deg,#f59e0b18,#ef444410)",
//               border: "1px solid rgba(245,158,11,0.2)",
//             }}
//           >
//             {sub?.icon ?? "🎟️"}
//           </div>
//           <div className="min-w-0 flex-1">
//             <div className="flex flex-wrap items-center gap-2 mb-1">
//               <span
//                 className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
//                 style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
//               >
//                 {sub?.label ?? event?.event_type ?? "Ticketed"}
//               </span>
//               <span
//                 className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
//                 style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
//               >
//                 Ticketed
//               </span>
//             </div>
//             <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">
//               {event?.title ?? "Loading…"}
//             </h1>
//             {event?.starts_at_local && (
//               <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
//                 <CalendarDays size={11} />
//                 {new Date(event.starts_at_local).toLocaleDateString("en-US", {
//                   weekday: "short", month: "short", day: "numeric", year: "numeric",
//                 })}
//               </p>
//             )}
//           </div>

//           {/* New ticket type button (desktop) */}
//           {!showSetup && tab === "types" && (
//             <motion.button
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               onClick={openCreate}
//               className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition active:scale-95"
//             >
//               <Plus size={15} /> New ticket type
//             </motion.button>
//           )}
//         </div>

//         {/* mobile new ticket button */}
//         {!showSetup && tab === "types" && (
//           <motion.button
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             onClick={openCreate}
//             className="mt-3 sm:hidden w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
//           >
//             <Plus size={15} /> New ticket type
//           </motion.button>
//         )}
//       </motion.div>

//       {/* Stat cards — only when tickets exist */}
//       {stats && !showSetup && (
//         <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
//           <StatCard icon={DollarSign}  label="Gross Revenue"   value={fmt(stats.gross_revenue, stats.currency)}   color="green"  />
//           <StatCard icon={ShoppingBag} label="Paid Orders"     value={stats.paid_orders}  sub={`${stats.total_orders} total`}     color="indigo" />
//           <StatCard icon={Users}       label="Tickets Issued"  value={stats.total_issued} sub={`${stats.checked_in} checked in`}  color="violet" />
//           <StatCard icon={TrendingUp}  label="Pending Rev."    value={fmt(stats.pending_revenue, stats.currency)} color="amber"  />
//         </div>
//       )}

//       {/* Tabs — only when tickets exist */}
//       {!showSetup && (
//         <div className="overflow-x-auto">
//           <div className="inline-flex min-w-max rounded-2xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 gap-1">
//             {tabs.map((t) => {
//               const Icon = t.icon;
//               return (
//                 <button
//                   key={t.id}
//                   onClick={() => setTab(t.id)}
//                   className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
//                     tab === t.id
//                       ? "bg-[#111827] dark:bg-white text-white dark:text-gray-900 shadow-sm"
//                       : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
//                   }`}
//                 >
//                   <Icon size={15} /> {t.label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Content */}
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={showSetup ? "setup" : tab}
//           initial={{ opacity: 0, y: 6 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -6 }}
//           transition={{ duration: 0.2 }}
//         >
//           {/* ── SETUP SCREEN ── */}
//           {showSetup && (
//             <SetupScreen event={event} onStartFresh={openCreate} />
//           )}

//           {/* ── TICKET TYPES ── */}
//           {!showSetup && tab === "types" && (
//             <div>
//               {loading ? (
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                   {[1, 2, 3].map((i) => (
//                     <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                   {tickets.map((t) => (
//                     <TicketRow
//                       key={t.id}
//                       ticket={t}
//                       onEdit={(t) => { setEditing(t); setFormOpen(true); }}
//                       onDelete={handleDelete}
//                       onToggle={handleToggle}
//                     />
//                   ))}
//                   <button
//                     onClick={openCreate}
//                     className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-10 text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
//                   >
//                     <Plus size={20} />
//                     <span className="text-sm font-medium">Add ticket type</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ── ORDERS ── */}
//           {tab === "orders" && (
//             <div className="space-y-3">
//               {orders.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-20 text-center">
//                   <ShoppingBag size={28} className="text-gray-300 dark:text-gray-600" />
//                   <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No orders yet</p>
//                   <p className="text-xs text-gray-400 dark:text-gray-500">Orders will appear here once guests purchase tickets</p>
//                 </div>
//               ) : (
//                 orders.map((o) => <OrderRow key={o.id} order={o} />)
//               )}
//             </div>
//           )}

//           {/* ── STATS ── */}
//           {tab === "stats" && stats && (
//             <div className="rounded-3xl border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-6">
//               <div>
//                 <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">By ticket type</p>
//                 <div className="space-y-3">
//                   {stats.ticket_types.map((t) => {
//                     const pct = t.quantity_total
//                       ? Math.min(((t.quantity_sold ?? 0) / t.quantity_total) * 100, 100)
//                       : 0;
//                     return (
//                       <div key={t.id} className="flex items-center gap-4">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center justify-between mb-1">
//                             <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.name}</p>
//                             <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
//                               {t.quantity_sold ?? 0}{t.quantity_total ? ` / ${t.quantity_total}` : " sold"}
//                             </p>
//                           </div>
//                           <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
//                             <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
//                           </div>
//                         </div>
//                         <p className="w-20 shrink-0 text-right text-sm font-bold text-gray-900 dark:text-white">
//                           {t.kind === "FREE" ? "Free" : fmt(t.price, t.currency)}
//                         </p>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//               <div className="border-t border-gray-100 dark:border-gray-700 pt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
//                 <div className="text-center">
//                   <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.active_tickets}</p>
//                   <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Active passes</p>
//                 </div>
//                 <div className="text-center">
//                   <CheckCircle2 size={20} className="mx-auto text-green-500 mb-1" />
//                   <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.checked_in}</p>
//                   <p className="text-[11px] text-gray-400 dark:text-gray-500">Checked in</p>
//                 </div>
//                 <div className="text-center">
//                   <XCircle size={20} className="mx-auto text-red-400 mb-1" />
//                   <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.revoked}</p>
//                   <p className="text-[11px] text-gray-400 dark:text-gray-500">Revoked</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total_issued}</p>
//                   <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Total issued</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {tab === "stats" && !stats && (
//             <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-20">
//               <BarChart3 size={28} className="text-gray-300 dark:text-gray-600" />
//               <p className="text-sm text-gray-400 dark:text-gray-500">Loading stats…</p>
//             </div>
//           )}
//         </motion.div>
//       </AnimatePresence>

//       {/* Form modal */}
//       <AnimatePresence>
//         {formOpen && (
//           <TicketFormModal
//             initial={editing}
//             onSave={handleSave}
//             onClose={() => { setFormOpen(false); setEditing(null); }}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
