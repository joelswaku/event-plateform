
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
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
  Loader2,
  Package,
  CircleDot,
  Home,
  User,
  Heart,
  ArrowRight,
  Settings2,
} from "lucide-react";
import { useTicketStore } from "@/store/ticket.store";
import { useEventStore } from "@/store/event.store";
import { useAIStore } from "@/store/ai.store";
import { api } from "@/lib/api";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import ConfirmModal, { useConfirm } from "@/components/ui/confirm-modal";

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
  const { openConfirm, confirmProps } = useConfirm();
  const soldPct =
    ticket.quantity_total > 0
      ? Math.min((ticket.quantity_sold / ticket.quantity_total) * 100, 100)
      : null;

  const handleDelete = () => {
    openConfirm({
      title: "Delete ticket type?",
      description: `"${ticket.name}" will be permanently removed.`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeleting(true);
        try { await onDelete(ticket.id); } finally { setDeleting(false); }
      },
    });
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(ticket); } finally { setToggling(false); }
  };

  const isFree = ticket.kind === "FREE" || ticket.price === 0;
  const almostFull = soldPct !== null && soldPct >= 80;
  const isFull = soldPct !== null && soldPct >= 100;

  return (<>
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
    <ConfirmModal {...confirmProps} />
    </>
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

function TicketFormModal({ initial, onSave, onClose, eventId }) {
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
  const [priceTips, setPriceTips] = useState(null);
  const { generateTicketPricing, loading: aiLoading } = useAIStore();

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
            <div className="grid grid-cols-2 gap-2">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Price (USD)
                </label>
                {eventId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await generateTicketPricing(eventId, {
                        ticketName: form.name || "General Admission",
                        kind: form.kind,
                      });
                      if (res.success && res.data) setPriceTips(res.data);
                    }}
                    disabled={aiLoading}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors border border-indigo-100 dark:border-indigo-800/40"
                  >
                    <Sparkles size={10} />
                    {aiLoading ? "Thinking…" : "AI Pricing"}
                  </button>
                )}
              </div>
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
              {priceTips && (
                <div className="mt-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20 px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles size={9} /> AI Pricing Suggestions
                  </p>
                  {priceTips.suggestions?.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { set("price", String(s.price)); setPriceTips(null); }}
                      className="flex w-full items-center justify-between rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800/30 px-3 py-1.5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{s.label}</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">${s.price}</span>
                    </button>
                  ))}
                  {priceTips.rationale && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{priceTips.rationale}</p>
                  )}
                </div>
              )}
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

