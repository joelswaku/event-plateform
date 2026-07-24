
"use client";

/**
 * web/src/app/(dashboard)/events/create/page.js  ← REPLACE EXISTING
 *
 * Change vs original:
 *  - Added `preCategory` logic so ?category=entertainment (no sub param)
 *    auto-selects the category and starts at step 1 (subcategory picker).
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, Check, Ticket, Users,
  Lock, Sparkles, ArrowRight, CalendarDays, LayoutTemplate,
  Heart,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { EVENT_CATEGORIES, RSVP_DEFAULTS, TICKET_DEFAULTS } from "@/config/event-categories";
import DateTimePicker from "@/components/ui/DateTimePicker";
import AIGenerateButton from "@/components/ai/AIGenerateButton";
import { useAIStore } from "@/store/ai.store";
import { CountrySelector } from "@/components/ui/CountrySelector";

/* ── Wizard steps ──────────────────────────────────────────── */
const STEPS = ["Category", "Type", "Details", "Settings"];

/* ── Plan limit error card ─────────────────────────────────── */
function EventLimitCard({ onUpgrade, plan }) {
  const isStarter = plan === "starter";
  const badge     = isStarter ? "Starter limit reached"          : "Free plan limit reached";
  const heading   = isStarter ? "You've used all 5 Starter events" : "You've used your 1 free event";
  const sub       = isStarter
    ? "Upgrade to Pro for unlimited events, all themes, and every feature — no caps, ever."
    : "Upgrade to Starter or Pro for unlimited events, all 18 templates, and every feature — no caps, ever.";
  const btnLabel  = isStarter ? "Upgrade to Pro" : "Upgrade now";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #0f0f12 0%, #1a1208 100%)",
        border: "1px solid rgba(245,158,11,0.25)",
        boxShadow: "0 8px 32px rgba(245,158,11,0.12)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "rgba(245,158,11,0.15)" }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
        >
          <Lock size={24} style={{ color: "#F59E0B" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}
          >
            <Sparkles size={9} />
            {badge}
          </div>
          <h3 className="text-[15px] font-bold text-white">{heading}</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {sub}
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-black transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", boxShadow: "0 4px 16px rgba(245,158,11,0.4)" }}
        >
          <Zap size={14} fill="currentColor" />
          {btnLabel}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Mobile-only upgrade gate (shown before form when at limit) ── */
function MobileUpgradeGate({ onBack, plan }) {
  const router    = useRouter();
  const prices    = useSubscriptionStore((s) => s.prices);
  const isStarter = plan === "starter";

  const bannerLabel = isStarter ? "Starter Limit Reached"      : "Event Limit Reached";
  const bannerTitle = isStarter ? "You've used all 5 Starter events" : "You've used your free event";
  const bannerSub   = isStarter
    ? "Upgrade to Pro for unlimited events, all themes, and every feature."
    : "Upgrade to create unlimited events, access all templates, and unlock every feature.";
  const ctaLabel    = isStarter ? "Upgrade to Pro"  : "Upgrade Now";
  const ctaStyle    = isStarter
    ? { background: "linear-gradient(135deg,#c9a96e,#f59e0b)", boxShadow: "0 8px 24px rgba(201,169,110,0.4)", color: "#000" }
    : { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)", color: "#fff" };

  return (
    <div
      className="sm:hidden flex flex-col min-h-screen"
      style={{ background: "#07070f" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={onBack} className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ChevronLeft size={20} color="#fff" />
        </button>
        <span className="text-base font-bold text-white">Create Event</span>
      </div>

      {/* Gate card */}
      <div className="flex-1 px-5 pt-4 pb-10 flex flex-col gap-4">
        {/* Lock banner */}
        <div className="rounded-2xl p-5 flex flex-col items-center text-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={isStarter
              ? { background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.3)" }
              : { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <Lock size={26} color={isStarter ? "#c9a96e" : "#8b5cf6"} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: isStarter ? "#c9a96e" : "#8b5cf6" }}>{bannerLabel}</p>
            <h2 className="text-lg font-black text-white mb-1">{bannerTitle}</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{bannerSub}</p>
          </div>
        </div>

        {/* Starter card — hidden for starter users (it's their current/passed plan) */}
        {!isStarter && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.08) 100%)", border: "2px solid rgba(99,102,241,0.35)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base font-black text-white">Starter</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>5 events · 500 guests · All themes</p>
              </div>
              <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                Most Popular
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {prices?.starter?.amount != null ? `$${prices.starter.amount}` : '$19'}<span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>/mo</span>
            </p>
          </div>
        )}

        {/* Pro card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg,rgba(201,169,110,0.1) 0%,rgba(245,158,11,0.06) 100%)", border: isStarter ? "2px solid rgba(201,169,110,0.5)" : "1px solid rgba(201,169,110,0.25)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-black text-white">Pro</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Unlimited events · Unlimited guests</p>
            </div>
            {isStarter && (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: "rgba(201,169,110,0.2)", color: "#c9a96e" }}>
                Recommended
              </div>
            )}
          </div>
          <p className="text-2xl font-black text-white">
            {prices?.pro?.amount != null ? `$${prices.pro.amount}` : '$49'}<span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>/mo</span>
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/settings/billing")}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2"
          style={ctaStyle}
        >
          <Zap size={16} fill="currentColor" />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Shared field wrapper ──────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <label className="text-xs sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs sm:text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── Step 1: Category grid ─────────────────────────────────── */
function StepCategory({ onSelect }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">What kind of event?</h2>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Choose the category that best fits your event</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 text-left transition hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${cat.border} ${cat.bg} dark:bg-gray-800 dark:border-gray-700`}
          >
            <span className="text-2xl sm:text-3xl mt-0.5">{cat.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{cat.label}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: cat.color }}>{cat.subcategories.length} event types</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Subcategory ───────────────────────────────────── */
function StepSubcategory({ category, onSelect, onBack }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm sm:text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-3xl sm:text-4xl">{category.icon}</span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">{category.label}</h2>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Select the specific type</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {category.subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub)}
            className={`flex flex-col items-center gap-2 rounded-xl sm:rounded-2xl border-2 p-3.5 sm:p-4 text-center transition hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${category.border} ${category.bg} dark:bg-gray-800 dark:border-gray-700`}
          >
            <span className="text-2xl sm:text-3xl">{sub.icon}</span>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{sub.label}</p>
            {sub.ticketDefault && (
              <span className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                Ticketed
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: Feature picker ────────────────────────────────── */
const FEATURE_OPTIONS = [
  {
    key:   "rsvp",
    icon:  Users,
    label: "RSVP",
    desc:  "Allow guests to RSVP to this event",
    iconColor:    "text-indigo-600 dark:text-indigo-400",
    badge:        "bg-indigo-600",
  },
  {
    key:   "ticketing",
    icon:  Ticket,
    label: "Ticketing",
    desc:  "Sell free or paid tickets",
    iconColor:    "text-amber-600 dark:text-amber-400",
    badge:        "bg-amber-500",
  },
  {
    key:   "donations",
    icon:  Heart,
    label: "Donations",
    desc:  "Accept optional donations at this event",
    iconColor:    "text-pink-600 dark:text-pink-400",
    badge:        "bg-pink-500",
  },
];

function StepFeatures({ subcategory, features, onChange, onNext, onBack, submitting }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <button onClick={onBack}
          className="flex items-center gap-1 text-sm sm:text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-3xl sm:text-4xl">{subcategory.icon}</span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">Choose your event mode</h2>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Pick one — only one module can be active at a time. Switch anytime in Settings.
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {FEATURE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = features[opt.key];
          return (
            <button key={opt.key} type="button"
              onClick={() => onChange(opt.key, !active)}
              style={{
                backgroundColor: active ? `${opt.iconColor.replace('text-', '#').replace('dark:', '').split(' ')[0].replace('indigo-600', '#6366f1').replace('amber-600', '#f59e0b').replace('pink-600', '#ec4899')}08` : undefined,
                borderColor: active ? `${opt.iconColor.replace('text-', '#').replace('dark:', '').split(' ')[0].replace('indigo-600', '#6366f1').replace('amber-600', '#f59e0b').replace('pink-600', '#ec4899')}40` : undefined
              }}
              className={`relative w-full flex items-center gap-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                active
                  ? ""
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}>
              {/* Icon */}
              <div
                style={{ backgroundColor: active ? `${opt.iconColor.replace('text-', '#').replace('dark:', '').split(' ')[0].replace('indigo-600', '#6366f1').replace('amber-600', '#f59e0b').replace('pink-600', '#ec4899')}20` : undefined }}
                className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${!active && "bg-gray-100 dark:bg-gray-700"}`}>
                <Icon className={`w-5 h-5 sm:w-5 sm:h-5 transition-colors ${active ? opt.iconColor : "text-gray-400 dark:text-gray-500"}`} />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm sm:text-base transition-colors ${active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                  {opt.label}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
              </div>

              {/* Toggle Switch Visual */}
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                active
                  ? opt.badge.replace('bg-', 'bg-opacity-70 bg-')
                  : "bg-gray-200 dark:bg-gray-700"
              }`}>
                <div className={`absolute top-0.5 ${active ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 sm:pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs sm:text-sm text-gray-400 font-medium">
          {Object.values(features).some(Boolean) ? "1 module selected" : "Select one module"}
        </p>
        <button
          onClick={onNext}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-xl px-5 sm:px-6 py-2.5 text-sm sm:text-base font-bold text-white transition active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
          {submitting ? (
            <><span className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
          ) : (
            <><Check className="w-4 h-4 sm:w-5 sm:h-5" /> Create Event</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Details form ──────────────────────────────────── */
function StepDetails({ subcategory, features, formData, setFormData, onBack, onNext }) {
  const [errors, setErrors] = useState({});
  const { generateEventContent, loading: aiLoading } = useAIStore();

  const inputCls =
    "w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-3.5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition";

  const set = (k, v) => {
    setFormData((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!formData.title.trim()) e.title = "Title is required";
    if (!formData.starts_at) e.starts_at = "Start date is required";
    if (!formData.venue_name.trim()) e.venue_name = "Venue name is required";
    if (!formData.city.trim()) e.city = "City is required";
    return e;
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm sm:text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-3xl sm:text-4xl">{subcategory.icon}</span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">Event Details</h2>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Fill in your event information</p>
      </div>

      <Field label="Event Title *" error={errors.title}>
        <input
          value={formData.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={`e.g. ${subcategory.icon} ${subcategory.label} 2025`}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Start Date & Time *">
          <DateTimePicker
            value={formData.starts_at}
            onChange={(v) => set("starts_at", v)}
            placeholder="Pick start date & time"
            error={errors.starts_at}
          />
        </Field>
        <Field label="End Date & Time">
          <DateTimePicker
            value={formData.ends_at}
            onChange={(v) => set("ends_at", v)}
            placeholder="Pick end date & time"
            minValue={formData.starts_at}
            error={errors.ends_at}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Venue Name *" error={errors.venue_name}>
          <input
            value={formData.venue_name}
            onChange={(e) => set("venue_name", e.target.value)}
            placeholder="Venue or Online"
            className={inputCls}
          />
        </Field>
        <Field label="Street Address">
          <input
            value={formData.venue_address}
            onChange={(e) => set("venue_address", e.target.value)}
            placeholder="123 Main Street"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="City *" error={errors.city}>
          <input
            value={formData.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. New York"
            className={inputCls}
          />
        </Field>
        <Field label="State / Province">
          <input
            value={formData.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="e.g. New York"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Zip / Postal Code">
          <input
            value={formData.zip_code}
            onChange={(e) => set("zip_code", e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="10001"
            className={inputCls}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </Field>
        <Field label="Country">
          <CountrySelector
            value={formData.country}
            onChange={(country) => set("country", country.code)}
            placeholder="Select country"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={formData.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Tell guests what to expect…"
          rows={4}
          className={`${inputCls} resize-none min-h-[100px]`}
        />
      </Field>

      <Field label="Timezone (Auto-detected)">
        <input
          value={formData.timezone}
          disabled
          className={`${inputCls} bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75`}
        />
      </Field>

      <button
        onClick={handleContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white transition active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
      >
        Continue <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}

/* ── Wizard shell ──────────────────────────────────────────── */
function CreateEventPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { createEvent } = useEventStore();

  const catParam  = searchParams.get("category");
  const subParam  = searchParams.get("sub");
  const fromParam = searchParams.get("from");

  // Both category + sub provided → jump straight to step 2 (flow)
  const preSelected = (() => {
    if (!catParam || !subParam) return null;
    const cat = EVENT_CATEGORIES.find((c) => c.id === catParam);
    const sub = cat?.subcategories.find((s) => s.id === subParam);
    return cat && sub ? { cat, sub } : null;
  })();

  // Only category provided (e.g. ?category=entertainment from TicketGateModal)
  // → jump to step 1 (subcategory picker) with the category pre-selected
  const preCategory = !preSelected && catParam
    ? EVENT_CATEGORIES.find((c) => c.id === catParam) ?? null
    : null;

  const [step, setStep]               = useState(preSelected ? 2 : preCategory ? 1 : 0);
  const [category, setCategory]       = useState(preSelected?.cat ?? preCategory ?? null);
  const [subcategory, setSubcategory] = useState(preSelected?.sub ?? null);
  const [features, setFeatures]       = useState(() => ({
    rsvp:      !(preSelected?.sub?.ticketDefault),
    ticketing: !!(preSelected?.sub?.ticketDefault),
    donations: false,
  }));
  const [formData, setFormData]       = useState({
    title: "", starts_at: "", ends_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    venue_name: "", venue_address: "", city: "", state: "", zip_code: "", country: "",
    description: "", short_description: "",
    visibility: "PRIVATE",
  });
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);
  const [pendingEventData, setPendingEventData] = useState(null);
  const [creatingAfterUpgrade, setCreatingAfterUpgrade] = useState(false);
  const { openUpgradeModal, isAtEventLimit, fetchSubscription, plan, isPremium } = useSubscriptionStore();

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // Watch for plan upgrades - create event after payment
  useEffect(() => {
    const createPendingEvent = async () => {
      const premium = isPremium();
      if (pendingEventData && premium && !creatingAfterUpgrade) {
        setCreatingAfterUpgrade(true);
        try {
          const event = await createEvent(pendingEventData);
          if (event?.id) {
            if (fromParam === "tickets") {
              router.push(`/events/${event.id}/builder?from=create`);
            } else if (pendingEventData.allow_ticketing) {
              router.push(`/events/${event.id}/tickets`);
            } else {
              router.push(`/events/${event.id}/builder?from=create`);
            }
          }
        } catch (err) {
          setError({ type: "generic", message: "Event created but navigation failed. Check your events list." });
        } finally {
          setPendingEventData(null);
          setCreatingAfterUpgrade(false);
        }
      }
    };
    createPendingEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, pendingEventData]);

  // Don't block upfront - let users fill the form
  const atLimit = false;

  // When a subcategory is chosen, seed smart defaults
  const selectSubcategory = (sub) => {
    setSubcategory(sub);
    setFeatures({
      rsvp:      !sub.ticketDefault,
      ticketing: !!sub.ticketDefault,
      donations: false,
    });
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const defaults = features.ticketing ? TICKET_DEFAULTS : RSVP_DEFAULTS;
      const payload = {
        ...defaults,
        event_type:        subcategory.eventType,
        dashboard_mode:    subcategory.id,
        title:             formData.title.trim(),
        starts_at:         formData.starts_at,
        ends_at:           formData.ends_at || undefined,
        timezone:          formData.timezone,
        venue_name:        formData.venue_name || undefined,
        venue_address:     formData.venue_address || undefined,
        city:              formData.city || undefined,
        state:             formData.state || undefined,
        zip_code:          formData.zip_code || undefined,
        country:           formData.country || undefined,
        description:       formData.description || undefined,
        short_description: formData.short_description || undefined,
        visibility:        formData.visibility,
        allow_rsvp:        features.rsvp,
        allow_ticketing:   features.ticketing,
        allow_qr_checkin:  true,
        allow_donations:   features.donations,
      };

      const event = await createEvent(payload);
      if (!event?.id) {
        setError({ type: "generic", message: "Failed to create event. Please try again." });
        return;
      }
      if (fromParam === "tickets") {
        router.push(`/events/${event.id}/builder?from=create`);
      } else if (features.ticketing) {
        router.push(`/events/${event.id}/tickets`);
      } else {
        router.push(`/events/${event.id}/builder?from=create`);
      }
    } catch (err) {
      const data = err?.response?.data ?? {};
      if (data.code === "PLAN_LIMIT_EVENTS" || err?.response?.status === 403) {
        // Store the event data and open billing modal instead of showing error
        const defaults = features.ticketing ? TICKET_DEFAULTS : RSVP_DEFAULTS;
        const payload = {
          ...defaults,
          event_type:        subcategory.eventType,
          dashboard_mode:    subcategory.id,
          title:             formData.title.trim(),
          starts_at:         formData.starts_at,
          ends_at:           formData.ends_at || undefined,
          timezone:          formData.timezone,
          venue_name:        formData.venue_name || undefined,
          venue_address:     formData.venue_address || undefined,
          city:              formData.city || undefined,
          state:             formData.state || undefined,
          zip_code:          formData.zip_code || undefined,
          country:           formData.country || undefined,
          description:       formData.description || undefined,
          short_description: formData.short_description || undefined,
          visibility:        formData.visibility,
          allow_rsvp:        features.rsvp,
          allow_ticketing:   features.ticketing,
          allow_qr_checkin:  true,
          allow_donations:   features.donations,
        };
        setPendingEventData(payload);
        setSubmitting(false);
        openUpgradeModal("events");
        return;
      } else {
        setError({ type: "generic", message: data.message || "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backLabel = fromParam === "tickets" ? "Back to tickets" : "Back to events";
  const backPath  = fromParam === "tickets" ? "/tickets" : "/events";

  // No upfront gate - let users fill the form, show billing at the end
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 py-4 sm:py-8">

        {/* Back button */}
        <button
          onClick={() => router.push(backPath)}
          className="mb-4 sm:mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </button>

        {/* Progress indicator */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < step
                    ? "bg-indigo-600 text-white"
                    : i === step
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  i === step ? "text-gray-900 dark:text-white" : "text-gray-400"
                }`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-2 ${
                    i < step ? "bg-indigo-400" : "bg-gray-200 dark:bg-gray-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error?.type === "generic" && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error.message}
          </div>
        )}

        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 shadow-sm">
          {step === 0 && (
            <StepCategory onSelect={(cat) => { setCategory(cat); setStep(1); }} />
          )}
          {step === 1 && category && (
            <StepSubcategory
              category={category}
              onSelect={selectSubcategory}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && subcategory && (
            <StepDetails
              subcategory={subcategory}
              features={features}
              formData={formData}
              setFormData={setFormData}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && subcategory && (
            <StepFeatures
              subcategory={subcategory}
              features={features}
              onChange={(key, val) => setFeatures((f) => {
                if (!val) return { ...f, [key]: false };
                const exclusive = ['rsvp', 'ticketing', 'donations'];
                if (!exclusive.includes(key)) return { ...f, [key]: true };
                return { ...f, rsvp: key === 'rsvp', ticketing: key === 'ticketing', donations: key === 'donations' };
              })}
              onNext={handleSubmit}
              onBack={() => setStep(2)}
              submitting={submitting}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense>
      <CreateEventPageInner />
    </Suspense>
  );
}










// "use client";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import { ChevronLeft, Check, Ticket, Users, Zap, Settings2, Lock, Sparkles, ArrowRight, CalendarDays, LayoutTemplate } from "lucide-react";
// import { useEventStore } from "@/store/event.store";
// import { useSubscriptionStore } from "@/store/subscription.store";
// import { EVENT_CATEGORIES, RSVP_DEFAULTS, TICKET_DEFAULTS } from "@/config/event-categories";
// import DateTimePicker from "@/components/ui/DateTimePicker";

// // ── Plan limit error card ────────────────────────────────────────────────────
// function EventLimitCard({ onUpgrade }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10, scale: 0.98 }}
//       animate={{ opacity: 1, y: 0, scale: 1 }}
//       transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
//       className="mb-6 overflow-hidden rounded-2xl"
//       style={{
//         background: "linear-gradient(135deg, #0f0f12 0%, #1a1208 100%)",
//         border: "1px solid rgba(245,158,11,0.25)",
//         boxShadow: "0 8px 32px rgba(245,158,11,0.12)",
//       }}
//     >
//       {/* Amber glow */}
//       <div
//         className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
//         style={{ background: "rgba(245,158,11,0.15)" }}
//         aria-hidden
//       />

//       <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
//         {/* Icon */}
//         <div
//           className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
//           style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
//         >
//           <Lock size={24} style={{ color: "#F59E0B" }} />
//         </div>

//         {/* Copy */}
//         <div className="flex-1 min-w-0">
//           <div
//             className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
//             style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}
//           >
//             <Sparkles size={9} />
//             Free plan limit reached
//           </div>
//           <h3 className="text-[15px] font-bold text-white">You&apos;ve used your 1 free event</h3>
//           <p className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
//             Upgrade to Premium for unlimited events, all 18 templates, and every feature — no caps, ever.
//           </p>

//           {/* Feature pills */}
//           <div className="mt-3 flex flex-wrap gap-2">
//             {[
//               { icon: CalendarDays,   text: "Unlimited events"   },
//               { icon: LayoutTemplate, text: "18 premium templates" },
//               { icon: Users,          text: "Unlimited guests"   },
//             ].map(({ icon: Icon, text }) => (
//               <span
//                 key={text}
//                 className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
//                 style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
//               >
//                 <Icon size={10} />
//                 {text}
//               </span>
//             ))}
//           </div>
//         </div>

//         {/* CTA */}
//         <button
//           onClick={onUpgrade}
//           className="group flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
//           style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.4)" }}
//           onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(245,158,11,0.6)")}
//           onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,158,11,0.4)")}
//         >
//           <Zap size={13} fill="currentColor" />
//           Upgrade — $12/mo
//           <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
//         </button>
//       </div>
//     </motion.div>
//   );
// }

// const STEPS = ["Category", "Type", "Flow", "Details"];

// // ── Shared field wrapper — module-level, never re-created ─────────────────────
// function Field({ label, error, children }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
//         {label}
//       </label>
//       {children}
//       {error && <p className="text-xs text-red-500">{error}</p>}
//     </div>
//   );
// }

// // ── Step 1: Category grid ─────────────────────────────────────────────────────
// function StepCategory({ onSelect }) {
//   return (
//     <div className="space-y-6">
//       <div className="text-center">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What kind of event?</h2>
//         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose the category that best fits your event</p>
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//         {EVENT_CATEGORIES.map((cat) => (
//           <button
//             key={cat.id}
//             onClick={() => onSelect(cat)}
//             className={`flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${cat.border} ${cat.bg} dark:bg-gray-800 dark:border-gray-700`}
//           >
//             <span className="text-3xl mt-0.5">{cat.icon}</span>
//             <div>
//               <p className="font-semibold text-gray-900 dark:text-white text-sm">{cat.label}</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>
//               <p className="text-xs mt-2" style={{ color: cat.color }}>{cat.subcategories.length} event types</p>
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── Step 2: Sub-event type ────────────────────────────────────────────────────
// function StepSubcategory({ category, onSelect, onBack }) {
//   return (
//     <div className="space-y-6">
//       <div className="text-center">
//         <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
//           <ChevronLeft className="w-4 h-4" /> Back
//         </button>
//         <span className="text-3xl">{category.icon}</span>
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{category.label}</h2>
//         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select the specific type</p>
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//         {category.subcategories.map((sub) => (
//           <button
//             key={sub.id}
//             onClick={() => onSelect(sub)}
//             className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${category.border} ${category.bg} dark:bg-gray-800 dark:border-gray-700`}
//           >
//             <span className="text-2xl">{sub.icon}</span>
//             <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{sub.label}</p>
//             {sub.ticketDefault && (
//               <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
//                 Ticketed
//               </span>
//             )}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── Step 3: RSVP vs Ticket ────────────────────────────────────────────────────
// function StepFlow({ subcategory, onSelect, onBack }) {
//   return (
//     <div className="space-y-6">
//       <div className="text-center">
//         <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
//           <ChevronLeft className="w-4 h-4" /> Back
//         </button>
//         <span className="text-2xl">{subcategory.icon}</span>
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{subcategory.label}</h2>
//         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Will guests need to buy tickets to attend?</p>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
//         <button
//           onClick={() => onSelect(false)}
//           className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-indigo-400 hover:shadow-lg"
//         >
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
//             <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
//           </div>
//           <div>
//             <p className="font-bold text-gray-900 dark:text-white text-base">Free / Invitation Only</p>
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
//               Guests are invited by email or link. They RSVP to confirm attendance. No payment required.
//             </p>
//           </div>
//           <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
//             {["Guest list & invitations", "RSVP tracking", "QR check-in", "Private or public"].map((f) => (
//               <li key={f} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
//             ))}
//           </ul>
//           <span className="mt-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
//             Choose RSVP →
//           </span>
//         </button>

//         <button
//           onClick={() => onSelect(true)}
//           className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-amber-400 hover:shadow-lg"
//         >
//           {subcategory.ticketDefault && (
//             <span className="absolute right-4 top-4 text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
//               Recommended
//             </span>
//           )}
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
//             <Ticket className="w-6 h-6 text-amber-600 dark:text-amber-400" />
//           </div>
//           <div>
//             <p className="font-bold text-gray-900 dark:text-white text-base">Sell Tickets</p>
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
//               Guests purchase tickets online. Receive professional e-tickets with QR codes by email.
//             </p>
//           </div>
//           <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
//             {["Multiple ticket tiers", "Stripe payments", "E-ticket with QR code", "Sales dashboard"].map((f) => (
//               <li key={f} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
//             ))}
//           </ul>
//           <span className="mt-auto text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
//             Choose Ticketing →
//           </span>
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Step 4: Details form ──────────────────────────────────────────────────────
// // Input is NOT a component — inputs are inlined to prevent focus loss on re-render
// function StepDetails({ subcategory, isTicketed, onBack, onSubmit, submitting }) {
//   const [mode, setMode] = useState(null); // null | "quick" | "advanced"
//   const [form, setForm] = useState({
//     title: "", starts_at: "", ends_at: "", timezone: "UTC",
//     venue_name: "", venue_address: "", city: "", country: "",
//     description: "", short_description: "",
//     visibility: isTicketed ? "PUBLIC" : "PRIVATE",
//   });
//   const [errors, setErrors] = useState({});

//   const set = (k, v) => {
//     setForm((p) => ({ ...p, [k]: v }));
//     setErrors((p) => ({ ...p, [k]: null }));
//   };

//   const validate = () => {
//     const e = {};
//     if (!form.title.trim()) e.title = "Title is required";
//     if (!form.starts_at)    e.starts_at = "Start date is required";
//     if (!form.ends_at)      e.ends_at = "End date is required";
//     if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at))
//       e.ends_at = "End must be after start";
//     return e;
//   };

//   const handleSubmit = () => {
//     const e = validate();
//     if (Object.keys(e).length) { setErrors(e); return; }
//     const defaults = isTicketed ? TICKET_DEFAULTS : RSVP_DEFAULTS;
//     onSubmit({ ...defaults, ...form, event_type: subcategory.eventType, dashboard_mode: subcategory.id });
//   };

//   const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

//   if (!mode) {
//     return (
//       <div className="space-y-6">
//         <div className="text-center">
//           <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
//             <ChevronLeft className="w-4 h-4" /> Back
//           </button>
//           <span className="text-2xl">{subcategory.icon}</span>
//           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
//             {subcategory.label} · {isTicketed ? "Ticketed" : "RSVP"}
//           </h2>
//           <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How do you want to set up?</p>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
//           <button
//             onClick={() => setMode("quick")}
//             className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition hover:border-indigo-400 hover:shadow-lg"
//           >
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
//               <Zap className="w-5 h-5 text-indigo-600" />
//             </div>
//             <div>
//               <p className="font-bold text-gray-900 dark:text-white">Quick Setup</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Title, date & venue. Done in 30 seconds.</p>
//             </div>
//           </button>
//           <button
//             onClick={() => setMode("advanced")}
//             className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition hover:border-indigo-400 hover:shadow-lg"
//           >
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
//               <Settings2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//             </div>
//             <div>
//               <p className="font-bold text-gray-900 dark:text-white">Full Setup</p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add description, visibility & more.</p>
//             </div>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex items-center justify-between">
//         <button
//           onClick={() => setMode(null)}
//           className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
//         >
//           <ChevronLeft className="w-4 h-4" /> Back
//         </button>
//         <span className="text-xs font-semibold text-gray-400">
//           {mode === "quick" ? "Quick Setup" : "Full Setup"}
//         </span>
//       </div>

//       <Field label="Event Title *" error={errors.title}>
//         <input
//           value={form.title}
//           onChange={(e) => set("title", e.target.value)}
//           placeholder={`e.g. ${subcategory.icon} ${subcategory.label} 2025`}
//           className={inputCls}
//         />
//       </Field>

//       <div className="grid grid-cols-2 gap-3">
//         <Field label="Start Date & Time *">
//           <DateTimePicker
//             value={form.starts_at}
//             onChange={(v) => set("starts_at", v)}
//             placeholder="Pick start date & time"
//             error={errors.starts_at}
//           />
//         </Field>
//         <Field label="End Date & Time *">
//           <DateTimePicker
//             value={form.ends_at}
//             onChange={(v) => set("ends_at", v)}
//             placeholder="Pick end date & time"
//             minValue={form.starts_at}
//             error={errors.ends_at}
//           />
//         </Field>
//       </div>

//       <div className="grid grid-cols-2 gap-3">
//         <Field label="Venue Name">
//           <input
//             value={form.venue_name}
//             onChange={(e) => set("venue_name", e.target.value)}
//             placeholder="Venue or Online"
//             className={inputCls}
//           />
//         </Field>
//         <Field label="City">
//           <input
//             value={form.city}
//             onChange={(e) => set("city", e.target.value)}
//             placeholder="City"
//             className={inputCls}
//           />
//         </Field>
//       </div>

//       {mode === "advanced" && (
//         <>
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="Address">
//               <input
//                 value={form.venue_address}
//                 onChange={(e) => set("venue_address", e.target.value)}
//                 placeholder="Street address"
//                 className={inputCls}
//               />
//             </Field>
//             <Field label="Country">
//               <input
//                 value={form.country}
//                 onChange={(e) => set("country", e.target.value)}
//                 placeholder="Country"
//                 className={inputCls}
//               />
//             </Field>
//           </div>

//           <Field label="Short Description">
//             <input
//               value={form.short_description}
//               onChange={(e) => set("short_description", e.target.value)}
//               placeholder="One-line summary shown in previews"
//               className={inputCls}
//             />
//           </Field>

//           <Field label="Description">
//             <textarea
//               value={form.description}
//               onChange={(e) => set("description", e.target.value)}
//               rows={3}
//               placeholder="Tell guests what this event is about…"
//               className={`${inputCls} resize-none`}
//             />
//           </Field>

//           <Field label="Visibility">
//             <select
//               value={form.visibility}
//               onChange={(e) => set("visibility", e.target.value)}
//               className={inputCls}
//             >
//               <option value="PUBLIC">Public — anyone can find it</option>
//               <option value="PRIVATE">Private — by invitation only</option>
//               <option value="UNLISTED">Unlisted — link only</option>
//             </select>
//           </Field>
//         </>
//       )}

//       <button
//         onClick={handleSubmit}
//         disabled={submitting}
//         className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 py-3.5 text-sm font-bold text-white transition"
//       >
//         {submitting ? (
//           <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
//         ) : (
//           <><Check className="w-4 h-4" /> Create {subcategory.label}</>
//         )}
//       </button>
//     </div>
//   );
// }

// // ── Wizard shell ──────────────────────────────────────────────────────────────
// export default function CreateEventPage() {
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const { createEvent } = useEventStore();

//   /* ── pre-select from ticket dashboard query params ── */
//   const catParam  = searchParams.get("category");
//   const subParam  = searchParams.get("sub");
//   const fromParam = searchParams.get("from"); // "tickets" when coming from ticket dashboard

//   const preSelected = (() => {
//     if (!catParam || !subParam) return null;
//     const cat = EVENT_CATEGORIES.find((c) => c.id === catParam);
//     const sub = cat?.subcategories.find((s) => s.id === subParam);
//     return cat && sub ? { cat, sub } : null;
//   })();

//   const [step, setStep]               = useState(preSelected ? 2 : 0);
//   const [category, setCategory]       = useState(preSelected?.cat ?? null);
//   const [subcategory, setSubcategory] = useState(preSelected?.sub ?? null);
//   const [isTicketed, setIsTicketed]   = useState(false);
//   const [submitting, setSubmitting]   = useState(false);
//   const [error, setError]             = useState(null);
//   const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

//   const handleSubmit = async (payload) => {
//     setSubmitting(true);
//     setError(null);
//     try {
//       const event = await createEvent(payload);
//       if (!event?.id) {
//         setError({ type: "generic", message: "Failed to create event. Please try again." });
//         return;
//       }
//       /* When coming from the ticket dashboard, always open the builder
//          so the user can pick a template and design their event page first. */
//       if (fromParam === "tickets") {
//         router.push(`/events/${event.id}/builder?from=create`);
//       } else if (isTicketed) {
//         router.push(`/events/${event.id}/tickets`);
//       } else {
//         router.push(`/events/${event.id}/builder?from=create`);
//       }
//     } catch (err) {
//       const data = err?.response?.data ?? {};
//       if (data.code === "PLAN_LIMIT_EVENTS" || err?.response?.status === 403) {
//         setError({ type: "limit" });
//       } else {
//         setError({ type: "generic", message: data.message || "Something went wrong. Please try again." });
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const backLabel = fromParam === "tickets" ? "Back to tickets" : "Back to events";
//   const backPath  = fromParam === "tickets" ? "/tickets" : "/events";

//   return (
//     <div className="flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
//       <div className="mx-auto w-full max-w-4xl px-4 py-8">

//         {/* Back button */}
//         <button
//           onClick={() => router.push(backPath)}
//           className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
//         >
//           <ChevronLeft className="w-4 h-4" />
//           {backLabel}
//         </button>

//         {/* Progress indicator */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between">
//             {STEPS.map((s, i) => (
//               <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
//                 <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
//                   i < step
//                     ? "bg-indigo-600 text-white"
//                     : i === step
//                       ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400"
//                       : "bg-gray-200 dark:bg-gray-700 text-gray-400"
//                 }`}>
//                   {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
//                 </div>
//                 <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
//                   {s}
//                 </span>
//                 {i < STEPS.length - 1 && (
//                   <div className={`h-px flex-1 mx-2 ${i < step ? "bg-indigo-400" : "bg-gray-200 dark:bg-gray-700"}`} />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {error?.type === "limit" && (
//           <div className="relative">
//             <EventLimitCard onUpgrade={() => openUpgradeModal("events")} />
//           </div>
//         )}

//         {error?.type === "generic" && (
//           <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
//             {error.message}
//           </div>
//         )}

//         <div className="rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 shadow-sm">
//           {step === 0 && (
//             <StepCategory onSelect={(cat) => { setCategory(cat); setStep(1); }} />
//           )}
//           {step === 1 && category && (
//             <StepSubcategory
//               category={category}
//               onSelect={(sub) => { setSubcategory(sub); setStep(2); }}
//               onBack={() => setStep(0)}
//             />
//           )}
//           {step === 2 && subcategory && (
//             <StepFlow
//               subcategory={subcategory}
//               onSelect={(ticketed) => { setIsTicketed(ticketed); setStep(3); }}
//               onBack={() => setStep(1)}
//             />
//           )}
//           {step === 3 && subcategory && (
//             <StepDetails
//               subcategory={subcategory}
//               isTicketed={isTicketed}
//               onBack={() => setStep(2)}
//               onSubmit={handleSubmit}
//               submitting={submitting}
//             />
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }
