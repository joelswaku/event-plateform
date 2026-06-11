"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  ArrowLeft, Edit3, Star, Mail, Phone, Globe, ExternalLink,
  FileText, Copy, Trash2, Check, Loader2, CheckCircle,
  ChevronRight, Ban, Sparkles, DollarSign, MapPin,
  MessageSquare, Search, BadgeCheck, X,
} from "lucide-react";
import toast from "react-hot-toast";

// ── helpers (duplicated here so this page is self-contained) ──────────────

const STATUS_META = {
  researching: { label: "Researching", cls: "bg-gray-500/20 text-gray-400",       border: "border-gray-500/20",  dot: "#6b7280" },
  contacted:   { label: "Contacted",   cls: "bg-blue-500/20  text-blue-400",      border: "border-blue-500/20",  dot: "#3b82f6" },
  quoted:      { label: "Quoted",      cls: "bg-amber-500/20 text-amber-400",     border: "border-amber-500/20", dot: "#f59e0b" },
  booked:      { label: "Booked",      cls: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/20",dot: "#10b981" },
  rejected:    { label: "Rejected",    cls: "bg-red-500/20   text-red-400",       border: "border-red-500/20",   dot: "#ef4444" },
};
const STATUS_ICONS = {
  researching: Search, contacted: MessageSquare,
  quoted: FileText, booked: BadgeCheck, rejected: Ban,
};
const STATUSES = ["researching", "contacted", "quoted", "booked", "rejected"];

const CAT_COLORS = {
  "Photography": "#818cf8", "Videography": "#a78bfa", "Catering": "#fbbf24",
  "Music & DJ": "#4ade80", "Flowers & Décor": "#f472b6", "Venue": "#38bdf8",
  "Lighting": "#fde68a", "Sound & AV": "#34d399", "Hair & Makeup": "#f9a8d4",
  "Officiant": "#c084fc", "Cake & Desserts": "#fb923c", "Transportation": "#60a5fa",
  "Rentals": "#a3e635", "Entertainment": "#f87171", "Security": "#94a3b8",
};
const CAT_COVERS = {
  "Photography":    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "Videography":    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
  "Catering":       "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
  "Music & DJ":     "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
  "Flowers & Décor":"https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80",
  "Venue":          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
  "Lighting":       "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  "Hair & Makeup":  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80",
  "Transportation": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
  "Entertainment":  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
  "Cake & Desserts":"https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80",
  "Officiant":      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
  "Rentals":        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
  "Security":       "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=800&q=80",
  "Sound & AV":     "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
};

function normalizeStatus(s) {
  if (!s) return "researching";
  const lower = String(s).toLowerCase();
  if (lower === "confirmed") return "booked";
  return STATUS_META[lower] ? lower : "researching";
}
function fmt(n) { return Number(n || 0).toLocaleString(); }

// ── Star rating ───────────────────────────────────────────────────────────

function StarRating({ value = 0, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(r => (
        <button key={r} type="button"
          onClick={() => onChange?.(r === value ? 0 : r)}
          onMouseEnter={() => onChange && setHovered(r)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`w-5 h-5 transition-colors ${r <= (hovered || value) ? "text-amber-400 fill-amber-400" : "text-gray-700"}`} />
        </button>
      ))}
    </div>
  );
}

// ── Quote request modal (inline) ──────────────────────────────────────────

