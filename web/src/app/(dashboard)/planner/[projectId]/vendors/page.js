"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  Plus, X, Loader2, Phone, Globe, Star, Trash2,
  ExternalLink, Sparkles, Store, LayoutGrid, List,
  CheckCircle, Clock, Search, MessageSquare, FileText,
  Mail, Edit3, Check, ChevronRight, ChevronDown, ChevronUp, DollarSign,
  Filter, SlidersHorizontal, AlertTriangle, Kanban,
  Copy, CreditCard, BadgeCheck, Ban, MapPin, ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Category covers & colors ──────────────────────────────────────────────
const CAT_COVERS = {
  "Photography":    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70",
  "Videography":    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=70",
  "Catering":       "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=70",
  "Music & DJ":     "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=70",
  "Flowers & Décor":"https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&q=70",
  "Venue":          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=70",
  "Lighting":       "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=70",
  "Hair & Makeup":  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=70",
  "Transportation": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=70",
  "Entertainment":  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=70",
  "Cake & Desserts":"https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&q=70",
  "Officiant":      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=70",
  "Rentals":        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=70",
  "Security":       "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&q=70",
  "Sound & AV":     "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=70",
};
const CAT_COLORS = {
  "Photography": "#818cf8", "Videography": "#a78bfa", "Catering": "#fbbf24",
  "Music & DJ": "#4ade80", "Flowers & Décor": "#f472b6", "Venue": "#38bdf8",
  "Lighting": "#fde68a", "Sound & AV": "#34d399", "Hair & Makeup": "#f9a8d4",
  "Officiant": "#c084fc", "Cake & Desserts": "#fb923c", "Transportation": "#60a5fa",
  "Rentals": "#a3e635", "Entertainment": "#f87171", "Security": "#94a3b8",
};

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_META = {
  researching: { label: "Researching", cls: "bg-gray-500/20 text-gray-400",      border: "border-gray-500/20",   dot: "#6b7280", ring: "ring-gray-500/20" },
  contacted:   { label: "Contacted",   cls: "bg-blue-500/20  text-blue-400",     border: "border-blue-500/20",   dot: "#3b82f6", ring: "ring-blue-500/20"  },
  quoted:      { label: "Quoted",      cls: "bg-amber-500/20 text-amber-400",    border: "border-amber-500/20",  dot: "#f59e0b", ring: "ring-amber-500/20" },
  booked:      { label: "Booked",      cls: "bg-emerald-500/20 text-emerald-400",border: "border-emerald-500/20",dot: "#10b981", ring: "ring-emerald-500/20"},
  rejected:    { label: "Rejected",    cls: "bg-red-500/20   text-red-400",      border: "border-red-500/20",    dot: "#ef4444", ring: "ring-red-500/20"   },
};

const STATUS_ICONS = {
  researching: Search,
  contacted:   MessageSquare,
  quoted:      FileText,
  booked:      BadgeCheck,
  rejected:    Ban,
};

const STATUSES = ["researching", "contacted", "quoted", "booked", "rejected"];

const CATEGORIES = [
  "Catering", "Photography", "Videography", "Flowers & Décor", "Music & DJ",
  "Venue", "Transportation", "Security", "Lighting", "Sound & AV",
  "Hair & Makeup", "Officiant", "Cake & Desserts", "Invitations", "Rentals", "Other",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n || 0).toLocaleString(); }