// ─── Terms Acceptance Modal ───────────────────────────────────────────────────
function TermsAcceptanceModal({ onAccepted, onClose }) {
  const [checked,  setChecked]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleAccept = async () => {
    if (!checked) { setError("Please read and check the box to continue."); return; }
    setSaving(true);
    try {
      await api.post("/engagement/terms/accept");
      onAccepted();
    } catch {
      setError("Failed to record acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
      >
        {/* amber top bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <Ticket size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">One-time setup</p>
              <h2 className="text-base font-black text-gray-900 dark:text-white">Ticketing Agreement</h2>
            </div>
          </div>

          {/* Commission disclosure */}
          <div className="rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/4 p-4 mb-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Platform fees (added to ticket price for buyers)</p>
            <div className="space-y-1.5">
              {[
                ["Service fee", "3.5% of ticket subtotal"],
                ["Per-ticket fee", "$0.49 per paid ticket"],
                ["Stripe processing", "2.9% + $0.30 (deducted by Stripe)"],
                ["Free tickets", "No platform fee"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-white/60">{label}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/35 pt-1 border-t border-gray-100 dark:border-white/8">
              Fees are added on top of your set ticket price. You receive your full ticket price.
              Example: $50 ticket → buyer pays ~$54.24 total.
            </p>
          </div>

          {/* Refund policy */}
          <div className="rounded-xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 px-4 py-3 mb-4">
            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
              <strong>As an organizer, you are responsible</strong> for your event&rsquo;s refund policy,
              ensuring the event takes place, and complying with all applicable laws. LiteEvent LLC
              (dba LiteEvent) is a platform provider, not a co-organizer.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <div
              onClick={() => { setChecked(v => !v); setError(""); }}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all"
              style={{ borderColor: checked ? "#f59e0b" : "#d1d5db", background: checked ? "#f59e0b" : "white" }}
            >
              {checked && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <p className="text-sm text-gray-700 dark:text-white/70 leading-relaxed">
              I have read and agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Privacy Policy</a>
              , including the platform fee schedule above.
            </p>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 mb-4">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={saving || !checked}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.30)" }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? "Saving…" : "Accept & Enable Ticketing"}
            </motion.button>
            <button onClick={onClose}
              className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Ticketing Gate ───────────────────────────────────────────────────────────

function TicketingGate({ event, eventId, onEnabled }) {
  const { updateEvent } = useEventStore();
  const router = useRouter();
  const [saving,        setSaving]        = useState(false);
  const [termsChecked,  setTermsChecked]  = useState(false);
  const [showTerms,     setShowTerms]     = useState(false);

  // Check if user has already accepted terms
  useEffect(() => {
    api.get("/engagement/terms/status")
      .then(r => { if (r.data?.data?.upToDate) setTermsChecked(true); })
      .catch(() => {});
  }, []);

  const isRsvp      = !!event?.allow_rsvp;
  const isDonation  = !!event?.allow_donations;

  const cfg = isRsvp
    ? {
        icon: Users,
        iconColor: "#6366f1",
        iconBg:    "rgba(99,102,241,0.10)",
        iconBorder:"rgba(99,102,241,0.20)",
        badge:     "RSVP Mode",
        badgeColor:"#6366f1",
        badgeBg:   "rgba(99,102,241,0.10)",
        title:     "This event uses RSVP",
        body:      "Guests currently RSVP to attend. Switching to Ticketing lets you sell paid tickets, manage capacity, and accept payments — RSVP will be turned off automatically.",
        warning:   "Existing RSVPs are kept but no new ones will be accepted.",
        ctaLabel:  "Switch to Ticketing",
        ctaGrad:   "linear-gradient(135deg,#f59e0b,#d97706)",
        ctaShadow: "0 6px 20px rgba(245,158,11,0.30)",
        backLabel: "Keep RSVP",
      }
    : isDonation
    ? {
        icon: Heart,
        iconColor: "#f43f5e",
        iconBg:    "rgba(244,63,94,0.10)",
        iconBorder:"rgba(244,63,94,0.20)",
        badge:     "Donations Mode",
        badgeColor:"#f43f5e",
        badgeBg:   "rgba(244,63,94,0.10)",
        title:     "This event accepts donations",
        body:      "Donations are currently enabled for this event. Switching to Ticketing lets you sell tickets at fixed prices — the Donation module will be turned off automatically.",
        warning:   "Past donations are not affected.",
        ctaLabel:  "Switch to Ticketing",
        ctaGrad:   "linear-gradient(135deg,#f59e0b,#d97706)",
        ctaShadow: "0 6px 20px rgba(245,158,11,0.30)",
        backLabel: "Keep Donations",
      }
    : {
        icon: Ticket,
        iconColor: "#f59e0b",
        iconBg:    "rgba(245,158,11,0.10)",
        iconBorder:"rgba(245,158,11,0.20)",
        badge:     "Ticketing Off",
        badgeColor:"#f59e0b",
        badgeBg:   "rgba(245,158,11,0.10)",
        title:     "Ticketing isn't enabled",
        body:      "Enable the Ticketing module to create ticket tiers, set pricing, manage capacity, and accept payments for this event.",
        warning:   null,
        ctaLabel:  "Enable Ticketing",
        ctaGrad:   "linear-gradient(135deg,#f59e0b,#d97706)",
        ctaShadow: "0 6px 20px rgba(245,158,11,0.30)",
        backLabel: "Back to Tickets",
      };

  const IconComp = cfg.icon;

  const handleEnable = async () => {
    // Require terms acceptance before enabling ticketing
    if (!termsChecked) {
      setShowTerms(true);
      return;
    }
    setSaving(true);
    try {
      await updateEvent(eventId, {
        allow_ticketing: true,
        allow_rsvp:      false,
        allow_donations: false,
        open_rsvp:       false,
      });
      onEnabled();
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => router.push("/tickets");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center"
    >
      {/* mode badge */}
      <div
        className="mb-6 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
        style={{ background: cfg.badgeBg, color: cfg.badgeColor, border: `1px solid ${cfg.iconBorder}` }}
      >
        <IconComp size={12} />
        {cfg.badge}
      </div>

      {/* icon */}
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: cfg.iconBg, border: `1px solid ${cfg.iconBorder}` }}
      >
        <IconComp size={28} style={{ color: cfg.iconColor }} />
      </div>

      {/* headline */}
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{cfg.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-4">
        {cfg.body}
      </p>

      {/* warning note */}
      {cfg.warning && (
        <div
          className="mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-left max-w-sm"
          style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{cfg.warning}</p>
        </div>
      )}

      {/* what you get with ticketing */}
      {!cfg.warning && (
        <div className="mb-6 grid grid-cols-2 gap-2 max-w-xs w-full">
          {[
            "Paid ticket tiers",
            "Capacity limits",
            "Stripe payments",
            "Order management",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <CheckCircle2 size={11} className="shrink-0 text-amber-500" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Terms not yet accepted — show info nudge */}
      {!termsChecked && (
        <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-left max-w-sm"
          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
          <AlertCircle size={13} className="shrink-0 mt-0.5 text-indigo-500" />
          <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
            You&rsquo;ll need to accept the platform&rsquo;s <strong>Terms of Service</strong> and{" "}
            <strong>fee schedule</strong> before enabling ticketing.
          </p>
        </div>
      )}

      {/* actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleEnable}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white disabled:opacity-60 transition-all"
          style={{ background: cfg.ctaGrad, boxShadow: cfg.ctaShadow }}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : termsChecked ? (
            <><Ticket size={15} /> {cfg.ctaLabel} <ArrowRight size={14} /></>
          ) : (
            <><CheckCircle2 size={15} /> Accept Terms &amp; {cfg.ctaLabel} <ArrowRight size={14} /></>
          )}
        </motion.button>

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ChevronLeft size={13} />
          {cfg.backLabel}
        </button>
      </div>

      {/* Terms acceptance modal */}
      <AnimatePresence>
        {showTerms && (
          <TermsAcceptanceModal
            onAccepted={() => { setTermsChecked(true); setShowTerms(false); handleEnable(); }}
            onClose={() => setShowTerms(false)}
          />
        )}
      </AnimatePresence>
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

// ─── Shared donut (pure SVG) ──────────────────────────────────────────────────
function DonutChart({ title, segments, centerLabel, centerSub }) {
  const total = segments.reduce((s, g) => s + g.count, 0);
  const R = 44, cx = 52, cy = 52, sw = 13;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = total > 0 ? (seg.count / total) * circ : 0;
    const arc  = { ...seg, dash, offset };
    offset += dash;
    return arc;
  });
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-(--bg-elevated) p-5">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30">{title}</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeWidth={sw}
              className="text-gray-100 dark:text-white/6" />
            {total > 0 && arcs.map((arc, i) => (
              <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={arc.color} strokeWidth={sw}
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                strokeDashoffset={-arc.offset}
                style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray .6s ease" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{centerLabel ?? total}</p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wide mt-0.5">{centerSub ?? "total"}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <p className="flex-1 text-xs font-medium text-gray-600 dark:text-white/55 truncate">{seg.label}</p>
              <p className="text-xs font-black text-gray-900 dark:text-white">{seg.count}</p>
              <p className="text-[10px] text-gray-400 dark:text-white/25 w-8 text-right">
                {total > 0 ? `${Math.round(seg.count / total * 100)}%` : "—"}
              </p>
            </div>
          ))}
          {total === 0 && <p className="text-xs text-gray-300 dark:text-white/20 italic">No data yet</p>}
        </div>
      </div>
    </div>
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

  const totalCapacity = stats.ticket_types.reduce((s, t) => s + (t.quantity_total ?? 0), 0);
  const fillRate = totalCapacity > 0
    ? ((stats.total_issued / totalCapacity) * 100).toFixed(1)
    : null;

  // Donut segments
  const qrSegments = [
    { label: "Active",     count: stats.active_tickets, color: "#6366f1" },
    { label: "Checked in", count: stats.checked_in,     color: "#10b981" },
    { label: "Revoked",    count: stats.revoked,         color: "#f43f5e" },
  ];
  const orderSegments = [
    { label: "Paid",    count: stats.paid_orders,                          color: "#10b981" },
    { label: "Pending", count: stats.total_orders - stats.paid_orders,     color: "#f59e0b" },
  ];
  const kindSegments = stats.ticket_types.reduce((acc, t) => {
    const existing = acc.find(s => s.label === t.kind);
    if (existing) existing.count += (t.quantity_sold ?? 0);
    else acc.push({ label: t.kind, count: t.quantity_sold ?? 0,
      color: t.kind === "FREE" ? "#10b981" : t.kind === "PAID" ? "#6366f1" : "#f59e0b" });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active passes", value: stats.active_tickets, icon: Ticket,      color: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-950/40",  border: "border-indigo-100 dark:border-indigo-900/30" },
          { label: "Checked in",    value: stats.checked_in,     icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-100 dark:border-emerald-900/30" },
          { label: "Total issued",  value: stats.total_issued,   icon: Hash,         color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-950/40",  border: "border-violet-100 dark:border-violet-900/30" },
          { label: "Revoked",       value: stats.revoked,        icon: XCircle,      color: "text-rose-500",                         bg: "bg-rose-50 dark:bg-rose-950/40",      border: "border-rose-100 dark:border-rose-900/30" },
        ].map((item, i) => (
          <KpiCard key={i} {...item} delay={i * 0.05} />
        ))}
      </div>

      {/* Donut charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DonutChart title="Ticket Status"  segments={qrSegments}    centerLabel={stats.total_issued} centerSub="issued" />
        <DonutChart title="Order Status"   segments={orderSegments} centerLabel={stats.total_orders} centerSub="orders" />
        <DonutChart title="By Ticket Kind" segments={kindSegments}  centerLabel={stats.ticket_types.reduce((s,t)=>s+(t.quantity_sold??0),0)} centerSub="sold" />
      </div>

      {/* Capacity bar chart per type */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Capacity fill by ticket type</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sold vs total seats per tier</p>
          </div>
          {fillRate !== null && (
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-600 dark:text-indigo-400">
              {fillRate}% overall
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {stats.ticket_types.map((t) => {
            const pct = t.quantity_total
              ? Math.min(((t.quantity_sold ?? 0) / t.quantity_total) * 100, 100)
              : null;
            const barColor = pct == null ? "#6366f1" : pct >= 100 ? "#f43f5e" : pct >= 80 ? "#f59e0b" : "#6366f1";
            return (
              <div key={t.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      t.is_active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    }`}>{t.is_active ? "Active" : "Off"}</span>
                    <span className="rounded-full bg-gray-100 dark:bg-white/8 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:text-white/40">
                      {t.kind}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400 dark:text-white/40 shrink-0">
                      {t.quantity_sold ?? 0}{t.quantity_total ? ` / ${t.quantity_total}` : " sold"}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
                      {t.kind === "FREE" ? <span className="text-emerald-500">Free</span> : fmt(t.price, t.currency)}
                    </p>
                  </div>
                </div>
                {pct !== null ? (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600">
                    <Infinity size={11} /> Unlimited capacity
                  </div>
                )}
                {pct !== null && (
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-white/25">
                    {pct.toFixed(1)}% filled
                    {pct >= 100 && <span className="ml-1 font-bold text-rose-500">· SOLD OUT</span>}
                    {pct >= 80 && pct < 100 && <span className="ml-1 font-bold text-amber-500">· Almost full</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const {
    tickets, orders, stats, loading,
    fetchTickets, createTicket, updateTicket, deleteTicket, fetchStats, fetchOrders,
  } = useTicketStore();
  const { events, fetchEvents } = useEventStore();
  const event = events.find((e) => e.id === eventId);

  const [tab, setTab]             = useState("types");
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [gateBypass, setGateBypass] = useState(false);

  useEffect(() => {
    fetchTickets(eventId);
    fetchStats(eventId);
    fetchOrders(eventId);
    if (!event) fetchEvents();
  }, [eventId]); // eslint-disable-line

  const showGate = !gateBypass && event && !event.allow_ticketing;

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
    <>
      {/* ── MOBILE OVERLAY ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col overflow-hidden dark" style={{ background: "#07070f" }}>
        <div className="flex shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "rgba(255,255,255,0.08)", paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}>
          <Link href={`/events/${eventId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "#14141f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-black text-white leading-tight">Tickets</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Manage ticket types & orders</p>
          </div>
          {!showGate && !showSetup && tab === "types" && (
            <button onClick={openCreate}
              className="flex h-9 w-9 items-center justify-center rounded-[12px]"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
              <Plus size={17} className="text-white" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* ── Gate: ticketing not enabled ── */}
          {showGate ? (
            <div className="dark" style={{ background: "#07070f" }}>
              <TicketingGate
                event={event}
                eventId={eventId}
                onEnabled={() => setGateBypass(true)}
              />
            </div>
          ) : (
          <div className="p-4 space-y-4">
            <div className="space-y-4">

      {/* Page header hidden in mobile - we have a custom dark header above */}
      <div className="hidden">
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
      </div>{/* end hidden page header */}

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

            </div>
          </div>
          )}
        </div>
        <MobileBottomNav />
      </div>

      {/* ── DESKTOP UI ── */}
      <div className="hidden sm:block space-y-6">

      {/* ── Gate: ticketing not enabled ── */}
      {showGate && (
        <TicketingGate
          event={event}
          eventId={eventId}
          onEnabled={() => setGateBypass(true)}
        />
      )}

      {!showGate && (<>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/tickets"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="All events"
          >
            <ChevronLeft size={15} />
          </Link>
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{event?.title ?? "Loading…"}</h1>
            {event?.starts_at_local && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <CalendarDays size={11} />
                {new Date(event.starts_at_local).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/events/${eventId}/builder`}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Palette size={13} /> Builder
          </Link>
          {!showSetup && tab === "types" && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors active:scale-95 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30">
              <Plus size={13} />
              <span className="hidden sm:inline">New ticket type</span>
              <span className="sm:hidden">New</span>
            </motion.button>
          )}
        </div>
      </div>

      {stats && !showSetup && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={DollarSign} label="Gross Revenue" value={fmt(stats.gross_revenue, stats.currency)} sub={`${fmt(stats.pending_revenue, stats.currency)} pending`} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-950/40" borderClass="border-emerald-100 dark:border-emerald-900/30" delay={0} />
          <KpiCard icon={ShoppingBag} label="Paid Orders" value={stats.paid_orders} sub={`${stats.total_orders} total`} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-950/40" borderClass="border-indigo-100 dark:border-indigo-900/30" delay={0.05} />
          <KpiCard icon={Users} label="Tickets Issued" value={stats.total_issued} sub={`${stats.checked_in} checked in`} colorClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-50 dark:bg-violet-950/40" borderClass="border-violet-100 dark:border-violet-900/30" delay={0.1} />
          <KpiCard icon={TrendingUp} label="Pending Revenue" value={fmt(stats.pending_revenue, stats.currency)} sub="awaiting payment" colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-950/40" borderClass="border-amber-100 dark:border-amber-900/30" delay={0.15} />
        </div>
      )}

      {!showSetup && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t.id ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white"}`}>
                  <Icon size={14} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${tab === t.id ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={showSetup ? "setup" : tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {showSetup && <SetupScreen event={event} onStartFresh={openCreate} />}
          {!showSetup && tab === "types" && (
            <>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((t) => <TicketTypeCard key={t.id} ticket={t} onEdit={(t) => { setEditing(t); setFormOpen(true); }} onDelete={handleDelete} onToggle={handleToggle} />)}
                  <AddTicketCard onClick={openCreate} />
                </div>
              )}
            </>
          )}
          {tab === "orders" && (
            <div>
              {orders.length > 0 && (
                <div className="hidden md:flex items-center gap-4 px-5 py-2 mb-1">
                  <div className="w-9 shrink-0" />
                  <p className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600">Buyer</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600">Amount</p>
                  <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600 w-20 text-center">Status</p>
                  <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600 w-28 text-right">Date</p>
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
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Orders appear here once guests purchase tickets</p>
                    </div>
                  </div>
                ) : (
                  orders.map((o) => <OrderRow key={o.id} order={o} />)
                )}
              </div>
            </div>
          )}
          {tab === "stats" && <StatsTab stats={stats} />}
        </motion.div>
      </AnimatePresence>
      </>)} {/* end !showGate desktop */}
      </div>

      {/* ── Modal (above mobile overlay) ── */}
      <AnimatePresence>
        {formOpen && (
          <TicketFormModal
            initial={editing}
            onSave={handleSave}
            onClose={() => { setFormOpen(false); setEditing(null); }}
            eventId={eventId}
          />
        )}
      </AnimatePresence>
    </>
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
