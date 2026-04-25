
"use client";

/**
 * web/src/app/(dashboard)/events/[eventId]/settings/page.js
 * Senior Design Refactor: Focus on Visual Hierarchy & Premium UX
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, CheckCircle2, Trash2, AlertTriangle, 
  CalendarDays, ChevronDown, Ticket, Users, QrCode, 
  Heart, Settings2, Info, Zap, EyeOff, LayoutDashboard, 
  Rocket, Globe, Lock, ShieldAlert
} from "lucide-react";
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

function GlassCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...easeOut, delay }}
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
   PAGE MAIN
───────────────────────────────────────────── */

export default function EventSettingsPage() {
  const { eventId } = useParams();
  const { fetchEventDashboard, updateEvent, dashboard, loading } = useEventStore();
  
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);
  
  const initialRef = useRef(null);

  useEffect(() => { if (eventId) fetchEventDashboard(eventId); }, [eventId, fetchEventDashboard]);

  useEffect(() => {
    const e = dashboard?.event;
    if (!e || initialRef.current) return;
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
      allow_plus_ones: e.allow_plus_ones ?? false,
      allow_qr_checkin: e.allow_qr_checkin ?? false,
      allow_ticketing: e.allow_ticketing ?? false,
      allow_donations: e.allow_donations ?? false,
    };
    setForm(init);
    initialRef.current = JSON.stringify(init);
  }, [dashboard]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#080B14] transition-colors duration-700">
      
      <div className="mx-auto max-w-7xl px-6 py-12">
        
        {/* Header Section */}
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
          
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-12 pb-32">
            
            {/* Essential Branding */}
            <GlassCard delay={0.1} className="p-10">
              <SectionHeader 
                icon={Info} 
                label="Branding & Identity" 
                colorClass="text-indigo-500" 
                description="Define how your event appears on the marketplace."
              />
              <div className="space-y-8">
                <Field label="Event Title" error={errors.title}>
                  <Input value={form.title} onChange={e => set("title", e.target.value)} />
                </Field>
                <Field label="Catchy Tagline" hint={`${form.short_description.length}/160`}>
                  <Input maxLength={160} value={form.short_description} onChange={e => set("short_description", e.target.value)} />
                </Field>
                <Field label="Event Story / Bio">
                  <Textarea rows={6} value={form.description} onChange={e => set("description", e.target.value)} />
                </Field>
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

            {/* Time & Place */}
            <GlassCard delay={0.15} className="p-10">
              <SectionHeader 
                icon={CalendarDays} 
                label="Date & Location" 
                colorClass="text-amber-500" 
                description="Logistics for venue and scheduling."
              />
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
                  <Field label="Country Code"><Input value={form.country} onChange={e => set("country", e.target.value)} /></Field>
                </div>
              </div>
            </GlassCard>

            {/* Plugin Features */}
            <GlassCard delay={0.2} className="p-10">
              <SectionHeader 
                icon={Zap} 
                label="Modules & Features" 
                colorClass="text-emerald-500" 
                description="Extend your event functionality with pre-built modules."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Toggle icon={Users} label="RSVP Flow" description="Collect guest names and emails" checked={form.allow_rsvp} onChange={v => set("allow_rsvp", v)} />
                <Toggle icon={Ticket} label="Stripe Ticketing" colorClass="text-amber-500" description="Secure payment processing" checked={form.allow_ticketing} onChange={v => set("allow_ticketing", v)} />
                <Toggle icon={QrCode} label="Express Entry" colorClass="text-cyan-500" description="Mobile QR scanning at door" checked={form.allow_qr_checkin} onChange={v => set("allow_qr_checkin", v)} />
                <Toggle icon={Heart} label="Donation Portal" colorClass="text-pink-500" description="Accept tips and contributions" checked={form.allow_donations} onChange={v => set("allow_donations", v)} />
              </div>
            </GlassCard>

            {/* Critical Actions */}
            <GlassCard delay={0.25} className="border-red-500/30 dark:border-red-500/20 overflow-visible">
               <div className="bg-red-500/[0.02] p-10">
                  <SectionHeader icon={ShieldAlert} label="Sensitive Actions" colorClass="text-red-500" description="Lifecycle management and safety tools." />
                  <div className="space-y-4 divide-y divide-red-500/10 dark:divide-red-500/10">
                    {status === "DRAFT" && <DangerRow icon={Rocket} label="Release Event" variant="success" buttonLabel="Go Live" onClick={() => {}} description="Push your event to the public discovery feed." />}
                    {status === "PUBLISHED" && <DangerRow icon={EyeOff} label="Retract Event" variant="warning" buttonLabel="Draft Mode" onClick={() => {}} description="Hide the event from new guests temporarily." />}
                    <DangerRow icon={Trash2} label="Destroy Database Entry" variant="danger" buttonLabel="Delete Event" onClick={() => {}} description="Irreversible removal of all guest and event data." />
                  </div>
               </div>
            </GlassCard>
          </div>

          {/* Persistent Sidebar */}
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

                <button 
                  disabled={!dirty || saving}
                  onClick={handleSave}
                  className={`
                    w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-wide transition-all
                    ${dirty 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 active:scale-95' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {saving ? "Updating..." : "Deploy Settings"}
                </button>

                <AnimatePresence>
                  {saved && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold py-2"
                    >
                      <CheckCircle2 size={16} /> Cloud synced successfully
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>

            <GlassCard className="p-8 bg-indigo-600 dark:bg-indigo-700 border-none shadow-2xl shadow-indigo-600/20 group cursor-pointer overflow-hidden">
              <div className="relative z-10 flex gap-5 items-start text-white">
                <div className="p-3 rounded-2xl bg-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500"><LayoutDashboard size={24} /></div>
                <div className="space-y-2">
                  <h4 className="font-black text-base tracking-tight">Live Preview</h4>
                  <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">Verify how your settings render on the production storefront.</p>
                  <button className="pt-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Open Event Page <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
              {/* Decorative Background Element */}
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            </GlassCard>
          </aside>

        </div>
      </div>

      <ConfirmModal 
        isOpen={!!modal} 
        onClose={() => setModal(null)} 
        {...modal} 
      />
    </div>
  );
}














