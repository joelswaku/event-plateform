"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Send, Clock, Plus, Trash2, X, Zap, Users, Loader2,
  CheckCircle2, AlertCircle, Calendar, RefreshCw, ChevronDown,
  ArrowRight, Target, BarChart3, Play, Edit3, Globe,
  Ticket, Store, Crown, MapPin, MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCE_CFG = {
  all:        { label: "All Users",       icon: Globe,    color: "#6366f1", desc: "Everyone with the app installed" },
  organizers: { label: "Organizers",      icon: Users,    color: "#10b981", desc: "Users who have created events" },
  attendees:  { label: "Attendees",       icon: Ticket,   color: "#f59e0b", desc: "Users who have bought tickets" },
  vendors:    { label: "Vendors",         icon: Store,    color: "#06b6d4", desc: "Users in the vendor portal" },
  premium:    { label: "Premium Users",   icon: Crown,    color: "#c9a96e", desc: "Paid plan subscribers" },
};

const STATUS_CFG = {
  draft:     { label: "Draft",     color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  scheduled: { label: "Scheduled", color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  sending:   { label: "Sending…",  color: "#6366f1", bg: "rgba(99,102,241,0.15)"  },
  sent:      { label: "Sent",      color: "#10b981", bg: "rgba(16,185,129,0.15)"  },
  failed:    { label: "Failed",    color: "#ef4444", bg: "rgba(239,68,68,0.15)"   },
};

const AUTOMATED = [
  { icon: "🎟️", title: "Ticket Purchased",         body: "Your ticket for [Event Name] is confirmed!", trigger: "On ticket purchase",  audience: "Attendee" },
  { icon: "⏰", title: "Event Starts in 24 Hours",  body: "Don't forget — [Event] starts tomorrow!",   trigger: "24h before event",   audience: "Attendee" },
  { icon: "🚀", title: "Event Starts in 1 Hour",    body: "[Event] kicks off in 1 hour. Get ready!",   trigger: "1h before event",    audience: "Attendee" },
  { icon: "👥", title: "New RSVP",                  body: "[Guest] RSVP'd to your event.",             trigger: "On RSVP",            audience: "Organizer" },
  { icon: "💰", title: "New Donation",              body: "You received a $[X] donation.",             trigger: "On donation",        audience: "Organizer" },
  { icon: "✅", title: "Guest Checked In",          body: "[Guest] just checked in!",                  trigger: "On check-in scan",   audience: "Organizer" },
  { icon: "🎉", title: "Welcome to LiteEvent",      body: "Discover events near you.",                 trigger: "1 min after signup", audience: "New User" },
];

const DEEP_LINK_EXAMPLES = [
  { route: "/(tabs)",               label: "Home / Dashboard"    },
  { route: "/events/[id]",          label: "Event Page"          },
  { route: "/events/[id]/tickets",  label: "Ticket Details"      },
  { route: "/events/[id]/guests",   label: "Guest List"          },
  { route: "/notifications",        label: "Notifications"       },
  { route: "/profile/billing",      label: "Billing / Upgrade"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {sub && <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value ?? "—"}</p>
        <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
      </div>
    </motion.div>
  );
}

function AudienceBadge({ audience }) {
  const cfg = AUDIENCE_CFG[audience] || AUDIENCE_CFG.all;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color }}>
      {status === "sending" && <Loader2 size={9} className="animate-spin" />}
      {status === "sent"    && <CheckCircle2 size={9} />}
      {status === "failed"  && <AlertCircle size={9} />}
      {status === "scheduled" && <Clock size={9} />}
      {cfg.label}
    </span>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title:        initial?.title        || "",
    body:         initial?.body         || "",
    image_url:    initial?.image_url    || "",
    deep_link:    initial?.deep_link    || "/(tabs)",
    audience:     initial?.audience     || "all",
    scheduled_at: initial?.scheduled_at ? new Date(initial.scheduled_at).toISOString().slice(0, 16) : "",
  });
  const [mode,    setMode]    = useState(initial?.scheduled_at ? "schedule" : "now");
  const [saving,  setSaving]  = useState(false);
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const audienceCfg = AUDIENCE_CFG[form.audience] || AUDIENCE_CFG.all;

  async function handleSave(andSend = false) {
    if (!form.title.trim() || !form.body.trim()) { setError("Title and body are required."); return; }
    setError("");
    andSend ? setSending(true) : setSaving(true);

    try {
      const payload = {
        ...form,
        scheduled_at: mode === "schedule" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      };

      let broadcast;
      if (isEdit) {
        const r = await api.patch(`/super-admin/broadcasts/${initial.id}`, payload);
        broadcast = r.data.broadcast;
      } else {
        const r = await api.post("/super-admin/broadcasts", payload);
        broadcast = r.data.broadcast;
      }

      if (andSend) {
        await api.post(`/super-admin/broadcasts/${broadcast.id}/send`);
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false); setSending(false);
    }
  }

  const inp = "w-full rounded-xl border px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/60";
  const inpStyle = { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#0a0a18", border: "1px solid rgba(255,255,255,0.10)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(99,102,241,0.15)" }}>
              <Bell size={16} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{isEdit ? "Edit Notification" : "Create Notification"}</h2>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Compose and target your push notification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 transition"><X size={16} style={{ color: "rgba(255,255,255,0.5)" }} /></button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Title *</label>
              <input className={inp} style={inpStyle} placeholder="🎉 New feature launched" value={form.title} onChange={e => set("title")(e.target.value)} maxLength={100} />
              <p className="text-[10px] mt-0.5 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{form.title.length}/100</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Message *</label>
              <textarea className={`${inp} resize-none`} style={inpStyle} rows={3} placeholder="Describe what's happening…" value={form.body} onChange={e => set("body")(e.target.value)} maxLength={250} />
              <p className="text-[10px] mt-0.5 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{form.body.length}/250</p>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Audience</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(AUDIENCE_CFG).map(([key, cfg]) => {
                  const Icon   = cfg.icon;
                  const active = form.audience === key;
                  return (
                    <button key={key} type="button" onClick={() => set("audience")(key)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition"
                      style={{ background: active ? `${cfg.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${active ? cfg.color + "40" : "rgba(255,255,255,0.08)"}` }}>
                      <Icon size={13} style={{ color: active ? cfg.color : "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                      <span className="text-[12px] font-semibold" style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{audienceCfg.desc}</p>
            </div>

            {/* Deep link */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Deep Link (tap destination)</label>
              <div className="relative">
                <input className={inp} style={inpStyle} placeholder="/(tabs)" value={form.deep_link} onChange={e => set("deep_link")(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DEEP_LINK_EXAMPLES.map(({ route, label }) => (
                  <button key={route} type="button" onClick={() => set("deep_link")(route)}
                    className="rounded-lg px-2 py-1 text-[10px] font-semibold transition hover:opacity-80"
                    style={{ background: form.deep_link === route ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", color: form.deep_link === route ? "#818cf8" : "rgba(255,255,255,0.4)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Image URL (optional)</label>
              <input className={inp} style={inpStyle} placeholder="https://…" value={form.image_url} onChange={e => set("image_url")(e.target.value)} />
            </div>

            {/* Send mode */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>When to send</label>
              <div className="flex gap-2">
                {[["now", "Send Now", Zap], ["schedule", "Schedule", Calendar]].map(([m, l, Icon]) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition"
                    style={{ background: mode === m ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${mode === m ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}`, color: mode === m ? "#818cf8" : "rgba(255,255,255,0.45)" }}>
                    <Icon size={14} />
                    {l}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {mode === "schedule" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                    <input type="datetime-local" className={inp} style={{ ...inpStyle, colorScheme: "dark" }}
                      value={form.scheduled_at} onChange={e => set("scheduled_at")(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="hidden sm:flex w-64 shrink-0 flex-col gap-4 p-5 border-l overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Preview</p>

            {/* Phone mock */}
            <div className="rounded-2xl overflow-hidden mx-auto w-48" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)" }}>
              {/* Status bar */}
              <div className="flex justify-between items-center px-4 pt-3 pb-1">
                <span className="text-[9px] font-bold text-white">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
              </div>
              {/* Notification banner */}
              <div className="mx-2 mb-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm" style={{ background: "#6366f1" }}>
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{form.title || "Notification title"}</p>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {form.body || "Notification body text will appear here"}
                    </p>
                  </div>
                </div>
                <p className="text-[9px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>now · LiteEvent</p>
              </div>
            </div>

            {/* Audience info */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Targeting</p>
              <div className="flex items-center gap-1.5">
                {(() => { const Icon = audienceCfg.icon; return <Icon size={12} style={{ color: audienceCfg.color }} />; })()}
                <span className="text-xs font-semibold" style={{ color: audienceCfg.color }}>{audienceCfg.label}</span>
              </div>
              <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>{audienceCfg.desc}</p>
              {form.deep_link && (
                <div className="flex items-center gap-1 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{form.deep_link}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-white/8" style={{ color: "rgba(255,255,255,0.4)" }}>
            Cancel
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving || sending}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-white/8 disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Draft"}
            </button>
            {mode === "now" ? (
              <button onClick={() => handleSave(true)} disabled={saving || sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Now
              </button>
            ) : (
              <button onClick={() => handleSave(false)} disabled={saving || sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.35)", color: "#fbbf24" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                Schedule
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationCenterPage() {
  const [broadcasts,   setBroadcasts]   = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [compose,      setCompose]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [sending,      setSending]      = useState(null);
  const [activeTab,    setActiveTab]    = useState("all");
  const [showAuto,     setShowAuto]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get("/super-admin/broadcasts?limit=50"),
        api.get("/super-admin/broadcasts/stats"),
      ]);
      setBroadcasts(bRes.data.broadcasts || []);
      setStats(sRes.data.stats || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSend(id) {
    setSending(id);
    try {
      await api.post(`/super-admin/broadcasts/${id}/send`);
      load();
    } catch {}
    setSending(null);
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await api.delete(`/super-admin/broadcasts/${id}`);
      setBroadcasts(bs => bs.filter(b => b.id !== id));
    } catch {}
    setDeleting(null);
  }

  const filtered = broadcasts.filter(b => {
    if (activeTab === "all")       return true;
    if (activeTab === "sent")      return b.status === "sent";
    if (activeTab === "scheduled") return b.status === "scheduled";
    if (activeTab === "draft")     return b.status === "draft";
    return true;
  });

  const TABS = [
    { id: "all",       label: "All",       count: broadcasts.length },
    { id: "sent",      label: "Sent",      count: broadcasts.filter(b => b.status === "sent").length },
    { id: "scheduled", label: "Scheduled", count: broadcasts.filter(b => b.status === "scheduled").length },
    { id: "draft",     label: "Drafts",    count: broadcasts.filter(b => b.status === "draft").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Notification Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Create, schedule, and track push notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl transition hover:bg-white/8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
          <button onClick={() => { setEditTarget(null); setCompose(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
            <Plus size={14} /> Create Notification
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Send}        label="Total Sent"     color="#6366f1" value={stats?.totals?.sent        ?? "0"} sub="broadcasts" />
        <StatCard icon={Bell}        label="Total Delivered" color="#10b981" value={stats?.totals?.total_delivered ? Number(stats.totals.total_delivered).toLocaleString() : "0"} sub="push messages" />
        <StatCard icon={Calendar}    label="Scheduled"      color="#f59e0b" value={stats?.totals?.scheduled   ?? "0"} sub="pending" />
        <StatCard icon={Edit3}       label="Drafts"         color="#6b7280" value={stats?.totals?.draft       ?? "0"} sub="unpublished" />
      </div>

      {/* Automated notifications info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden"
        style={{ background: "#0d0d1a", border: "1px solid rgba(99,102,241,0.2)" }}>
        <button onClick={() => setShowAuto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition hover:bg-white/2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(99,102,241,0.15)" }}>
              <Zap size={15} style={{ color: "#818cf8" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Automated Notifications</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {AUTOMATED.length} system notifications fire automatically — no admin action needed
              </p>
            </div>
          </div>
          <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.35)", transform: showAuto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        <AnimatePresence>
          {showAuto && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="border-t px-5 pb-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
                  {AUTOMATED.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-white">{n.title}</p>
                        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{n.body}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-bold rounded-full px-2 py-0.5"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                            AUTO
                          </span>
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{n.trigger}</span>
                          <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>→ {n.audience}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Broadcast list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Tabs + toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition"
                style={{
                  background: activeTab === t.id ? "rgba(255,255,255,0.12)" : "transparent",
                  color: activeTab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
                }}>
                {t.label}
                {t.count > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black"
                    style={{ background: activeTab === t.id ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)", color: activeTab === t.id ? "#818cf8" : "rgba(255,255,255,0.35)" }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: "#6366f1" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Bell size={24} style={{ color: "#6366f1" }} />
            </div>
            <p className="text-sm font-bold text-white">No notifications yet</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Create your first broadcast notification</p>
            <button onClick={() => { setEditTarget(null); setCompose(true); }}
              className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-90"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}>
              <Plus size={13} /> Create Notification
            </button>
          </div>
        ) : (
          <>
            {/* Desktop header row — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)", borderTopWidth: 0 }}>
              {["Title", "Audience", "Status", "Sent", "Date", ""].map((h, i) => (
                <div key={i} className={`text-[10px] font-bold uppercase tracking-wider ${i === 0 ? "col-span-4" : i === 5 ? "col-span-1 text-right" : "col-span-2"}`}
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {h}
                </div>
              ))}
            </div>

            {filtered.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="border-b transition hover:bg-white/2 group"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>

                {/* Mobile card layout */}
                <div className="sm:hidden flex items-start gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                    <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{b.body}</p>
                    <div className="flex flex-wrap gap-2">
                      <AudienceBadge audience={b.audience} />
                      <StatusBadge status={b.status} />
                      {b.sent_count > 0 && (
                        <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>{b.sent_count.toLocaleString()} sent</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(b.status === "draft" || b.status === "scheduled") && (
                      <button onClick={() => handleSend(b.id)} disabled={sending === b.id}
                        className="p-2 rounded-lg" style={{ background: "rgba(99,102,241,0.15)" }}>
                        {sending === b.id ? <Loader2 size={14} className="animate-spin" style={{ color: "#818cf8" }} /> : <Play size={14} style={{ color: "#818cf8" }} />}
                      </button>
                    )}
                    {b.status !== "sent" && (
                      <button onClick={() => { setEditTarget(b); setCompose(true); }} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Edit3 size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id} className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
                      {deleting === b.id ? <Loader2 size={14} className="animate-spin" style={{ color: "#f87171" }} /> : <Trash2 size={14} style={{ color: "#f87171" }} />}
                    </button>
                  </div>
                </div>

                {/* Desktop row layout */}
                <div className="hidden sm:grid grid-cols-12 gap-3 items-center px-5 py-3.5">
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{b.body}</p>
                  </div>
                  <div className="col-span-2"><AudienceBadge audience={b.audience} /></div>
                  <div className="col-span-2"><StatusBadge status={b.status} /></div>
                  <div className="col-span-2">
                    <p className="text-sm font-bold" style={{ color: b.sent_count > 0 ? "#10b981" : "rgba(255,255,255,0.25)" }}>
                      {b.sent_count > 0 ? b.sent_count.toLocaleString() : "—"}
                    </p>
                    {b.sent_count > 0 && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>devices</p>}
                  </div>
                  <div className="col-span-1">
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {b.sent_at ? timeAgo(b.sent_at) : b.scheduled_at ? fmtDate(b.scheduled_at) : "Draft"}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(b.status === "draft" || b.status === "scheduled") && (
                      <button onClick={() => handleSend(b.id)} disabled={sending === b.id}
                        className="p-1.5 rounded-lg transition hover:bg-indigo-500/20">
                        {sending === b.id ? <Loader2 size={13} className="animate-spin" style={{ color: "#818cf8" }} /> : <Play size={13} style={{ color: "#818cf8" }} />}
                      </button>
                    )}
                    {b.status !== "sent" && (
                      <button onClick={() => { setEditTarget(b); setCompose(true); }} className="p-1.5 rounded-lg transition hover:bg-white/8">
                        <Edit3 size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                      className="p-1.5 rounded-lg transition hover:bg-red-500/15">
                      {deleting === b.id ? <Loader2 size={13} className="animate-spin" style={{ color: "#f87171" }} /> : <Trash2 size={13} style={{ color: "#f87171" }} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Recent stats by audience */}
      {stats?.byAudience?.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} style={{ color: "#818cf8" }} />
            <p className="text-sm font-bold text-white">Broadcasts by Audience</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.byAudience.map((a) => {
              const cfg = AUDIENCE_CFG[a.audience] || AUDIENCE_CFG.all;
              const Icon = cfg.icon;
              return (
                <div key={a.audience} className="rounded-xl p-3 text-center" style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}20` }}>
                  <Icon size={16} className="mx-auto mb-1.5" style={{ color: cfg.color }} />
                  <p className="text-lg font-black text-white">{a.count}</p>
                  <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compose modal */}
      {compose && (
        <ComposeModal
          initial={editTarget}
          onClose={() => { setCompose(false); setEditTarget(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