function normalizeStatus(s) {
  if (!s) return "researching";
  const lower = String(s).toLowerCase();
  if (lower === "confirmed") return "booked";
  return STATUS_META[lower] ? lower : "researching";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ value = 0, onChange, size = "sm" }) {
  const [hovered, setHovered] = useState(0);
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(r => (
        <button
          key={r}
          type="button"
          onClick={() => onChange?.(r === value ? 0 : r)}
          onMouseEnter={() => onChange && setHovered(r)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`${cls} transition-colors ${
            r <= (hovered || value) ? "text-amber-400 fill-amber-400" : "text-gray-600"
          }`} />
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const pm = STATUS_META[status] ?? STATUS_META.researching;
  const Icon = STATUS_ICONS[status] ?? Search;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pm.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {pm.label}
    </span>
  );
}

function VendorSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 space-y-5 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/4" />)}
        </div>
        <div className="h-10 rounded-xl bg-white/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-white/4" />)}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyVendors({ onAdd, onFindGoogle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <Store className="w-7 h-7 text-amber-400" />
      </div>
      <p className="text-white font-bold text-base mb-1">No vendors yet</p>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Find local vendors on Google or add them manually.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onFindGoogle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm font-bold transition-all border border-blue-500/20"
        >
          <MapPin className="w-4 h-4" />
          Find on Google
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 hover:bg-white/10 text-white text-sm font-semibold transition-all border border-white/10"
        >
          <Plus className="w-4 h-4" />
          Add Manually
        </button>
      </div>
    </div>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────

function VendorFormModal({ projectId, vendor, onClose }) {
  const { createVendor, updateVendor } = usePlannerStore();
  const editing = !!vendor;

  const [form, setForm] = useState({
    name:           vendor?.name           || "",
    category:       vendor?.category       || "",
    image_url:      vendor?.image_url      || "",
    booking_status: normalizeStatus(vendor?.booking_status) || "researching",
    contact_name:   vendor?.contact_name   || "",
    contact_email:  vendor?.contact_email  || "",
    contact_phone:  vendor?.contact_phone  || "",
    website_url:    vendor?.website_url    || "",
    quoted_price:   vendor?.quoted_price   || "",
    confirmed_price: vendor?.confirmed_price || "",
    currency:       vendor?.currency       || "USD",
    notes:          vendor?.notes          || "",
  });
  const [saving, setSaving] = useState(false);
  const [customCat, setCustomCat] = useState(!CATEGORIES.includes(vendor?.category || "") && !!vendor?.category);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim()) { toast.error("Vendor name is required"); return; }
    setSaving(true);
    const payload = { ...form, quoted_price: form.quoted_price || null, confirmed_price: form.confirmed_price || null };
    const res = editing
      ? await updateVendor(projectId, vendor.id, payload)
      : await createVendor(projectId, payload);
    setSaving(false);
    if (res.success) {
      toast.success(editing ? "Vendor updated" : "Vendor added");
      onClose(res.data);
    } else {
      toast.error(res.error || "Failed to save vendor");
    }
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-sm font-bold text-white">{editing ? "Edit Vendor" : "Add Vendor"}</p>
          <button onClick={() => onClose()} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
          {/* Name */}
          <input className={inp} placeholder="Vendor Name *" value={form.name} onChange={f("name")}
            onKeyDown={e => e.key === "Enter" && submit()} />

          {/* Image URL */}
          <input className={inp} placeholder="Logo / Image URL (optional)" value={form.image_url} onChange={f("image_url")} />

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              {customCat ? (
                <div className="flex gap-1">
                  <input className={`${inp} flex-1`} placeholder="Category" value={form.category} onChange={f("category")} />
                  <button onClick={() => { setCustomCat(false); setForm(p=>({...p,category:""})); }}
                    className="px-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select className={inp} value={form.category}
                  onChange={e => { if(e.target.value === "__custom__") setCustomCat(true); else setForm(p=>({...p,category:e.target.value})); }}>
                  <option value="" className="bg-[#111127]">Category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111127]">{c}</option>)}
                  <option value="__custom__" className="bg-[#111127]">+ Custom…</option>
                </select>
              )}
            </div>
            <select className={inp} value={form.booking_status} onChange={f("booking_status")}>
              {STATUSES.map(s => <option key={s} value={s} className="bg-[#111127]">{STATUS_META[s].label}</option>)}
            </select>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Contact Name" value={form.contact_name} onChange={f("contact_name")} />
            <input className={inp} placeholder="Contact Email" type="email" value={form.contact_email} onChange={f("contact_email")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Phone" value={form.contact_phone} onChange={f("contact_phone")} />
            <input className={inp} placeholder="Website URL" value={form.website_url} onChange={f("website_url")} />
          </div>

          {/* Pricing */}
          <div className="pt-1">
            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide mb-2">Pricing</p>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className={inp} placeholder="Quoted" value={form.quoted_price} onChange={f("quoted_price")} />
              <input type="number" className={inp} placeholder="Confirmed" value={form.confirmed_price} onChange={f("confirmed_price")} />
              <select className={inp} value={form.currency} onChange={f("currency")}>
                {["USD","EUR","GBP","CAD","AUD","JPY","CHF"].map(c => <option key={c} value={c} className="bg-[#111127]">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <textarea className={`${inp} h-20 resize-none`} placeholder="Notes, reminders, requirements…"
            value={form.notes} onChange={f("notes")} />
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={() => onClose()} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-colors border border-white/8">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? "Save Changes" : "Add Vendor")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Card ────────────────────────────────────────────────────────────

function VendorCard({ vendor, onSelect, selected, onEdit }) {
  const status  = normalizeStatus(vendor.booking_status);
  const pm      = STATUS_META[status];
  const accent  = CAT_COLORS[vendor.category] || "#818cf8";
  const cover   = vendor.image_url
    || (vendor.category && CAT_COVERS[vendor.category])
    || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70";

  return (
    <div onClick={() => onSelect(vendor)}
      className={`relative group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200 ${
        selected ? "border-indigo-500/50 shadow-xl shadow-indigo-500/10" : "border-white/8 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg"
      }`} style={{ background: "#111127" }}>

      {/* Cover image */}
      <div className="relative h-32 overflow-hidden">
        <img src={cover} alt={vendor.category || vendor.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Status bar at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: pm.dot }} />

        {/* Category badge */}
        {vendor.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
            style={{ background: `${accent}cc`, color: "#fff" }}>
            {vendor.category}
          </div>
        )}

        {/* AI badge */}
        {vendor.ai_suggested && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-600/80 backdrop-blur-sm">
            <Sparkles className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-bold text-white">AI</span>
          </div>
        )}

        {/* Edit btn */}
        <button onClick={e => { e.stopPropagation(); onEdit(vendor); }}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
          <Edit3 className="w-3 h-3" />
        </button>

        {/* Avatar */}
        <div className="absolute bottom-0 left-3 translate-y-1/2">
          <div className="w-9 h-9 rounded-xl border-2 border-[#111127] overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent}44, ${accent}22)` }}>
            {vendor.image_url
              ? <img src={vendor.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-black" style={{ color: accent }}>
                  {vendor.name?.charAt(0)?.toUpperCase()}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-6 px-3 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-white line-clamp-1 leading-tight">{vendor.name}</p>
          <StatusBadge status={status} />
        </div>

        {vendor.contact_name && (
          <p className="text-[11px] text-gray-500 truncate mb-1.5">{vendor.contact_name}</p>
        )}

        {/* Price */}
        {(vendor.quoted_price > 0 || vendor.confirmed_price > 0) && (
          <p className={`text-xs font-black mb-1.5 ${vendor.confirmed_price > 0 ? "text-emerald-400" : "text-amber-300"}`}>
            {vendor.currency} {fmt(vendor.confirmed_price > 0 ? vendor.confirmed_price : vendor.quoted_price)}
            <span className="font-normal opacity-60 ml-1">{vendor.confirmed_price > 0 ? "confirmed" : "quoted"}</span>
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/6">
          {vendor.rating > 0
            ? <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-white">{vendor.rating}</span>
              </div>
            : <span className="text-[10px] text-gray-600">No rating</span>
          }
          <div className="flex items-center gap-1">
            {vendor.contact_email && (
              <a href={`mailto:${vendor.contact_email}`} onClick={e => e.stopPropagation()}
                className="p-1 rounded-md text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                <Mail className="w-3 h-3" />
              </a>
            )}
            {vendor.contact_phone && (
              <a href={`tel:${vendor.contact_phone}`} onClick={e => e.stopPropagation()}
                className="p-1 rounded-md text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                <Phone className="w-3 h-3" />
              </a>
            )}
            {vendor.website_url && (
              <a href={vendor.website_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="p-1 rounded-md text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Globe className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vendor List Row ────────────────────────────────────────────────────────

function VendorListRow({ vendor, onSelect, selected, onEdit }) {
  const status = normalizeStatus(vendor.booking_status);
  const pm     = STATUS_META[status];

  return (
    <div
      onClick={() => onSelect(vendor)}
      className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer group transition-colors hover:bg-white/2 active:bg-white/4 ${
        selected ? "bg-indigo-500/5" : ""
      }`}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pm.dot }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{vendor.name}</p>
        {vendor.contact_name && <p className="text-[11px] text-gray-500">{vendor.contact_name}</p>}
      </div>
      {vendor.category && (
        <span className="hidden sm:block text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md uppercase shrink-0">
          {vendor.category}
        </span>
      )}
      <StatusBadge status={status} />
      {(vendor.quoted_price > 0 || vendor.confirmed_price > 0) && (
        <span className={`hidden md:block text-sm font-bold shrink-0 ${vendor.confirmed_price > 0 ? "text-emerald-400" : "text-amber-300"}`}>
          {vendor.currency} {fmt(vendor.confirmed_price || vendor.quoted_price)}
        </span>
      )}
      {vendor.rating > 0 && (
        <div className="hidden lg:block shrink-0">
          <StarRating value={vendor.rating} />
        </div>
      )}
      <button onClick={e => { e.stopPropagation(); onEdit(vendor); }}
        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-all active:scale-90 shrink-0">
        <Edit3 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Pipeline View ──────────────────────────────────────────────────────────

function PipelineView({ vendors, onSelect, selected, onEdit }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map(status => {
        const pm  = STATUS_META[status];
        const Icon = STATUS_ICONS[status];
        const col = vendors.filter(v => normalizeStatus(v.booking_status) === status);
        return (
          <div key={status} className="shrink-0 w-56">
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${pm.cls} ${pm.border}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-bold">{pm.label}</span>
              <span className="ml-auto text-[10px] opacity-60 font-bold">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map(v => (
                <VendorCard key={v.id} vendor={v} onSelect={onSelect} selected={selected?.id === v.id} onEdit={onEdit} />
              ))}
              {col.length === 0 && (
                <div className={`border-2 border-dashed rounded-xl p-5 text-center ${pm.border}`}>
                  <p className="text-[11px] text-gray-600">Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Quote Modal ────────────────────────────────────────────────────────────

function QuoteModal({ vendor, projectId, onClose }) {
  const { updateVendor } = usePlannerStore();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [form, setForm] = useState({
    amount:       vendor.quoted_price ? String(vendor.quoted_price) : "",
    currency:     vendor.currency || "USD",
    eventDate:    "",
    eventType:    "",
    guestCount:   "",
    services:     "",
    message:      `Hi ${vendor.contact_name || vendor.name},\n\nI'm interested in booking your services for my upcoming event.\n\nPlease provide me with a detailed quote.\n\nThank you.`,
  });

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-amber-500/40 transition-colors";

  async function handleSend() {
    if (!form.amount) { toast.error("Please enter a quote amount"); return; }
    setSending(true);
    try {
      // Update vendor with quoted price + status
      await updateVendor(projectId, vendor.id, {
        quoted_price:   parseFloat(form.amount) || 0,
        currency:       form.currency,
        booking_status: "quoted",
      });

      // If vendor has email, open mailto with pre-filled content
      if (vendor.contact_email) {
        const subject = encodeURIComponent(`Quote Request — ${form.eventType || "Upcoming Event"}`);
        const body    = encodeURIComponent(
          `Hi ${vendor.contact_name || vendor.name},\n\n` +
          `${form.message}\n\n` +
          `--- Event Details ---\n` +
          (form.eventDate   ? `Date: ${form.eventDate}\n` : "") +
          (form.eventType   ? `Event Type: ${form.eventType}\n` : "") +
          (form.guestCount  ? `Guest Count: ${form.guestCount}\n` : "") +
          (form.services    ? `Services Required: ${form.services}\n` : "") +
          (form.amount      ? `\nBudget / Expected Quote: ${form.currency} ${form.amount}\n` : "") +
          `\nPlease reply with your availability and detailed quote.\n\nThank you!`
        );
        window.open(`mailto:${vendor.contact_email}?subject=${subject}&body=${body}`, "_blank");
      }

      setSent(true);
      toast.success("Quote details saved" + (vendor.contact_email ? " — email client opened" : ""));
      setTimeout(onClose, 1500);
    } finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0d0d1a] rounded-2xl border border-white/8 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-base font-bold text-white">Send Quote Request</p>
            <p className="text-xs text-gray-500 mt-0.5">
              To: <span className="text-amber-300 font-semibold">{vendor.contact_name || vendor.name}</span>
              {vendor.contact_email && <span className="text-gray-600"> · {vendor.contact_email}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Quote amount */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Quote Amount *</label>
            <div className="flex gap-2">
              <select value={form.currency} onChange={f("currency")}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/40">
                {["USD","EUR","GBP","CAD","AUD","AED"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={form.amount} onChange={f("amount")} type="number" placeholder="e.g. 2500" className={`${inp} flex-1`} />
            </div>
          </div>

          {/* Event details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Event Date</label>
              <input value={form.eventDate} onChange={f("eventDate")} type="date" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Event Type</label>
              <input value={form.eventType} onChange={f("eventType")} placeholder="Wedding, Corporate…" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Guest Count</label>
              <input value={form.guestCount} onChange={f("guestCount")} type="number" placeholder="150" className={inp} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Services Needed</label>
              <input value={form.services} onChange={f("services")} placeholder="Full day coverage, drone…" className={inp} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Message to Vendor</label>
            <textarea value={form.message} onChange={f("message")} rows={5}
              className={`${inp} resize-none leading-relaxed`} />
          </div>

          {/* No email warning */}
          {!vendor.contact_email && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300">No email on file</p>
                <p className="text-[11px] text-amber-400/70 mt-0.5">Quote details will be saved but no email will be sent. Edit the vendor to add an email.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/8 transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || sent}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: sent ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg,#d97706,#f59e0b)", color: sent ? "#10b981" : "#fff", border: sent ? "1px solid rgba(16,185,129,0.3)" : "none" }}>
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : sent  ? <><CheckCircle className="w-4 h-4" /> Quote Sent!</>
              : <><Mail className="w-4 h-4" /> {vendor.contact_email ? "Save & Open Email" : "Save Quote"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Full Page (The Knot-style layout) ──────────────────────────────

const REVIEW_LIMIT = 220;

function ReviewText({ text, indent = true }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > REVIEW_LIMIT;
  const shown  = isLong && !expanded ? text.slice(0, REVIEW_LIMIT).trimEnd() + "…" : text;

  return (
    <div className={indent ? "pl-11" : ""}>
      <p className="text-xs text-gray-400 leading-relaxed">{shown}</p>
      {isLong && (
        <button
          onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function OtherSuggestions({ category, currentVendorName, projectId, projectVendorNames }) {
  const { createVendor } = usePlannerStore();
  const [places,  setPlaces]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState(null);
  const [added,   setAdded]   = useState(new Set());

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const q = GPLACES_CAT_QUERIES[category] || category.toLowerCase();
    fetch("/api/google-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    })
      .then(r => r.json())
      .then(d => setPlaces((d.places || []).filter(p => p.displayName?.text !== currentVendorName).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  async function handleAdd(place) {
    setAdding(place.id);
    const res = await createVendor(projectId, {
      name: place.displayName?.text || "Unknown",
      category,
      google_place_id: place.id,
      image_url: place.photoUrl || "",
      contact_phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
      website_url: place.websiteUri || "",
      notes: [place.formattedAddress, place.rating ? `Google Rating: ${place.rating}/5` : null].filter(Boolean).join("\n"),
      booking_status: "researching",
    });
    setAdding(null);
    if (res.success) { setAdded(prev => new Set([...prev, place.id])); toast.success(`${place.displayName?.text} added`); }
    else toast.error(res.error || "Failed to add");
  }

  if (!loading && places.length === 0) return null;

  const accent = CAT_COLORS[category] || "#818cf8";

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${accent}30` }}>
          <span className="text-[10px]">{CAT_ICONS[category] || "✦"}</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Other {category} Vendors
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl bg-white/4 border border-white/6 animate-pulse overflow-hidden">
              <div className="h-20 bg-white/6" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-white/8 rounded-full w-3/4" />
                <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {places.map(place => {
            const cover    = place.photoUrl || CAT_COVERS[category] || GPLACE_FALLBACK;
            const name     = place.displayName?.text || "Unknown";
            const isAdded  = added.has(place.id);
            const inProj   = projectVendorNames?.has(name.toLowerCase().trim());
            return (
              <div key={place.id} className="rounded-xl overflow-hidden border border-white/6 hover:border-white/14 transition-all bg-white/3 flex flex-col">
                <div className="relative h-20 overflow-hidden">
                  <img src={cover} alt={name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {place.rating > 0 && (
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[9px] font-bold text-white">{place.rating}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5 flex flex-col gap-2 flex-1">
                  <p className="text-[11px] font-bold text-white leading-tight line-clamp-1">{name}</p>
                  {place.formattedAddress && (
                    <p className="text-[9px] text-gray-600 line-clamp-1">{place.formattedAddress}</p>
                  )}
                  <button
                    onClick={() => !inProj && !isAdded && handleAdd(place)}
                    disabled={adding === place.id || isAdded || inProj}
                    className="mt-auto w-full py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                    style={{
                      background: inProj || isAdded ? "rgba(16,185,129,0.15)" : `${accent}22`,
                      color: inProj || isAdded ? "#10b981" : "#fff",
                      border: inProj || isAdded ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${accent}44`,
                    }}
                  >
                    {adding === place.id ? <Loader2 className="w-3 h-3 animate-spin" />
                      : inProj || isAdded ? <><CheckCircle className="w-3 h-3" /> Added</>
                      : <><Plus className="w-3 h-3" /> Add</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VendorDetailPanel({ vendor, projectId, onClose, onEdit }) {
  const { updateVendor, deleteVendor } = usePlannerStore();
  const [savingStatus,  setSavingStatus]  = useState(false);
  const [savingRating,  setSavingRating]  = useState(false);
  const [editingNotes,  setEditingNotes]  = useState(false);
  const [notes,         setNotes]         = useState(vendor.notes || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQuote,     setShowQuote]     = useState(false);
  const [placeData,     setPlaceData]     = useState(null);
  const [loadingPlace,  setLoadingPlace]  = useState(false);

  useEffect(() => {
    if (!vendor.google_place_id) return;
    setLoadingPlace(true);
    fetch("/api/google-place-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: vendor.google_place_id }),
    })
      .then(r => r.json())
      .then(d => setPlaceData(d))
      .catch(() => {})
      .finally(() => setLoadingPlace(false));
  }, [vendor.google_place_id]);

  const status  = normalizeStatus(vendor.booking_status);
  const accent  = CAT_COLORS[vendor.category] || "#818cf8";
  const cover   = vendor.image_url
    || (vendor.category && CAT_COVERS[vendor.category])
    || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80";

  async function saveStatus(s) {
    setSavingStatus(s);
    await updateVendor(projectId, vendor.id, { booking_status: s });
    setSavingStatus(false);
    if (s === "quoted") setShowQuote(true);
  }
  async function saveRating(r) {
    setSavingRating(true);
    await updateVendor(projectId, vendor.id, { rating: r });
    setSavingRating(false);
  }
  async function saveNotes() {
    await updateVendor(projectId, vendor.id, { notes });
    setEditingNotes(false);
    toast.success("Notes saved");
  }
  async function handleDelete() {
    const res = await deleteVendor(projectId, vendor.id);
    if (res.success) { toast.success("Vendor removed"); onClose(); }
    else toast.error(res.error || "Failed to delete");
  }
  function copyEmail() {
    if (vendor.contact_email) { navigator.clipboard.writeText(vendor.contact_email); toast.success("Copied!"); }
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors";

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#06060f" }}>
        <div className="min-h-full w-full">

          {/* ── HERO ── */}
          <div className="relative h-72 sm:h-96 overflow-hidden">
            <img src={cover} alt={vendor.name} className="w-full h-full object-cover" />
            {/* Multi-layer gradient for depth */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #06060f 0%, rgba(6,6,15,0.5) 50%, rgba(6,6,15,0.15) 100%)" }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom left, ${accent}25 0%, transparent 60%)` }} />

            {/* Nav */}
            <div className="absolute top-0 left-0 right-0 px-4 sm:px-8 xl:px-16 pt-4 flex items-center justify-between max-w-[1400px] mx-auto" style={{left:"50%",transform:"translateX(-50%)",width:"min(100%,1400px)"}}>
              <button onClick={onClose}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/10 hover:bg-black/70 transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> Vendors
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQuote(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white border border-white/10 backdrop-blur-md transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}>
                  <FileText className="w-3.5 h-3.5" /> Quote
                </button>
                <button onClick={() => onEdit(vendor)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/10 hover:bg-black/70 transition-all">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>

            {/* Vendor identity over hero */}
            <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto" style={{left:"50%",transform:"translateX(-50%)",width:"min(100%,1400px)"}}>
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 shadow-2xl"
                  style={{ borderColor: `${accent}60`, background: `linear-gradient(135deg,${accent}44,${accent}22)` }}>
                  {vendor.image_url
                    ? <img src={vendor.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black" style={{ color: accent }}>
                        {vendor.name?.charAt(0)?.toUpperCase()}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-2xl font-black text-white leading-tight truncate">{vendor.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {vendor.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: `${accent}30`, color: accent, border: `1px solid ${accent}50` }}>
                        {vendor.category}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[status].cls}`}>
                      {STATUS_META[status].label}
                    </span>
                    {vendor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">{Number(vendor.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 xl:px-16 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Contact details */}
              {(vendor.contact_name || vendor.contact_email || vendor.contact_phone || vendor.website_url) && (
                <div className="rounded-2xl p-5 space-y-3" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vendor.contact_name && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black" style={{ color: accent }}>{vendor.contact_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-gray-300 truncate">{vendor.contact_name}</span>
                      </div>
                    )}
                    {vendor.contact_email && (
                      <a href={`mailto:${vendor.contact_email}`}
                        className="flex items-center gap-2.5 group hover:text-white transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                          <Mail className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-white truncate transition-colors">{vendor.contact_email}</span>
                        <button onClick={e => { e.preventDefault(); copyEmail(); }}
                          className="ml-auto p-1 rounded text-gray-600 hover:text-white transition-colors flex-shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </a>
                    )}
                    {vendor.contact_phone && (
                      <a href={`tel:${vendor.contact_phone}`}
                        className="flex items-center gap-2.5 group hover:text-white transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                          <Phone className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{vendor.contact_phone}</span>
                      </a>
                    )}
                    {vendor.website_url && (
                      <a href={vendor.website_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 group hover:text-white transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                          <Globe className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400" />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-indigo-300 truncate transition-colors">
                          {vendor.website_url.replace(/^https?:\/\//, "")}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-600 ml-auto flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Pipeline */}
              <div className="rounded-2xl p-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Pipeline Stage</p>
                <div className="flex items-stretch gap-1">
                  {STATUSES.filter(s => s !== "rejected").map((s, idx, arr) => {
                    const active    = status === s;
                    const past      = STATUSES.indexOf(status) > STATUSES.indexOf(s);
                    const isLoading = savingStatus === s;
                    const Icon      = STATUS_ICONS[s];
                    const dot       = STATUS_META[s].dot;
                    return (
                      <React.Fragment key={s}>
                        <button onClick={() => saveStatus(s)} disabled={!!savingStatus}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all flex-1 min-w-0 relative overflow-hidden ${
                            active ? "bg-white/8" : "hover:bg-white/4"
                          }`}
                          style={active ? { boxShadow: `inset 0 0 0 1px ${dot}60` } : {}}>
                          {active && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: dot }} />}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${active ? "bg-white/10" : "bg-white/4"}`}>
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              : past ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              : <Icon className="w-3.5 h-3.5" style={{ color: active ? dot : "#6b7280" }} />
                            }
                          </div>
                          <span className={`text-[9px] font-bold leading-tight text-center transition-colors ${active ? "text-white" : "text-gray-600"}`}>
                            {STATUS_META[s].label}
                          </span>
                        </button>
                        {idx < arr.length - 1 && (
                          <div className="flex items-center shrink-0">
                            <div className={`w-3 h-px ${past || active ? "bg-white/20" : "bg-white/8"}`} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <div className="flex items-center shrink-0"><div className="w-3 h-px bg-white/8" /></div>
                  <button onClick={() => saveStatus("rejected")} disabled={!!savingStatus}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all relative overflow-hidden ${
                      status === "rejected" ? "bg-red-500/10" : "hover:bg-white/4"
                    }`}
                    style={status === "rejected" ? { boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.4)" } : {}}>
                    {status === "rejected" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status === "rejected" ? "bg-red-500/15" : "bg-white/4"}`}>
                      <Ban className="w-3.5 h-3.5" style={{ color: status === "rejected" ? "#f87171" : "#6b7280" }} />
                    </div>
                    <span className={`text-[9px] font-bold leading-tight ${status === "rejected" ? "text-red-400" : "text-gray-600"}`}>Rejected</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-2xl p-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Notes & Requirements</p>
                  {!editingNotes && (
                    <button onClick={() => setEditingNotes(true)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                      {vendor.notes ? "Edit" : "+ Add"}
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-3">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} autoFocus
                      className={`${inp} resize-none text-sm leading-relaxed`}
                      placeholder="Notes, requirements, negotiation details…" />
                    <div className="flex gap-2">
                      <button onClick={saveNotes}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors">
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button onClick={() => { setNotes(vendor.notes || ""); setEditingNotes(false); }}
                        className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold transition-colors hover:bg-white/8">Cancel</button>
                    </div>
                  </div>
                ) : vendor.notes ? (
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{vendor.notes}</p>
                ) : (
                  <p className="text-sm text-gray-600 italic">No notes yet</p>
                )}
              </div>

              {/* ── Google: About + Opening Hours ── */}
              {(loadingPlace || placeData?.editorialSummary || placeData?.openingHours) && (
                <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-white">G</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">About (Google)</p>
                    {placeData?.rating > 0 && (
                      <div className="ml-auto flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-white">{placeData.rating}</span>
                        <span className="text-[10px] text-gray-600">({placeData.userRatingCount?.toLocaleString()})</span>
                      </div>
                    )}
                  </div>

                  {loadingPlace && !placeData && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Loading Google details…</span>
                    </div>
                  )}

                  {placeData?.editorialSummary && (
                    <p className="text-sm text-gray-400 leading-relaxed">{placeData.editorialSummary}</p>
                  )}

                  {placeData?.openingHours && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Opening Hours</p>
                      <div className="space-y-1">
                        {placeData.openingHours.map((day, i) => {
                          const [dayName, ...rest] = day.split(": ");
                          return (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-500 w-24 shrink-0 font-medium">{dayName}</span>
                              <span className="text-gray-400">{rest.join(": ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Google Reviews ── */}
              {(loadingPlace || placeData?.reviews?.length > 0) && (
                <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-white">G</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Google Reviews</p>
                    {placeData?.reviews?.length > 0 && (
                      <span className="ml-auto text-[10px] text-gray-600">{placeData.reviews.length} reviews</span>
                    )}
                  </div>

                  {loadingPlace && !placeData && (
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/8" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 bg-white/8 rounded-full w-1/3" />
                              <div className="h-2.5 bg-white/5 rounded-full w-1/4" />
                            </div>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full w-full" />
                          <div className="h-3 bg-white/5 rounded-full w-4/5" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-5">
                    {(placeData?.reviews || []).map((review, i) => {
                      const author = review.authorAttribution?.displayName || "Anonymous";
                      const initials = author.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
                      const colors = ["#818cf8","#34d399","#f472b6","#fbbf24","#38bdf8","#a78bfa"];
                      const col = colors[i % colors.length];
                      return (
                        <div key={i} className="space-y-2.5">
                          {i > 0 && <div className="h-px bg-white/5" />}
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            {review.authorPhotoUrl ? (
                              <img src={review.authorPhotoUrl} alt={author}
                                className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black"
                                style={{ background: `${col}25`, color: col }}>
                                {initials}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-white truncate">{author}</p>
                                <span className="text-[10px] text-gray-600 shrink-0">
                                  {review.relativePublishTimeDescription}
                                </span>
                              </div>
                              {/* Stars */}
                              {review.rating > 0 && (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <ReviewText text={review.text?.text || review.originalText?.text} indent />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Other suggestions (same category) ── */}
              {vendor.category && (
                <OtherSuggestions
                  category={vendor.category}
                  currentVendorName={vendor.name}
                  projectId={projectId}
                  projectVendorNames={new Set([vendor.name?.toLowerCase().trim()])}
                />
              )}

              {/* Rating */}
              <div className="rounded-2xl p-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Your Rating</p>
                <div className="flex items-center gap-4">
                  {savingRating
                    ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    : <StarRating value={vendor.rating || 0} onChange={saveRating} size="lg" />
                  }
                  {vendor.rating > 0 && (
                    <span className="text-xl font-black text-amber-400">{vendor.rating}<span className="text-sm text-amber-400/50">/5</span></span>
                  )}
                </div>
              </div>

              {/* Delete */}
              {confirmDelete ? (
                <div className="rounded-2xl p-5 flex items-center gap-3 border border-red-500/20 bg-red-500/5">
                  <p className="text-sm text-gray-400 flex-1">Remove <span className="text-white font-semibold">{vendor.name}</span>?</p>
                  <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/8 transition-colors">Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/25 hover:bg-red-500/30 transition-colors">Remove</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-red-400 transition-colors pb-4">
                  <Trash2 className="w-3.5 h-3.5" /> Remove this vendor
                </button>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4">

              {/* Pricing + actions */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Price display */}
                <div className="px-5 pt-5 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Pricing</p>
                  {vendor.confirmed_price > 0 ? (
                    <>
                      <p className="text-3xl font-black text-emerald-400 leading-none">
                        {vendor.currency || "USD"} {fmt(vendor.confirmed_price)}
                      </p>
                      <p className="text-xs text-emerald-400/60 mt-1 font-semibold">Confirmed ✓</p>
                    </>
                  ) : vendor.quoted_price > 0 ? (
                    <>
                      <p className="text-3xl font-black text-amber-300 leading-none">
                        {vendor.currency || "USD"} {fmt(vendor.quoted_price)}
                      </p>
                      <p className="text-xs text-amber-300/60 mt-1 font-semibold">Quoted (pending confirmation)</p>
                    </>
                  ) : (
                    <p className="text-base font-bold text-gray-600">No price set</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 space-y-2">
                  <button onClick={() => setShowQuote(true)}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
                    <FileText className="w-4 h-4" /> Request a Quote
                  </button>
                  {vendor.contact_email && (
                    <a href={`mailto:${vendor.contact_email}`}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                      <Mail className="w-4 h-4" /> Send Email
                    </a>
                  )}
                  {vendor.contact_phone && (
                    <a href={`tel:${vendor.contact_phone}`}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                      <Phone className="w-4 h-4" /> Call Vendor
                    </a>
                  )}
                  {vendor.website_url && (
                    <a href={vendor.website_url} target="_blank" rel="noreferrer"
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                      <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Details</p>
                {vendor.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Category</span>
                    <span className="text-xs font-semibold text-white">{vendor.category}</span>
                  </div>
                )}
                {vendor.contact_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Contact</span>
                    <span className="text-xs font-semibold text-white">{vendor.contact_name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[status].cls}`}>
                    {STATUS_META[status].label}
                  </span>
                </div>
                {(vendor.quoted_price > 0 || vendor.confirmed_price > 0) && (
                  <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <span className="text-xs text-gray-600">Budget</span>
                    <span className={`text-xs font-bold ${vendor.confirmed_price > 0 ? "text-emerald-400" : "text-amber-300"}`}>
                      {vendor.currency || "USD"} {fmt(vendor.confirmed_price || vendor.quoted_price)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQuote && <QuoteModal vendor={vendor} projectId={projectId} onClose={() => setShowQuote(false)} />}
    </>
  );
}


// ── Google Places Browser ──────────────────────────────────────────────────

const GPLACES_CAT_QUERIES = {
  "Photography":    "wedding photographer",
  "Videography":    "wedding videographer",
  "Catering":       "event catering service",
  "Music & DJ":     "DJ music event entertainment",
  "Flowers & Décor":"wedding florist decorator",
  "Venue":          "event venue banquet hall",
  "Lighting":       "event lighting company",
  "Sound & AV":     "audio visual AV event",
  "Hair & Makeup":  "bridal makeup artist hair salon",
  "Transportation": "wedding limousine transportation",
  "Entertainment":  "event entertainment company",
  "Cake & Desserts":"wedding cake bakery",
  "Officiant":      "wedding officiant ceremony",
  "Rentals":        "event rental company",
  "Security":       "event security service",
};

const GPLACE_FALLBACK = "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70";

function GooglePlaceCard({ place, category, onAdd, adding, added, inProject, onOpen }) {
  const accent   = CAT_COLORS[category] || "#60a5fa";
  const name     = place.displayName?.text || "Unknown";
  const coverUrl = place.photoUrl || CAT_COVERS[category] || GPLACE_FALLBACK;

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white/4 border border-white/6 hover:border-white/14 transition-all flex flex-col cursor-pointer group"
      onClick={() => onOpen?.(place)}
    >
      {/* Cover image */}
      <div className="relative h-36 overflow-hidden group">
        <img
          src={coverUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.currentTarget.src = GPLACE_FALLBACK; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Category badge */}
        {category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
            style={{ background: `${accent}cc`, color: "#fff" }}>
            {category}
          </div>
        )}

        {/* Google badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#4285F4] flex items-center gap-0.5 shadow-sm">
          <span className="text-[9px] font-black text-white leading-none">G</span>
        </div>

        {/* Rating over image */}
        {place.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-white">{place.rating}</span>
            {place.userRatingCount > 0 && (
              <span className="text-[9px] text-white/60">({place.userRatingCount.toLocaleString()})</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-white leading-tight line-clamp-1">{name}</p>

        {place.formattedAddress && (
          <div className="flex items-start gap-1">
            <MapPin className="w-2.5 h-2.5 text-gray-600 mt-0.5 shrink-0" />
            <span className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{place.formattedAddress}</span>
          </div>
        )}

        {(place.internationalPhoneNumber || place.nationalPhoneNumber) && (
          <div className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-gray-600 shrink-0" />
            <span className="text-[10px] text-gray-500">{place.internationalPhoneNumber || place.nationalPhoneNumber}</span>
          </div>
        )}

        {/* Add button */}
        <button
          onClick={e => { e.stopPropagation(); !inProject && !added && onAdd(place); }}
          disabled={adding || added || inProject}
          className="mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
          style={{
            background: inProject || added ? "rgba(16,185,129,0.15)" : `${accent}22`,
            color:      inProject || added ? "#10b981" : "#fff",
            border:     inProject || added ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${accent}44`,
          }}
        >
          {adding
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : inProject
            ? <><CheckCircle className="w-3 h-3" /> In project</>
            : added
            ? <><CheckCircle className="w-3 h-3" /> Added</>
            : <><Plus className="w-3 h-3" /> Add to Project</>
          }
        </button>
      </div>
    </div>
  );
}

function PortalVendorCard({ vendor, category, onAdd, adding, added, inProject, onOpen }) {
  const accent = CAT_COLORS[vendor.category || category] || "#818cf8";
  const name   = vendor.business_name || vendor.name || "Unknown";

  return (
    <div
      className="rounded-2xl bg-white/4 border border-white/6 hover:border-white/14 transition-all p-4 flex flex-col gap-2.5 cursor-pointer group"
      onClick={() => onOpen?.(vendor)}
    >
      {/* Name + platform badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm font-black"
            style={{ background: `${accent}22`, color: accent }}>
            {vendor.logo_url
              ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
              : name.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-white leading-tight line-clamp-1">{name}</p>
              {vendor.verification_status === "verified" && (
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: accent }}>
              {vendor.category || category}
            </span>
          </div>
        </div>
        <div className="px-1.5 py-0.5 rounded-full bg-indigo-600/70 border border-indigo-400/20 shrink-0">
          <span className="text-[9px] font-bold text-white">PRO</span>
        </div>
      </div>

      {/* Rating */}
      {vendor.rating > 0 && (
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{Number(vendor.rating).toFixed(1)}</span>
          {vendor.review_count > 0 && (
            <span className="text-[10px] text-gray-600">({vendor.review_count})</span>
          )}
        </div>
      )}

      {/* Location */}
      {(vendor.city || vendor.country) && (
        <div className="flex items-start gap-1">
          <MapPin className="w-2.5 h-2.5 text-gray-600 mt-0.5 shrink-0" />
          <span className="text-[10px] text-gray-500 line-clamp-1">{[vendor.city, vendor.country].filter(Boolean).join(", ")}</span>
        </div>
      )}

      {/* Starting price */}
      {vendor.base_price > 0 && (
        <div className="flex items-center gap-1">
          <DollarSign className="w-2.5 h-2.5 text-gray-600 shrink-0" />
          <span className="text-[10px] text-gray-500">from ${Number(vendor.base_price).toLocaleString()}</span>
        </div>
      )}

      {/* Phone */}
      {vendor.phone && (
        <div className="flex items-center gap-1">
          <Phone className="w-2.5 h-2.5 text-gray-600 shrink-0" />
          <span className="text-[10px] text-gray-500">{vendor.phone}</span>
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); !inProject && !added && onAdd(vendor); }}
        disabled={adding || added || inProject}
        className="mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
        style={{
          background: inProject || added ? "rgba(16,185,129,0.15)" : `${accent}22`,
          color:      inProject || added ? "#10b981" : "#fff",
          border:     inProject || added ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${accent}44`,
        }}
      >
        {adding
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : inProject
          ? <><CheckCircle className="w-3 h-3" /> In project</>
          : added
          ? <><CheckCircle className="w-3 h-3" /> Added</>
          : <><Plus className="w-3 h-3" /> Add to Project</>
        }
      </button>
    </div>
  );
}

function AIVendorCard({ vendor, onAccept, accepting }) {
  const accent = CAT_COLORS[vendor.category] || "#a78bfa";

  return (
    <div className="rounded-2xl bg-white/4 border border-violet-500/20 hover:border-violet-500/30 transition-all p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-black"
            style={{ background: `${accent}22`, color: accent }}>
            {vendor.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight line-clamp-1">{vendor.name}</p>
            {vendor.category && (
              <span className="text-[10px] font-semibold" style={{ color: accent }}>{vendor.category}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-600/60 border border-violet-400/20 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-violet-200" />
          <span className="text-[8px] font-bold text-violet-200">AI</span>
        </div>
      </div>

      {vendor.notes && (
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{vendor.notes}</p>
      )}

      <button
        onClick={() => onAccept(vendor)}
        disabled={accepting}
        className="mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
        style={{ background: `${accent}22`, color: "#fff", border: `1px solid ${accent}44` }}
      >
        {accepting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" /> Add to Project</>}
      </button>
    </div>
  );
}

const CAT_ICONS = {
  "Photography":    "📷",
  "Videography":    "🎥",
  "Catering":       "🍽️",
  "Music & DJ":     "🎵",
  "Flowers & Décor":"💐",
  "Venue":          "🏛️",
  "Lighting":       "💡",
  "Sound & AV":     "🔊",
  "Hair & Makeup":  "💄",
  "Transportation": "🚗",
  "Entertainment":  "🎭",
  "Cake & Desserts":"🎂",
  "Officiant":      "💍",
  "Rentals":        "📦",
  "Security":       "🛡️",
};

function CategoryDropdown({ value, onChange, byCategory = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const accent = CAT_COLORS[value] || "#4f46e5";
  const icon   = CAT_ICONS[value]  || "✦";
  const totalSaved = Object.values(byCategory).reduce((s, arr) => s + arr.length, 0);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all min-w-[170px]"
        style={value !== "All" ? {
          background: `${accent}18`,
          borderColor: `${accent}40`,
          color: "#fff",
        } : {
          background: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.10)",
          color: "#d1d5db",
        }}
      >
        <span className="text-base leading-none w-5 text-center">{value === "All" ? "✦" : icon}</span>
        <span className="flex-1 text-left truncate">{value === "All" ? "All Categories" : value}</span>
        <ChevronRight className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${open ? "rotate-[270deg]" : "rotate-90"}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-60 z-50 bg-[#0d0d1c] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden py-1.5">

          {/* All */}
          <button
            onClick={() => { onChange("All"); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
              value === "All" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/6 hover:text-white"
            }`}
          >
            <span className="text-base w-6 text-center">✦</span>
            <span className="font-semibold flex-1 text-left">All Categories</span>
            {totalSaved > 0 && (
              <span className="text-[10px] text-gray-500 font-bold">{totalSaved}</span>
            )}
          </button>

          <div className="h-px bg-white/6 my-1.5 mx-3" />

          {/* Categories */}
          <div className="max-h-72 overflow-y-auto">
            {Object.keys(GPLACES_CAT_QUERIES).map(cat => {
              const a     = CAT_COLORS[cat] || "#818cf8";
              const count = byCategory[cat]?.length || 0;
              const active = value === cat;
              return (
                <button key={cat}
                  onClick={() => { onChange(cat); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all ${
                    active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className="text-base w-6 text-center leading-none">{CAT_ICONS[cat] || "◈"}</span>
                  <span className="flex-1 text-left font-medium">{cat}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `${a}25`, color: a }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const DIRECTORY = [
  { label: "Photo & Video",        cats: ["Photography", "Videography"] },
  { label: "Venue & Food",         cats: ["Venue", "Catering", "Cake & Desserts"] },
  { label: "Music & Entertainment",cats: ["Music & DJ", "Sound & AV", "Entertainment"] },
  { label: "Beauty & Style",       cats: ["Hair & Makeup"] },
  { label: "Flowers & Décor",      cats: ["Flowers & Décor", "Lighting", "Rentals"] },
  { label: "Ceremony",             cats: ["Officiant"] },
  { label: "Logistics",            cats: ["Transportation", "Security"] },
];

function VendorDirectoryModal({ onSelect, onClose, projectVendors }) {
  const countFor = cat => (projectVendors || []).filter(v => v.category === cat).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-sm bg-[#0d0d1c] border-l border-white/8 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-white">Vendor Directory</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Select a category to find vendors</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Your vendors summary */}
        <div className="px-5 py-3 border-b border-white/6 flex-shrink-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Your vendors</p>
          <button onClick={() => { onSelect("All"); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group text-left">
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">All vendors</span>
            </div>
            {projectVendors?.length > 0 && (
              <span className="text-[11px] text-gray-600 font-semibold">{projectVendors.length}</span>
            )}
          </button>
        </div>

        {/* Category groups */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
          {DIRECTORY.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.cats.map(cat => {
                  const accent = CAT_COLORS[cat] || "#818cf8";
                  const count  = countFor(cat);
                  return (
                    <button key={cat} onClick={() => { onSelect(cat); onClose(); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cat}</span>
                      </div>
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlacePreviewPanel({ item, type, category, onClose, onAdd, adding, added, inProject, projectId }) {
  const isPlace   = type === "place";
  const accent    = CAT_COLORS[category] || "#60a5fa";
  const name      = isPlace ? (item.displayName?.text || "Unknown") : (item.business_name || "Unknown");
  const cover     = isPlace
    ? (item.photoUrl || CAT_COVERS[category] || GPLACE_FALLBACK)
    : (item.cover_url || CAT_COVERS[item.category || category] || GPLACE_FALLBACK);
  const address   = isPlace ? item.formattedAddress : [item.city, item.country].filter(Boolean).join(", ");
  const phone     = isPlace ? (item.internationalPhoneNumber || item.nationalPhoneNumber) : item.phone;
  const website   = isPlace ? item.websiteUri : item.website_url;
  const rating    = isPlace ? item.rating : item.rating;
  const ratingCnt = isPlace ? item.userRatingCount : item.review_count;

  const [placeData,    setPlaceData]    = useState(null);
  const [loadingPlace, setLoadingPlace] = useState(false);

  useEffect(() => {
    if (!isPlace || !item.id) return;
    setLoadingPlace(true);
    fetch("/api/google-place-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: item.id }),
    })
      .then(r => r.json())
      .then(d => setPlaceData(d))
      .catch(() => {})
      .finally(() => setLoadingPlace(false));
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto" style={{ background: "#06060f" }}>
      <div className="min-h-full w-full">

        {/* Hero — full bleed */}
        <div className="relative h-72 sm:h-96 overflow-hidden">
          <img src={cover} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #06060f 0%, rgba(6,6,15,0.55) 50%, rgba(6,6,15,0.12) 100%)" }} />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom left, ${accent}22 0%, transparent 65%)` }} />

          {/* Nav bar */}
          <div className="absolute top-0 left-0 right-0 px-4 sm:px-8 xl:px-16 pt-5 flex items-center justify-between"
            style={{ maxWidth: 1400, margin: "0 auto", left: "50%", transform: "translateX(-50%)", width: "min(100%,1400px)" }}>
            <button onClick={onClose}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/10 hover:bg-black/70 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Identity */}
          <div className="absolute bottom-0 left-0 right-0 pb-7 px-4 sm:px-8 xl:px-16"
            style={{ maxWidth: 1400, margin: "0 auto", left: "50%", transform: "translateX(-50%)", width: "min(100%,1400px)" }}>
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 shadow-2xl"
                style={{ borderColor: `${accent}60`, background: `${accent}22` }}>
                <img src={cover} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = GPLACE_FALLBACK; }} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight truncate drop-shadow-lg">{name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {(category || item.category) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: `${accent}35`, color: accent, border: `1px solid ${accent}55` }}>
                      {category || item.category}
                    </span>
                  )}
                  {isPlace
                    ? <span className="px-2 py-0.5 rounded-full bg-[#4285F4]/80 text-[10px] font-black text-white backdrop-blur-sm">G Maps</span>
                    : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/70 text-[10px] font-bold text-white backdrop-blur-sm"><BadgeCheck className="w-3 h-3" /> Registered</span>
                  }
                  {rating > 0 && (
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">{Number(rating).toFixed(1)}</span>
                      {ratingCnt > 0 && <span className="text-[10px] text-white/50">({Number(ratingCnt).toLocaleString()})</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 xl:px-16 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact / basic info */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Details</p>
              {address && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><MapPin className="w-3.5 h-3.5 text-gray-500" /></div>
                  <span className="text-sm text-gray-400 leading-relaxed">{address}</span>
                </div>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors"><Phone className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" /></div>
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{phone}</span>
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors"><Globe className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400" /></div>
                  <span className="text-sm text-gray-400 group-hover:text-indigo-300 truncate transition-colors">{website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-600 ml-auto shrink-0" />
                </a>
              )}
              {!isPlace && (item.bio || item.tagline) && (
                <p className="text-sm text-gray-400 leading-relaxed pt-1 border-t border-white/5">{item.bio || item.tagline}</p>
              )}
            </div>

            {/* Google About + Hours */}
            {(loadingPlace || placeData?.editorialSummary || placeData?.openingHours) && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0"><span className="text-[9px] font-black text-white">G</span></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">About (Google)</p>
                </div>
                {loadingPlace && !placeData && (
                  <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading…</span></div>
                )}
                {placeData?.editorialSummary && <p className="text-sm text-gray-400 leading-relaxed">{placeData.editorialSummary}</p>}
                {placeData?.openingHours && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Opening Hours</p>
                    <div className="space-y-1">
                      {placeData.openingHours.map((day, i) => {
                        const [dayName, ...rest] = day.split(": ");
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-gray-500 w-24 shrink-0 font-medium">{dayName}</span>
                            <span className="text-gray-400">{rest.join(": ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Google Reviews */}
            {(loadingPlace || (placeData?.reviews?.length > 0)) && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0"><span className="text-[9px] font-black text-white">G</span></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Google Reviews</p>
                  {placeData?.reviews?.length > 0 && <span className="ml-auto text-[10px] text-gray-600">{placeData.reviews.length}</span>}
                </div>
                {loadingPlace && !placeData ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/8" /><div className="flex-1 space-y-1"><div className="h-3 bg-white/8 rounded-full w-1/3" /><div className="h-2.5 bg-white/5 rounded-full w-1/4" /></div></div>
                        <div className="h-3 bg-white/5 rounded-full w-full" /><div className="h-3 bg-white/5 rounded-full w-4/5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {(placeData?.reviews || []).map((review, i) => {
                      const author = review.authorAttribution?.displayName || "Anonymous";
                      const initials = author.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
                      const colors = ["#818cf8","#34d399","#f472b6","#fbbf24","#38bdf8","#a78bfa"];
                      const col = colors[i % colors.length];
                      return (
                        <div key={i} className="space-y-2.5">
                          {i > 0 && <div className="h-px bg-white/5" />}
                          <div className="flex items-start gap-3">
                            {review.authorPhotoUrl
                              ? <img src={review.authorPhotoUrl} alt={author} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              : <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black" style={{ background: `${col}25`, color: col }}>{initials}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-white truncate">{author}</p>
                                <span className="text-[10px] text-gray-600 shrink-0">{review.relativePublishTimeDescription}</span>
                              </div>
                              {review.rating > 0 && (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />)}
                                </div>
                              )}
                            </div>
                          </div>
                          <ReviewText text={review.text?.text || review.originalText?.text} indent />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Other suggestions */}
            {(category || item.category) && (
              <OtherSuggestions
                category={category || item.category}
                currentVendorName={name}
                projectId={projectId}
                projectVendorNames={new Set([name?.toLowerCase().trim()])}
              />
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Price card */}
            {!isPlace && item.base_price > 0 && (
              <div className="rounded-2xl px-5 py-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Starting from</p>
                <p className="text-3xl font-black text-white leading-none">${Number(item.base_price).toLocaleString()}</p>
                {item.currency && item.currency !== "USD" && (
                  <p className="text-xs text-gray-500 mt-1">{item.currency}</p>
                )}
              </div>
            )}

            {/* CTA card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-5 pt-5 pb-4 space-y-2.5">
                {/* Primary CTA */}
                <button
                  onClick={() => !inProject && !added && onAdd(item)}
                  disabled={adding || added || inProject}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-[0.97]"
                  style={inProject || added
                    ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
                    : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 6px 20px rgba(79,70,229,0.35)" }}>
                  {adding   ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                   : inProject ? <><CheckCircle className="w-4 h-4" /> Already in Project</>
                   : added      ? <><CheckCircle className="w-4 h-4" /> Added to Project!</>
                   : <><Plus className="w-4 h-4" /> Add to Project</>
                  }
                </button>

                {/* Secondary actions */}
                {phone && (
                  <a href={`tel:${phone}`}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                    <Phone className="w-4 h-4" /> Call Vendor
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                    <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
              </div>
            </div>

            {/* Meta / verification card */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">About this vendor</p>
              {isPlace && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-white">G</span>
                  </div>
                  <span className="text-xs text-gray-400">Listed on Google Maps</span>
                </div>
              )}
              {!isPlace && item.verification_status === "verified" && (
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-400">Verified Vendor</span>
                </div>
              )}
              {(category || item.category) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Category</span>
                  <span className="text-xs font-semibold text-white">{category || item.category}</span>
                </div>
              )}
              {!isPlace && (item.city || item.country) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Location</span>
                  <span className="text-xs font-semibold text-white">{[item.city, item.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {rating > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-white">{Number(rating).toFixed(1)}</span>
                    {ratingCnt > 0 && <span className="text-[10px] text-gray-600">/ {Number(ratingCnt).toLocaleString()} reviews</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactVendorCard({ vendor, onOpen }) {
  const status = normalizeStatus(vendor.booking_status);
  const pm     = STATUS_META[status];
  const accent = CAT_COLORS[vendor.category] || "#818cf8";
  const icon   = CAT_ICONS[vendor.category];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(vendor)}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onOpen?.(vendor)}
      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/4 border border-white/6 hover:bg-white/8 hover:border-white/14 transition-all cursor-pointer group select-none"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
        style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
        {icon
          ? <span className="leading-none">{icon}</span>
          : <span className="text-sm font-black" style={{ color: accent }}>{vendor.name?.charAt(0)?.toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">{vendor.name}</p>
        <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: accent }}>{vendor.category || "Other"}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pm.cls}`}>{pm.label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
    </div>
  );
}

function RecommendedCategoryCard({ cat, onSelect, covered }) {
  const accent = CAT_COLORS[cat] || "#818cf8";
  const icon   = CAT_ICONS[cat]  || "◈";
  const cover  = CAT_COVERS[cat] || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70";

  return (
    <button
      onClick={() => onSelect(cat)}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl h-36 group text-left cursor-pointer w-full border border-white/8 hover:border-white/20 transition-all"
    >
      {/* Background image */}
      <img
        src={cover}
        alt={cat}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Accent top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />

      {/* Already covered badge */}
      {covered && (
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="text-2xl leading-none block mb-1.5">{icon}</span>
        <p className="text-sm font-bold text-white leading-tight">{cat}</p>
        <p className="text-[10px] text-white/50 mt-0.5 group-hover:text-white/80 transition-colors">
          Find vendors →
        </p>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 50% 100%, ${accent}30 0%, transparent 70%)` }}
      />
    </button>
  );
}

function VendorDiscovery({ projectId, project, projectVendorNames, realVendors = [], byCategory = {}, aiVendors = [], onOpenAdd }) {
  const { createVendor, updateVendor } = usePlannerStore();

  const projectLocation = [project?.city, project?.country].filter(Boolean).join(", ");

  const [search,           setSearch]           = useState("");
  const [city,             setCity]             = useState(project?.city    || "");
  const [state,            setState]            = useState("");
  const [country,          setCountry]          = useState(project?.country || "");
  const [category,         setCategory]         = useState("All");
  const [showAllYourVendors, setShowAllYourVendors] = useState(false);
  const YOUR_VENDORS_PREVIEW = 4;
  const [places,        setPlaces]        = useState([]);
  const [searchError,   setSearchError]   = useState("");
  const [portalVendors, setPortalVendors] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [adding,          setAdding]          = useState(null);
  const [added,           setAdded]           = useState(new Set());
  const [showDirectory,   setShowDirectory]   = useState(false);
  const [selectedVendor,  setSelectedVendor]  = useState(null);
  const [editingVendor,   setEditingVendor]   = useState(null);
  const [showVendorForm,  setShowVendorForm]  = useState(false);
  const [preview,         setPreview]         = useState(null); // { item, type: "place"|"portal" }

  const locationStr = [city, state, country].filter(Boolean).join(", ");

  function isInProject(name) {
    return projectVendorNames?.has(name?.toLowerCase().trim()) ?? false;
  }

  // Saved vendors filtered by search + category
  const filteredVendors = useMemo(() => {
    let list = realVendors;
    if (category !== "All") list = list.filter(v => v.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        (v.category || "").toLowerCase().includes(q) ||
        (v.contact_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [realVendors, category, search]);

  const filteredByCategory = useMemo(() => {
    return filteredVendors.reduce((acc, v) => {
      const cat = v.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v);
      return acc;
    }, {});
  }, [filteredVendors]);

  async function runSearch(cat) {
    const q   = GPLACES_CAT_QUERIES[cat] || cat.toLowerCase();
    const loc = [city, state, country].filter(Boolean).join(", ");
    setLoading(true);
    setPlaces([]);
    setSearchError("");
    fetch("/api/google-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, location: loc }),
    })
      .then(r => r.json())
      .then(d => {
        // d.error takes priority — route returns {error, places:[]} on failure
        if (d.error) {
          setSearchError(d.error);
        } else if (Array.isArray(d.places)) {
          setPlaces(d.places);
        } else {
          setSearchError("Location search is temporarily unavailable. Please try again.");
        }
      })
      .catch(() => setSearchError("Location search is temporarily unavailable. Please try again."))
      .finally(() => setLoading(false));

    setPortalLoading(true);
    setPortalVendors([]);
    const params = new URLSearchParams({ limit: 20, sort: "rating", category: cat });
    fetch(`/api/vendors?${params}`)
      .then(r => r.json())
      .then(d => setPortalVendors(d.data?.vendors || []))
      .catch(() => setPortalVendors([]))
      .finally(() => setPortalLoading(false));
  }

  function selectCategory(cat) {
    setCategory(cat);
    setPlaces([]);
    setPortalVendors([]);
    if (cat !== "All") runSearch(cat);
  }

  async function handleAddPlace(place) {
    const key = `g_${place.id}`;
    setAdding(key);
    const res = await createVendor(projectId, {
      name:             place.displayName?.text || "Unknown",
      category,
      google_place_id:  place.id,
      image_url:        place.photoUrl || "",
      contact_phone:    place.internationalPhoneNumber || place.nationalPhoneNumber || "",
      website_url:      place.websiteUri || "",
      notes: [
        place.formattedAddress,
        place.rating ? `Google Rating: ${place.rating}/5 (${place.userRatingCount?.toLocaleString()} reviews)` : null,
      ].filter(Boolean).join("\n"),
      booking_status: "researching",
    });
    setAdding(null);
    if (res.success) { setAdded(prev => new Set([...prev, key])); toast.success(`${place.displayName?.text} added`); }
    else toast.error(res.error || "Failed to add");
  }

  async function handleAddPortal(vendor) {
    const key = `p_${vendor.id}`;
    setAdding(key);
    const res = await createVendor(projectId, {
      name: vendor.business_name, category: vendor.category || category || "Other",
      image_url: vendor.logo_url || "", contact_phone: vendor.phone || "",
      contact_email: vendor.email || "", website_url: vendor.website_url || "",
      notes: vendor.bio || vendor.tagline || "", booking_status: "researching",
    });
    setAdding(null);
    if (res.success) { setAdded(prev => new Set([...prev, key])); toast.success(`${vendor.business_name} added`); }
    else toast.error(res.error || "Failed to add");
  }

  function SectionSkeleton() {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/4 border border-white/6 p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/8" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/8 rounded-full w-3/4" />
                <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full w-full" />
            <div className="h-3 bg-white/5 rounded-full w-2/3" />
            <div className="h-7 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const accent = CAT_COLORS[category] || "#818cf8";

  return (
    <div>
      {showDirectory && (
        <VendorDirectoryModal
          onSelect={selectCategory}
          onClose={() => setShowDirectory(false)}
          projectVendors={realVendors}
        />
      )}

      {preview && (
        <PlacePreviewPanel
          item={preview.item}
          type={preview.type}
          category={category}
          projectId={projectId}
          onClose={() => setPreview(null)}
          onAdd={preview.type === "place" ? handleAddPlace : handleAddPortal}
          adding={adding === (preview.type === "place" ? `g_${preview.item.id}` : `p_${preview.item.id}`)}
          added={added.has(preview.type === "place" ? `g_${preview.item.id}` : `p_${preview.item.id}`)}
          inProject={isInProject(preview.type === "place" ? preview.item.displayName?.text : preview.item.business_name)}
        />
      )}

      {selectedVendor && (
        <VendorDetailPanel
          key={selectedVendor.id}
          vendor={realVendors.find(v => v.id === selectedVendor.id) || selectedVendor}
          projectId={projectId}
          onClose={() => setSelectedVendor(null)}
          onEdit={v => { setEditingVendor(v); setShowVendorForm(true); setSelectedVendor(null); }}
        />
      )}

      {showVendorForm && (
        <VendorFormModal
          projectId={projectId}
          vendor={editingVendor}
          onClose={() => { setShowVendorForm(false); setEditingVendor(null); }}
        />
      )}

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-10 bg-[#09090f]/95 backdrop-blur-sm border-b border-white/6 px-3 sm:px-6 py-3 space-y-2.5">

        {/* Row 1: category + search SIDE BY SIDE (no wrap on mobile) */}
        <div className="flex items-center gap-2">

          {/* Category dropdown — shrinks to icon+text on xs */}
          <div className="flex-shrink-0">
            <CategoryDropdown
              value={category}
              onChange={selectCategory}
              byCategory={filteredByCategory}
            />
          </div>

          {/* Vendor name search — fills remaining space */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors…"
              className="w-full pl-9 pr-7 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Browse — hidden on xs, visible sm+ */}
          <button onClick={() => setShowDirectory(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 text-xs font-bold border border-violet-500/20 transition-all flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> Browse
          </button>
        </div>

        {/* Row 2: location fields + search button — only shown when a category is selected */}
        <div className={`flex items-center gap-2 ${category === "All" ? "hidden" : "flex"}`}>
          <div className="flex flex-1 gap-2 min-w-0">
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && category !== "All" && runSearch(category)}
              placeholder="City"
              className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition-colors"
            />
            <input
              value={state}
              onChange={e => setState(e.target.value)}
              onKeyDown={e => e.key === "Enter" && category !== "All" && runSearch(category)}
              placeholder="State"
              className="flex-1 min-w-0 hidden sm:block px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition-colors"
            />
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
              onKeyDown={e => e.key === "Enter" && category !== "All" && runSearch(category)}
              placeholder="Country"
              className="flex-1 min-w-0 hidden sm:block px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition-colors"
            />
          </div>
          <button
            onClick={() => category !== "All" && runSearch(category)}
            disabled={category === "All" || loading || portalLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 flex-shrink-0"
          >
            {(loading || portalLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden xs:inline">Search</span>
          </button>
          {locationStr && (
            <span className="hidden sm:flex text-[11px] text-gray-500 items-center gap-1">
              <MapPin className="w-3 h-3" /> {locationStr}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-8 pb-12">

        {/* ── ALL view ── */}
        {category === "All" && (
          <>
            {/* Your Vendors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-white">Your Vendors</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {realVendors.length > 0
                      ? `${realVendors.length} vendor${realVendors.length !== 1 ? "s" : ""} saved to this project`
                      : "No vendors added yet"}
                  </p>
                </div>
                <button onClick={onOpenAdd}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 text-xs font-bold border border-indigo-500/20 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {filteredVendors.length > 0 ? (
                <>
                  {/* Grouped by category with dividers — matches mobile layout */}
                  {(() => {
                    const preview = showAllYourVendors ? filteredVendors : filteredVendors.slice(0, YOUR_VENDORS_PREVIEW);
                    const groups = preview.reduce((acc, v) => {
                      const cat = v.category || "Other";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(v);
                      return acc;
                    }, {});
                    return Object.entries(groups).map(([cat, vendors]) => {
                      const accent = CAT_COLORS[cat] || "#818cf8";
                      return (
                        <div key={cat} className="mb-4">
                          {/* Category divider row — same as mobile */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: `${accent}20`, border: `1px solid ${accent}38` }}>
                              <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                            </div>
                            <span className="text-xs font-black text-white">{cat}</span>
                            <span className="text-[10px] text-white/30">{vendors.length}</span>
                            <div className="flex-1 h-px" style={{ background: `${accent}28` }} />
                          </div>
                          <div className="space-y-1.5">
                            {vendors.map(v => (
                              <CompactVendorCard key={v.id} vendor={v} onOpen={setSelectedVendor} />
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {filteredVendors.length > YOUR_VENDORS_PREVIEW && (
                    <button
                      onClick={() => setShowAllYourVendors(v => !v)}
                      className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {showAllYourVendors ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> See all {filteredVendors.length} vendors</>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-dashed border-white/10">
                  <Store className="w-4 h-4 text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-600">
                    {search ? `No vendors match "${search}"` : "No vendors yet — use a category below to start finding vendors"}
                  </p>
                </div>
              )}
            </div>

            {/* Recommended for your event */}
            <div>
              <div className="mb-3">
                <h2 className="text-base font-bold text-white">Recommended for your event</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="sm:hidden">Tap</span>
                  <span className="hidden sm:inline">Click</span>
                  {" "}a category to search vendors on Google Maps
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {Object.keys(GPLACES_CAT_QUERIES)
                  .sort((a, b) => {
                    const hasA = !!byCategory[a]?.length;
                    const hasB = !!byCategory[b]?.length;
                    return hasA === hasB ? 0 : hasA ? 1 : -1;
                  })
                  .map(cat => (
                    <RecommendedCategoryCard
                      key={cat}
                      cat={cat}
                      onSelect={selectCategory}
                      covered={!!byCategory[cat]?.length}
                    />
                  ))}
              </div>
            </div>
          </>
        )}

        {/* ── Category view ── */}
        {category !== "All" && (
          <>
            {/* Category page header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}>
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: accent }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{category}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {locationStr
                    ? `Searching near ${locationStr}`
                    : "Enter a city below to search Google Maps"}
                </p>
              </div>
              <button onClick={() => selectCategory("All")}
                className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors font-semibold">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Saved in project */}
            {filteredByCategory[category]?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">In your project</p>
                  <span className="text-[11px] text-gray-600">{filteredByCategory[category].length}</span>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div className="space-y-1.5">
                  {filteredByCategory[category].map(v => (
                    <CompactVendorCard key={v.id} vendor={v} onOpen={setSelectedVendor} />
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-black text-white">G</span>
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Google Maps</p>
                {!loading && places.length > 0 && <span className="text-[11px] text-gray-600">{places.length} results</span>}
                <div className="flex-1 h-px bg-white/6" />
              </div>
              {loading ? <SectionSkeleton /> : searchError ? (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-400">{searchError}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      To fix: go to{" "}
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-amber-400/80 underline hover:text-amber-300">
                        Google Cloud Console
                      </a>
                      {" "}→ Credentials → update or create a new API key with Places API (New) enabled, then add it as{" "}
                      <code className="text-[10px] bg-white/8 px-1 rounded">VENDOR_GOOGLE_KEY</code> in <code className="text-[10px] bg-white/8 px-1 rounded">web/.env.local</code> and restart the server.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSearchError(""); runSearch(category); }}
                    className="shrink-0 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded border border-amber-500/20 hover:border-amber-500/40"
                  >
                    Retry
                  </button>
                </div>
              ) : places.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/6">
                  <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-500">Enter a city, state, or country above and click Search to find {category.toLowerCase()} vendors nearby</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {places.map(place => (
                    <GooglePlaceCard key={place.id} place={place} category={category}
                      onAdd={handleAddPlace} adding={adding === `g_${place.id}`}
                      added={added.has(`g_${place.id}`)} inProject={isInProject(place.displayName?.text)}
                      onOpen={p => setPreview({ item: p, type: "place" })} />
                  ))}
                </div>
              )}
            </div>

            {/* Registered */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Registered Vendors</p>
                {!portalLoading && portalVendors.length > 0 && <span className="text-[11px] text-gray-600">{portalVendors.length} results</span>}
                <div className="flex-1 h-px bg-white/6" />
              </div>
              {portalLoading ? <SectionSkeleton /> : portalVendors.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/6">
                  <BadgeCheck className="w-4 h-4 text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-500">No registered vendors in this category yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {portalVendors.map(v => (
                    <PortalVendorCard key={v.id} vendor={v} category={category}
                      onAdd={handleAddPortal} adding={adding === `p_${v.id}`}
                      added={added.has(`p_${v.id}`)} inProject={isInProject(v.business_name)}
                      onOpen={v2 => setPreview({ item: v2, type: "portal" })} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { projectId }  = useParams();
  const { vendors, currentProject, loading, fetchVendors } = usePlannerStore();

  useEffect(() => { fetchVendors(projectId); }, [projectId]);

  const [showForm,      setShowForm]      = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const realVendors = useMemo(() => vendors.filter(v => !v.ai_suggested), [vendors]);

  const projectVendorNames = useMemo(
    () => new Set(realVendors.map(v => v.name?.toLowerCase().trim()).filter(Boolean)),
    [realVendors]
  );

  const byCategory = useMemo(() => realVendors.reduce((acc, v) => {
    const cat = v.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {}), [realVendors]);

  const bookedCount    = realVendors.filter(v => normalizeStatus(v.booking_status) === "booked").length;
  const totalQuoted    = realVendors.reduce((s, v) => s + Number(v.quoted_price    || 0), 0);
  const totalConfirmed = realVendors.reduce((s, v) => s + Number(v.confirmed_price || 0), 0);

  function openAdd()   { setEditingVendor(null); setShowForm(true); }
  function openEdit(v) { setEditingVendor(v);    setShowForm(true); }
  function handleFormClose() { setShowForm(false); setEditingVendor(null); }

  return (
    <div className="flex h-full overflow-hidden bg-[#09090f]">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* ── Page header — hidden on mobile (VendorDiscovery has its own sticky toolbar) ── */}
        <div className="hidden sm:block px-4 sm:px-6 pt-5 pb-4 border-b border-white/6 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Vendors</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentProject?.name ? `${currentProject.name} · ` : ""}
                {realVendors.length > 0
                  ? `${realVendors.length} vendor${realVendors.length !== 1 ? "s" : ""} in this project`
                  : "Find and manage vendors for your event"}
              </p>
            </div>
            <button onClick={openAdd}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>

          {/* Stats — only when there are vendors, hidden on mobile (VendorDiscovery shows the info) */}
          {realVendors.length > 0 && (
            <div className="hidden sm:grid grid-cols-3 gap-3">
              <div className="bg-white/3 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-none">{realVendors.length}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Total</p>
                </div>
              </div>
              <div className={`border rounded-2xl px-4 py-3 flex items-center gap-3 ${bookedCount > 0 ? "bg-emerald-500/5 border-emerald-500/15" : "bg-white/3 border-white/8"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bookedCount > 0 ? "bg-emerald-500/20 border border-emerald-500/25" : "bg-white/5 border border-white/10"}`}>
                  <CheckCircle className={`w-4 h-4 ${bookedCount > 0 ? "text-emerald-400" : "text-gray-600"}`} />
                </div>
                <div>
                  <p className={`text-lg font-black leading-none ${bookedCount > 0 ? "text-emerald-400" : "text-gray-600"}`}>{bookedCount}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Confirmed</p>
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-amber-300 leading-none truncate">
                    {totalConfirmed > 0 ? `$${fmt(totalConfirmed)}` : totalQuoted > 0 ? `$${fmt(totalQuoted)}` : "—"}
                  </p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    {totalConfirmed > 0 ? "Committed" : "Quoted"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <VendorDiscovery
            projectId={projectId}
            project={currentProject}
            projectVendorNames={projectVendorNames}
            realVendors={realVendors}
            byCategory={byCategory}
            aiVendors={vendors.filter(v => v.ai_suggested)}
            onOpenAdd={openAdd}
          />
        </div>
      </div>

      {showForm && (
        <VendorFormModal projectId={projectId} vendor={editingVendor} onClose={handleFormClose} />
      )}
    </div>
  );
}
