
"use client";

/**
 * web/src/app/(dashboard)/events/[eventId]/settings/page.js
 * Senior Design Refactor: Focus on Visual Hierarchy & Premium UX
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, CheckCircle2, Trash2, AlertTriangle,
  CalendarDays, ChevronDown, Ticket, Users, QrCode,
  Heart, Settings2, Info, Zap, EyeOff, LayoutDashboard,
  Rocket, Globe, Lock, ShieldAlert, ChevronLeft, Home, User, Plus,
} from "lucide-react";
import PostEventSummaryModal from "@/components/ai/PostEventSummaryModal";
import { useAIStore } from "@/store/ai.store";
import { CountrySelector } from "@/components/ui/CountrySelector";

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
import { useEventStore } from "@/store/event.store";
import ConfirmModal from "@/components/ui/confirm-modal";
import DateTimePicker from "@/components/ui/DateTimePicker";

/* ─────────────────────────────────────────────
   CONSTANTS & CONFIG
───────────────────────────────────────────── */
const TIMEZONES = Intl.supportedValuesOf("timeZone");

const STATUS_CONFIG = {
  DRAFT:     { label: "Draft",     color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  PUBLISHED: { label: "Published", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  ARCHIVED:  { label: "Archived",  color: "text-slate-500",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
};

const easeOut = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

/* ─────────────────────────────────────────────
   REUSABLE UI COMPONENTS
───────────────────────────────────────────── */

function GlassCard({ children, className = "", delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...easeOut, delay }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/70 dark:bg-slate-900/40
        backdrop-blur-2xl border border-slate-200/50 dark:border-white/5
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, label, colorClass, description }) {
  return (
    <div className="flex items-center gap-5 mb-10">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">{label}</h3>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{description}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-end px-1">
        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          {label}
        </label>
        {hint && !error && <span className="text-[10px] text-slate-400 font-medium italic">{hint}</span>}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="text-[12px] text-red-500 font-medium pl-1 flex items-center gap-1.5"
          >
            <AlertTriangle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FORM PRIMITIVES
───────────────────────────────────────────── */

const inputClasses = `
  w-full rounded-2xl border border-slate-200 dark:border-white/5 
  bg-slate-50/50 dark:bg-white/[0.03] px-5 py-3.5 text-sm 
  text-slate-900 dark:text-white placeholder-slate-400/70 
  transition-all duration-300 focus:ring-4 focus:ring-indigo-500/5 
  focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 outline-none
`;

function Input(props) { return <input className={inputClasses} {...props} />; }
function Textarea(props) { return <textarea className={`${inputClasses} resize-none`} {...props} />; }

function Select({ children, ...props }) {
  return (
    <div className="relative group">
      <select className={`${inputClasses} appearance-none pr-12`} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform duration-300" />
    </div>
  );
}

function Toggle({ icon: Icon, label, description, checked, onChange, colorClass = "text-indigo-500" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`
        flex w-full items-center gap-5 rounded-[24px] border p-5 text-left transition-all duration-500
        ${checked 
          ? 'border-indigo-500/20 bg-indigo-500/[0.04] shadow-[0_10px_40px_rgba(99,102,241,0.05)]' 
          : 'border-slate-200 dark:border-white/5 bg-transparent hover:border-slate-300 dark:hover:border-white/10'}
      `}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-500 ${checked ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-tight">{description}</p>
      </div>
      <div className={`relative h-7 w-12 rounded-full transition-all duration-500 flex items-center px-1.5 ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'}`}>
        <motion.div 
          animate={{ x: checked ? 18 : 0 }} 
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="h-4 w-4 rounded-full bg-white shadow-md" 
        />
      </div>
    </button>
  );
}

function DangerRow({ icon: Icon, label, description, buttonLabel, onClick, variant = "ghost" }) {
  const styles = {
    ghost: "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/20"
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 group">
      <div className="flex gap-5">
        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Icon size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium max-w-sm">{description}</p>
        </div>
      </div>
      <button onClick={onClick} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${styles[variant]}`}>
        {buttonLabel}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE-ONLY HELPERS
───────────────────────────────────────────── */
function MSection({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}>
        {label}
      </p>
      <div className="flex flex-col gap-3 rounded-[16px] border p-4" style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}>
        {children}
      </div>
    </div>
  );
}

function MField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      {children}
    </div>
  );
}

function MInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[10px] border px-[13px] py-[11px] text-[14px] font-medium text-white outline-none focus:border-indigo-500/50"
      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
    />
  );
}

function MTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-none rounded-[10px] border px-[13px] py-[11px] text-[14px] font-medium text-white outline-none focus:border-indigo-500/50"
      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
    />
  );
}

function MSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-[10px] border py-[11px] pl-[13px] pr-10 text-[14px] font-medium text-white outline-none focus:border-indigo-500/50"
        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "#111" }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
    </div>
  );
}

function MDateInput({ value, onChange }) {
  const iso = value ? value.slice(0, 16) : "";
  return (
    <input
      type="datetime-local"
      value={iso}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-[10px] border px-[13px] py-[11px] text-[14px] font-medium text-white outline-none focus:border-indigo-500/50"
      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)", colorScheme: "dark" }}
    />
  );
}

function MToggle({ label, sub, checked, onChange, accent }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative flex h-[26px] w-[46px] shrink-0 items-center rounded-full px-[3px] transition-colors duration-300"
        style={{ background: checked ? accent : "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0px)" }}
        />
      </button>
    </div>
  );
}

function MDivider() {
  return <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />;
}

/* Action info for confirmation sheet */
function getMobileActionInfo(key, nextValue) {
  const map = {
    visibility: nextValue
      ? { icon: <Globe size={26} />, color: "#6366f1", title: "Make event public?", message: "Your event page will be visible to everyone. Anyone with the link can view details, RSVP, or buy tickets (if enabled).", confirmLabel: "Make Public" }
      : { icon: <Lock size={26} />, color: "#f59e0b", title: "Make event private?", message: "The public event page will be hidden. Only guests you invite directly will be able to access it.", confirmLabel: "Make Private" },
    allow_rsvp: nextValue
      ? { icon: <Users size={26} />, color: "#10b981", title: "Switch to RSVP?", message: "RSVP will be enabled (invitation only by default). Ticketing and Donations will be turned off automatically.", confirmLabel: "Enable RSVP" }
      : { icon: <Users size={26} />, color: "#10b981", title: "Disable RSVP?", message: "The RSVP button will be removed from your event page. Existing RSVPs are kept but no new ones will be accepted.", confirmLabel: "Disable RSVP" },
    open_rsvp: nextValue
      ? { icon: <Users size={26} />, color: "#10b981", title: "Enable Open RSVP?", message: "Anyone will be able to RSVP without needing an invitation. Great for public community events.", confirmLabel: "Enable Open RSVP" }
      : { icon: <Users size={26} />, color: "#10b981", title: "Disable Open RSVP?", message: "Guests will need a direct invitation to RSVP. Existing RSVPs are not affected.", confirmLabel: "Disable Open RSVP" },
    allow_ticketing: nextValue
      ? { icon: <Ticket size={26} />, color: "#f59e0b", title: "Switch to Ticketing?", message: "Ticketing will be enabled. RSVP and Donations will be turned off automatically.", confirmLabel: "Enable Ticketing" }
      : { icon: <Ticket size={26} />, color: "#f59e0b", title: "Disable ticketing?", message: "Ticket sales will be turned off. Existing ticket types and issued tickets are not deleted, but no new purchases will be accepted.", confirmLabel: "Disable Ticketing" },
    allow_qr_checkin: nextValue
      ? { icon: <QrCode size={26} />, color: "#06b6d4", title: "Enable QR check-in?", message: "You and your team can scan guest QR codes at the door to mark attendance in real time using the Scanner.", confirmLabel: "Enable QR Check-in" }
      : { icon: <QrCode size={26} />, color: "#06b6d4", title: "Disable QR check-in?", message: "The scanner will no longer accept QR codes for this event. You can still mark attendance manually from the Guests tab.", confirmLabel: "Disable QR Check-in" },
    allow_donations: nextValue
      ? { icon: <Heart size={26} />, color: "#f43f5e", title: "Switch to Donations?", message: "Donations will be enabled. RSVP and Ticketing will be turned off automatically.", confirmLabel: "Enable Donations" }
      : { icon: <Heart size={26} />, color: "#f43f5e", title: "Disable donations?", message: "The donation option will be removed from your event page. Past donations are not affected.", confirmLabel: "Disable Donations" },
  };
  return map[key] ?? { icon: <Settings2 size={26} />, color: "#6366f1", title: "Confirm change", message: "Are you sure you want to change this setting?", confirmLabel: "Confirm" };
}

function MConfirmSheet({ pending, onCancel, onConfirm }) {
  if (!pending) return null;
  const { info } = pending;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
      {/* Sheet */}
      <div
        className="relative flex flex-col items-center gap-4 slide-up rounded-t-[24px] border-t px-6 pt-3"
        style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)", paddingBottom: "max(24px,env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="h-1 w-9 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] mt-1" style={{ background: `${info.color}18`, color: info.color }}>
          {info.icon}
        </div>
        {/* Copy */}
        <p className="text-center text-[18px] font-extrabold text-white leading-tight">{info.title}</p>
        <p className="text-center text-[13px] leading-[1.5]" style={{ color: "rgba(255,255,255,0.5)" }}>{info.message}</p>
        {/* Buttons */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-[14px] py-[14px] text-[15px] font-extrabold text-white"
          style={{ background: info.color }}
        >
          {info.confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 text-[14px] font-semibold"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MVisibilityCard({ isPublic, onRequestToggle }) {
  return (
    <button
      type="button"
      onClick={() => onRequestToggle(!isPublic)}
      className="flex w-full items-center gap-3 rounded-[16px] border p-4 text-left"
      style={{
        background: isPublic ? "rgba(99,102,241,0.06)" : "rgba(245,158,11,0.06)",
        borderColor: isPublic ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: isPublic ? "rgba(99,102,241,0.14)" : "rgba(245,158,11,0.14)" }}
      >
        {isPublic ? <Globe size={20} color="#6366f1" /> : <Lock size={20} color="#f59e0b" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold text-white">{isPublic ? "Public" : "Private"}</span>
          <span
            className="rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-widest"
            style={{ background: isPublic ? "rgba(99,102,241,0.2)" : "rgba(245,158,11,0.2)", color: isPublic ? "#6366f1" : "#f59e0b" }}
          >{isPublic ? "LIVE" : "HIDDEN"}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
          {isPublic ? "Anyone with the link can view this event page." : "Only guests you invite directly can access this event."}
        </p>
      </div>
      {/* Toggle pill */}
      <div
        className="relative flex h-[26px] w-[46px] shrink-0 items-center rounded-full px-[3px] transition-colors duration-300"
        style={{ background: isPublic ? "#6366f1" : "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
          style={{ transform: isPublic ? "translateX(20px)" : "translateX(0px)" }}
        />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   PAGE MAIN
───────────────────────────────────────────── */

export default function EventSettingsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const { fetchEventDashboard, updateEvent, dashboard, loading } = useEventStore();
  
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);
  const [mobilePending, setMobilePending] = useState(null); // { key, nextValue, info }
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { generatePostEventSummary, loading: aiLoading } = useAIStore();
  
  const initialRef = useRef(null);

  useEffect(() => { if (eventId) fetchEventDashboard(eventId); }, [eventId, fetchEventDashboard]);

  // Redirect team members away — settings is owner-only
  useEffect(() => {
    if (!dashboard) return;
    const role = dashboard.userRole;
    if (role && role !== 'OWNER') {
      router.replace(`/events/${eventId}`);
    }
  }, [dashboard, eventId, router]);

  useEffect(() => {
    const e = dashboard?.event;
    if (!e) return;
    if (dirty) return; // preserve unsaved local edits
    const init = {
      title: e.title ?? "",
      description: e.description ?? "",
      short_description: e.short_description ?? "",
      visibility: e.visibility ?? "PRIVATE",
      timezone: e.timezone ?? "UTC",
      starts_at: e.starts_at_utc ?? "",
      ends_at: e.ends_at_utc ?? "",
      venue_name: e.venue_name ?? "",
      venue_address: e.venue_address ?? "",
      city: e.city ?? "",
      state: e.state ?? "",
      country: e.country ?? "",
      allow_rsvp: e.allow_rsvp ?? false,
      open_rsvp: e.open_rsvp ?? false,
      allow_plus_ones: e.allow_plus_ones ?? false,
      allow_qr_checkin: e.allow_qr_checkin ?? false,
      allow_ticketing: e.allow_ticketing ?? false,
      allow_donations: e.allow_donations ?? false,
    };
    setForm(init);
    initialRef.current = JSON.stringify(init);
  }, [dashboard, dirty]);

  const set = useCallback((key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      setDirty(JSON.stringify(next) !== initialRef.current);
      return next;
    });
    setErrors(p => ({ ...p, [key]: undefined }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateEvent(eventId, form);
    setSaving(false);
    if (result?.success) {
      setSaved(true);
      setDirty(false);
      initialRef.current = JSON.stringify(form);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Immediately persist a single boolean feature toggle without requiring "Save Changes"
  const saveToggle = useCallback(async (key, value, extra = {}) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value, ...extra };
      setDirty(JSON.stringify(next) !== initialRef.current);
      return next;
    });
    setSaving(true);
    const payload = { [key]: value, ...extra };
    const result = await updateEvent(eventId, payload);
    setSaving(false);
    if (result?.success) {
      setSaved(true);
      // Update the baseline so the dirty flag resets
      setForm((prev) => {
        initialRef.current = JSON.stringify({ ...prev, [key]: value, ...extra });
        return prev;
      });
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [eventId, updateEvent]);

  // Mutual exclusivity: only one of RSVP / Ticketing / Donations can be on at a time
  const applyModuleToggle = useCallback((key, value) => {
    if (value) {
      if (key === 'allow_rsvp')      return saveToggle('allow_rsvp',      true, { allow_ticketing: false, allow_donations: false, open_rsvp: false });
      if (key === 'allow_ticketing') return saveToggle('allow_ticketing', true, { allow_rsvp: false,      allow_donations: false, open_rsvp: false });
      if (key === 'allow_donations') return saveToggle('allow_donations', true, { allow_rsvp: false,      allow_ticketing: false, open_rsvp: false });
    }
    if (!value && key === 'allow_rsvp') return saveToggle('allow_rsvp', false, { open_rsvp: false });
    saveToggle(key, value);
  }, [saveToggle]);

  if (loading || !form) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
        <Loader2 className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={24} />
      </div>
    </div>
  );

  const event = dashboard?.event;
  const status = (event?.status ?? "DRAFT").toUpperCase();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <>
      {/* ── MOBILE OVERLAY ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#07070f" }}>

        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "rgba(255,255,255,0.08)", paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}
        >
          <Link
            href={`/events/${eventId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-black leading-tight text-white" style={{ letterSpacing: "-0.3px" }}>Settings</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Event configuration</p>
          </div>
          <div className="flex w-16 justify-end">
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(99,102,241,0.3)", borderTopColor: "#6366f1" }} />
            )}
            {saved && !saving && (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} style={{ color: "#10b981" }} />
                <span className="text-[10px] font-bold" style={{ color: "#10b981" }}>Saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 px-4 py-4" style={{ paddingBottom: dirty ? 88 : 40 }}>

            {/* BRANDING */}
            <MSection label="BRANDING">
              <MField label="Title">
                <MInput value={form.title} onChange={v => set("title", v)} placeholder="Event title" />
              </MField>
              <MField label="Short Description">
                <MInput value={form.short_description} onChange={v => set("short_description", v)} placeholder="One-liner" />
              </MField>
              <MField label="Description">
                <MTextarea value={form.description} onChange={v => set("description", v)} placeholder="Full event description" />
              </MField>
              <MField label="Visibility">
                <MVisibilityCard
                  isPublic={form.visibility === "PUBLIC"}
                  onRequestToggle={v => setMobilePending({ key: "visibility", nextValue: v, info: getMobileActionInfo("visibility", v) })}
                />
              </MField>
              <MField label="Timezone">
                <MSelect
                  value={form.timezone}
                  onChange={v => set("timezone", v)}
                  options={TIMEZONES.map(tz => ({ label: tz, value: tz }))}
                />
              </MField>
            </MSection>

            {/* DATE & LOCATION */}
            <MSection label="DATE & LOCATION">
              <MField label="Start">
                <MDateInput value={form.starts_at} onChange={v => set("starts_at", v)} />
              </MField>
              <MField label="End">
                <MDateInput value={form.ends_at} onChange={v => set("ends_at", v)} />
              </MField>
              <MField label="Venue Name">
                <MInput value={form.venue_name} onChange={v => set("venue_name", v)} placeholder="Venue or place name" />
              </MField>
              <MField label="Address">
                <MInput value={form.venue_address} onChange={v => set("venue_address", v)} placeholder="Street address" />
              </MField>
              <div className="grid grid-cols-2 gap-2">
                <MField label="City">
                  <MInput value={form.city} onChange={v => set("city", v)} placeholder="City" />
                </MField>
                <MField label="State">
                  <MInput value={form.state} onChange={v => set("state", v)} placeholder="State" />
                </MField>
              </div>
              <MField label="Country">
                <CountrySelector
                  value={form.country}
                  onChange={(country) => set("country", country.code)}
                  placeholder="Select country"
                />
              </MField>
            </MSection>

            {/* MODULES */}
            <MSection label="MODULES">
              <MToggle label="RSVP" sub="Collect guest names and emails" checked={form.allow_rsvp} onChange={v => setMobilePending({ key: "allow_rsvp", nextValue: v, info: getMobileActionInfo("allow_rsvp", v) })} accent="#10b981" />
              {form.allow_rsvp && (
                <>
                  <MDivider />
                  <MToggle label="Open RSVP" sub="Anyone can RSVP without invitation" checked={form.open_rsvp} onChange={v => setMobilePending({ key: "open_rsvp", nextValue: v, info: getMobileActionInfo("open_rsvp", v) })} accent="#10b981" />
                </>
              )}
              <MDivider />
              <MToggle label="Ticketing" sub="Secure payment processing" checked={form.allow_ticketing} onChange={v => setMobilePending({ key: "allow_ticketing", nextValue: v, info: getMobileActionInfo("allow_ticketing", v) })} accent="#f59e0b" />
              <MDivider />
              <MToggle label="Donations" sub="Accept tips and contributions" checked={form.allow_donations} onChange={v => setMobilePending({ key: "allow_donations", nextValue: v, info: getMobileActionInfo("allow_donations", v) })} accent="#f43f5e" />
            </MSection>

            {/* DANGER ZONE */}
            <div className="flex flex-col gap-2 pb-4 pt-2">
              <p className="px-1 text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px" }}>Danger Zone</p>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-[12px] border"
                style={{ height: 44, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)" }}
              >
                <Trash2 size={13} style={{ color: "#ef4444" }} />
                <span className="text-[13px] font-bold" style={{ color: "#ef4444" }}>Delete Event</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed save bar — only when there are unsaved changes */}
        {dirty && (
          <div
            className="shrink-0 border-t px-4 py-3"
            style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[14px]"
              style={{ background: "linear-gradient(to right, #4f46e5, #8b5cf6)" }}
            >
              {saving
                ? <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <><Save size={16} className="text-white" /><span className="text-[15px] font-extrabold text-white" style={{ letterSpacing: "-0.2px" }}>Save Changes</span></>
              }
            </button>
          </div>
        )}

        <MobileBottomNav />
        <ConfirmModal isOpen={!!modal} onClose={() => setModal(null)} {...modal} />

        {/* Mobile confirmation sheet for toggle actions */}
        <MConfirmSheet
          pending={mobilePending}
          onCancel={() => setMobilePending(null)}
          onConfirm={() => {
            if (!mobilePending) return;
            const { key, nextValue } = mobilePending;
            setMobilePending(null);
            applyModuleToggle(key, nextValue);
          }}
        />
      </div>

      {/* ── DESKTOP UI ── */}
      <div className="hidden sm:block min-h-screen bg-slate-50 dark:bg-[#080B14] transition-colors duration-700">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <header className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                <Settings2 size={14} className="text-indigo-500" />
                <span>Event Engine</span>
                <span className="opacity-30">/</span>
                <span className="text-slate-900 dark:text-white">Settings</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {event?.title || "Configuration"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[12px] font-bold tracking-tight transition-all ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                <div className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${cfg.color.replace('text', 'bg')}`} />
                {cfg.label}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12 pb-32">
              <GlassCard delay={0.1} className="p-10">
                <SectionHeader icon={Info} label="Branding & Identity" colorClass="text-indigo-500" description="Define how your event appears on the marketplace." />
                <div className="space-y-8">
                  <Field label="Event Title" error={errors.title}><Input value={form.title} onChange={e => set("title", e.target.value)} /></Field>
                  <Field label="Catchy Tagline" hint={`${form.short_description.length}/160`}><Input maxLength={160} value={form.short_description} onChange={e => set("short_description", e.target.value)} /></Field>
                  <Field label="Event Story / Bio"><Textarea rows={6} value={form.description} onChange={e => set("description", e.target.value)} /></Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Privacy Level">
                      <Select value={form.visibility} onChange={e => set("visibility", e.target.value)}>
                        <option value="PUBLIC">🌍 Discoverable (Public)</option>
                        <option value="PRIVATE">🔒 Invitation Only (Private)</option>
                      </Select>
                    </Field>
                    <Field label="Operational Timezone">
                      <Select value={form.timezone} onChange={e => set("timezone", e.target.value)}>
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </Select>
                    </Field>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={0.15} className="p-10">
                <SectionHeader icon={CalendarDays} label="Date & Location" colorClass="text-amber-500" description="Logistics for venue and scheduling." />
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Event Starts"><DateTimePicker value={form.starts_at} onChange={v => set("starts_at", v)} /></Field>
                    <Field label="Event Ends"><DateTimePicker value={form.ends_at} onChange={v => set("ends_at", v)} /></Field>
                  </div>
                  <div className="h-px bg-slate-200/50 dark:bg-white/5" />
                  <Field label="Venue or Platform Name"><Input value={form.venue_name} onChange={e => set("venue_name", e.target.value)} /></Field>
                  <Field label="Exact Address"><Input value={form.venue_address} onChange={e => set("venue_address", e.target.value)} /></Field>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <Field label="City"><Input value={form.city} onChange={e => set("city", e.target.value)} /></Field>
                    <Field label="State"><Input value={form.state} onChange={e => set("state", e.target.value)} /></Field>
                    <Field label="Country">
                      <CountrySelector
                        value={form.country}
                        onChange={(country) => set("country", country.code)}
                        placeholder="Select country"
                      />
                    </Field>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={0.2} className="p-10">
                <SectionHeader icon={Zap} label="Modules & Features" colorClass="text-emerald-500" description="Extend your event functionality with pre-built modules." />
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Toggle icon={Users} label="RSVP Flow" description="Collect guest names and emails" checked={form.allow_rsvp} onChange={v => applyModuleToggle("allow_rsvp", v)} />
                    <Toggle icon={Ticket} label="Stripe Ticketing" colorClass="text-amber-500" description="Secure payment processing" checked={form.allow_ticketing} onChange={v => applyModuleToggle("allow_ticketing", v)} />
                  </div>

                  <AnimatePresence>
                    {form.allow_rsvp && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pl-6 border-l-4 border-indigo-500/30 py-2">
                          <Toggle icon={Globe} label="Open RSVP" colorClass="text-emerald-500" description="Allow anyone to RSVP without an invitation link" checked={form.open_rsvp} onChange={v => saveToggle("open_rsvp", v)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Toggle icon={Heart} label="Donation Portal" colorClass="text-pink-500" description="Accept tips and contributions" checked={form.allow_donations} onChange={v => applyModuleToggle("allow_donations", v)} />
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={0.25} className="border-red-500/30 dark:border-red-500/20 overflow-visible">
                <div className="bg-red-500/[0.02] p-10">
                  <SectionHeader icon={ShieldAlert} label="Sensitive Actions" colorClass="text-red-500" description="Lifecycle management and safety tools." />
                  <div className="space-y-4 divide-y divide-red-500/10 dark:divide-red-500/10">
                    {status === "DRAFT" && <DangerRow icon={Rocket} label="Release Event" variant="success" buttonLabel="Go Live" onClick={() => {}} description="Push your event to the public discovery feed." />}
                    {status === "PUBLISHED" && <DangerRow icon={EyeOff} label="Retract Event" variant="warning" buttonLabel="Draft Mode" onClick={() => {}} description="Hide the event from new guests temporarily." />}
                    {(status === "ARCHIVED" || status === "CANCELLED" || (form?.ends_at && new Date(form.ends_at) < new Date())) && (
                      <DangerRow
                        icon={Zap}
                        label="AI Post-Event Summary"
                        variant="ghost"
                        buttonLabel={aiLoading ? "Generating…" : "Generate Summary"}
                        description="Get AI analysis: attendance, highlights, improvements, social caption, and performance grade."
                        onClick={async () => {
                          const res = await generatePostEventSummary(eventId);
                          if (res.success) { setSummaryData(res.data); setSummaryOpen(true); }
                        }}
                      />
                    )}
                    <DangerRow icon={Trash2} label="Destroy Database Entry" variant="danger" buttonLabel="Delete Event" onClick={() => {}} description="Irreversible removal of all guest and event data." />
                  </div>
                </div>
              </GlassCard>
            </div>

            <aside className="lg:col-span-4 sticky top-12 space-y-8">
              <GlassCard className="p-8 border-indigo-500/10 bg-white dark:bg-slate-900/60">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Sync Controls</h4>
                  {dirty && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_12px_#f59e0b]" />}
                </div>
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 transition-all">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight mb-1.5">Live Status</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white capitalize">{status.toLowerCase()}</p>
                  </div>
                  <button disabled={!dirty || saving} onClick={handleSave}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-wide transition-all ${dirty ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 active:scale-95' : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'}`}>
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? "Updating..." : "Deploy Settings"}
                  </button>
                  <AnimatePresence>
                    {saved && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold py-2">
                        <CheckCircle2 size={16} /> Cloud synced successfully
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>

              <GlassCard
                className="p-8 bg-indigo-600 dark:bg-indigo-700 border-none shadow-2xl shadow-indigo-600/20 group cursor-pointer overflow-hidden"
                onClick={() => {
                  if (!event?.slug) return;
                  const isPublic = form?.visibility === "PUBLIC";
                  window.open(
                    isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <div className="relative z-10 flex gap-5 items-start text-white">
                  <div className="p-3 rounded-2xl bg-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500"><LayoutDashboard size={24} /></div>
                  <div className="space-y-2">
                    <h4 className="font-black text-base tracking-tight">Live Preview</h4>
                    <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">
                      {event?.slug
                        ? `Opens /e/${event.slug}${form?.visibility !== "PUBLIC" ? " (preview mode)" : ""}`
                        : "Verify how your settings render on the production storefront."}
                    </p>
                    <span className="pt-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                      Open Event Page <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
              </GlassCard>
            </aside>
          </div>
        </div>
        <ConfirmModal isOpen={!!modal} onClose={() => setModal(null)} {...modal} />
      </div>
      <PostEventSummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} data={summaryData} />
    </>
  );
}