function QuoteModal({ vendor, projectId, onClose }) {
  const { updateVendor } = usePlannerStore();
  const [form, setForm] = useState({
    amount: vendor.quoted_price ? String(vendor.quoted_price) : "",
    currency: vendor.currency || "USD",
    eventDate: "", eventType: "", guestCount: "", services: "",
    message: `Hi ${vendor.contact_name || vendor.name},\n\nI'm interested in booking your services for my upcoming event.\n\nPlease provide me with a detailed quote.\n\nThank you.`,
  });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-amber-500/40 transition-colors";

  async function send() {
    if (!form.amount) { toast.error("Enter a quote amount"); return; }
    setSending(true);
    await updateVendor(projectId, vendor.id, { quoted_price: parseFloat(form.amount) || 0, currency: form.currency, booking_status: "quoted" });
    if (vendor.contact_email) {
      const subject = encodeURIComponent(`Quote Request — ${form.eventType || "Upcoming Event"}`);
      const body    = encodeURIComponent(`Hi ${vendor.contact_name || vendor.name},\n\n${form.message}\n\n--- Event Details ---\n${form.eventDate ? `Date: ${form.eventDate}\n` : ""}${form.eventType ? `Event: ${form.eventType}\n` : ""}${form.guestCount ? `Guests: ${form.guestCount}\n` : ""}${form.amount ? `\nBudget: ${form.currency} ${form.amount}\n` : ""}\nThank you!`);
      window.open(`mailto:${vendor.contact_email}?subject=${subject}&body=${body}`, "_blank");
    }
    setSent(true);
    setSending(false);
    toast.success("Quote saved" + (vendor.contact_email ? " — email client opened" : ""));
    setTimeout(onClose, 1400);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d0d1a] rounded-2xl border border-white/8 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-base font-bold text-white">Send Quote Request</p>
            <p className="text-xs text-gray-500 mt-0.5">To: <span className="text-amber-300 font-semibold">{vendor.contact_name || vendor.name}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex gap-2">
            <select value={form.currency} onChange={f("currency")} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/40">
              {["USD","EUR","GBP","CAD","AUD","AED"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.amount} onChange={f("amount")} type="number" placeholder="Quote amount *" className={`${inp} flex-1`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.eventDate}  onChange={f("eventDate")}  type="date"  className={inp} />
            <input value={form.eventType}  onChange={f("eventType")}  placeholder="Event type"  className={inp} />
            <input value={form.guestCount} onChange={f("guestCount")} type="number" placeholder="Guests" className={inp} />
            <input value={form.services}   onChange={f("services")}   placeholder="Services needed" className={inp} />
          </div>
          <textarea value={form.message} onChange={f("message")} rows={5} className={`${inp} resize-none`} />
        </div>
        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5">Cancel</button>
          <button onClick={send} disabled={sending || sent}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: sent ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg,#d97706,#f59e0b)", color: sent ? "#10b981" : "#fff", border: sent ? "1px solid rgba(16,185,129,0.3)" : "none" }}>
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : sent  ? <><CheckCircle className="w-4 h-4" /> Sent!</>
              : <><Mail className="w-4 h-4" /> {vendor.contact_email ? "Save & Email" : "Save Quote"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function VendorDetailPage() {
  const { projectId, vendorId } = useParams();
  const router = useRouter();
  const { vendors, fetchVendors, updateVendor, deleteVendor } = usePlannerStore();

  useEffect(() => { fetchVendors(projectId); }, [projectId]);

  const vendor = vendors.find(v => v.id === vendorId);

  const [savingStatus,  setSavingStatus]  = useState(false);
  const [savingRating,  setSavingRating]  = useState(false);
  const [editingNotes,  setEditingNotes]  = useState(false);
  const [notes,         setNotes]         = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQuote,     setShowQuote]     = useState(false);

  useEffect(() => { if (vendor) setNotes(vendor.notes || ""); }, [vendor?.id]);

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">Loading vendor…</p>
          <button
            onClick={() => router.push(`/planner/${projectId}/vendors`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm hover:text-white hover:bg-white/10 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  const status = normalizeStatus(vendor.booking_status);
  const accent = CAT_COLORS[vendor.category] || "#818cf8";
  const cover  = vendor.image_url || (vendor.category && CAT_COVERS[vendor.category]) || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";

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
    if (res.success) { toast.success("Vendor removed"); router.push(`/planner/${projectId}/vendors`); }
    else toast.error(res.error || "Failed to delete");
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors";

  return (
    <div className="bg-[#09090f] min-h-full">

      {/* ── Hero ── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={cover} alt={vendor.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-[#09090f]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090f]/20 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-semibold border border-white/10 hover:bg-black/80 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Vendors
          </button>
          <div className="flex items-center gap-2">
            {vendor.website_url && (
              <a href={vendor.website_url} target="_blank" rel="noreferrer"
                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/10 hover:bg-black/80 transition-all">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Badges bottom-left */}
        <div className="absolute bottom-5 left-6 flex items-center gap-2">
          {vendor.category && (
            <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg"
              style={{ background: `${accent}dd`, color: "#fff" }}>
              {vendor.category}
            </span>
          )}
          {vendor.ai_suggested && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-600/80 backdrop-blur-sm text-[11px] font-bold text-white">
              <Sparkles className="w-3 h-3" /> AI Suggested
            </span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${STATUS_META[status].cls}`}>
            {STATUS_META[status].label}
          </span>
        </div>
      </div>

      {/* ── Sticky name bar ── */}
      <div className="sticky top-0 z-20 bg-[#09090f]/95 backdrop-blur-sm border-b border-white/8 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${accent}44,${accent}22)` }}>
            {vendor.image_url
              ? <img src={vendor.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-black" style={{ color: accent }}>
                  {vendor.name?.charAt(0)?.toUpperCase()}
                </div>
            }
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-none truncate">{vendor.name}</h1>
            {vendor.contact_name && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{vendor.contact_name}</p>}
          </div>
        </div>
        <button onClick={() => setShowQuote(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 shadow-lg"
          style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}>
          <FileText className="w-4 h-4" /> Request Quote
        </button>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-8">

          {/* Identity */}
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden border border-white/10 shadow-xl"
              style={{ background: `linear-gradient(135deg,${accent}44,${accent}22)` }}>
              {vendor.image_url
                ? <img src={vendor.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-black" style={{ color: accent }}>
                    {vendor.name?.charAt(0)?.toUpperCase()}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-black text-white leading-tight mb-2">{vendor.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(vendor.rating) ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />
                    ))}
                    <span className="text-sm font-bold text-white ml-1">{Number(vendor.rating).toFixed(1)}</span>
                  </div>
                )}
                {vendor.contact_email && (
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{vendor.contact_email}</span>
                )}
                {vendor.contact_phone && (
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{vendor.contact_phone}</span>
                )}
              </div>
              {vendor.website_url && (
                <a href={vendor.website_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  {vendor.website_url.replace(/^https?:\/\//, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white/2 border border-white/6 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Notes & Requirements</h3>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  {vendor.notes ? "Edit" : "+ Add"}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} autoFocus
                  className={`${inp} resize-none`} placeholder="Notes, requirements, negotiation details…" />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => { setNotes(vendor.notes || ""); setEditingNotes(false); }}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold">Cancel</button>
                </div>
              </div>
            ) : vendor.notes ? (
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{vendor.notes}</p>
            ) : (
              <p className="text-sm text-gray-600 italic">No notes yet</p>
            )}
          </div>

          {/* Pipeline */}
          <div className="rounded-2xl bg-white/2 border border-white/6 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Pipeline Stage</h3>
            <div className="flex items-center gap-1">
              {STATUSES.filter(s => s !== "rejected").map((s, idx, arr) => {
                const active    = status === s;
                const past      = STATUSES.indexOf(status) > STATUSES.indexOf(s);
                const isLoading = savingStatus === s;
                const Icon      = STATUS_ICONS[s];
                return (
                  <React.Fragment key={s}>
                    <button onClick={() => saveStatus(s)} disabled={!!savingStatus}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all flex-1 min-w-0 text-xs ${
                        active ? `${STATUS_META[s].cls} border ${STATUS_META[s].border}` : "hover:bg-white/5 text-gray-600 hover:text-gray-300"
                      }`}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                        : past ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <Icon className="w-4 h-4" />}
                      <span className="font-bold leading-tight text-center">{STATUS_META[s].label}</span>
                    </button>
                    {idx < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />}
                  </React.Fragment>
                );
              })}
              <ChevronRight className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
              <button onClick={() => saveStatus("rejected")} disabled={!!savingStatus}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all text-xs ${
                  status === "rejected" ? "bg-red-500/15 border border-red-500/20 text-red-400" : "hover:bg-white/5 text-gray-600 hover:text-gray-300"
                }`}>
                <Ban className="w-4 h-4" />
                <span className="font-bold">Rejected</span>
              </button>
            </div>
          </div>

          {/* Your rating */}
          <div className="rounded-2xl bg-white/2 border border-white/6 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Your Rating</h3>
            <div className="flex items-center gap-4">
              {savingRating
                ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                : <StarRating value={vendor.rating || 0} onChange={saveRating} />
              }
              {vendor.rating > 0 && (
                <span className="text-lg font-black text-amber-400">{vendor.rating}/5</span>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-6">
            <h3 className="text-sm font-bold text-white mb-3">Danger Zone</h3>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400 flex-1">
                  Remove <span className="text-white font-semibold">{vendor.name}</span> from this project?
                </p>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold">Cancel</button>
                <button onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20">
                  Remove
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" /> Remove this vendor
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">

            {/* Pricing */}
            <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#0d0d1a]">
              <div className="px-5 py-4 border-b border-white/6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Pricing</p>
                {vendor.confirmed_price > 0 ? (
                  <p className="text-2xl font-black text-emerald-400">
                    {vendor.currency || "USD"} {fmt(vendor.confirmed_price)}
                    <span className="text-sm font-normal text-emerald-400/60 ml-2">confirmed</span>
                  </p>
                ) : vendor.quoted_price > 0 ? (
                  <p className="text-2xl font-black text-amber-300">
                    {vendor.currency || "USD"} {fmt(vendor.quoted_price)}
                    <span className="text-sm font-normal text-amber-300/60 ml-2">quoted</span>
                  </p>
                ) : (
                  <p className="text-base font-bold text-gray-500">Price not set</p>
                )}
              </div>
              <div className="px-5 py-4 space-y-2">
                <button onClick={() => setShowQuote(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  <FileText className="w-4 h-4" /> Request a Quote
                </button>
                {vendor.contact_email && (
                  <a href={`mailto:${vendor.contact_email}`}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                )}
                {vendor.contact_phone && (
                  <a href={`tel:${vendor.contact_phone}`}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                    <Phone className="w-4 h-4" /> Call Vendor
                  </a>
                )}
                {vendor.website_url && (
                  <a href={vendor.website_url} target="_blank" rel="noreferrer"
                    className="w-full py-3 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/8 border border-white/8 flex items-center justify-center gap-2 transition-colors">
                    <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Email copy */}
            {vendor.contact_email && (
              <div className="rounded-2xl border border-white/8 px-4 py-3 flex items-center gap-3 bg-[#0d0d1a]">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-400 flex-1 truncate">{vendor.contact_email}</span>
                <button onClick={() => { navigator.clipboard.writeText(vendor.contact_email); toast.success("Copied!"); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Meta info */}
            <div className="rounded-2xl border border-white/8 px-5 py-4 space-y-3 bg-[#0d0d1a]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Details</p>
              {vendor.category && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs font-semibold text-white">{vendor.category}</span>
                </div>
              )}
              {vendor.contact_name && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Contact</span>
                  <span className="text-xs font-semibold text-white">{vendor.contact_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[status].cls}`}>
                  {STATUS_META[status].label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQuote && <QuoteModal vendor={vendor} projectId={projectId} onClose={() => setShowQuote(false)} />}
    </div>
  );
}
