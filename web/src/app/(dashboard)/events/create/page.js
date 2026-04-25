
"use client";

/**
 * web/src/app/(dashboard)/events/create/page.js  ← REPLACE EXISTING
 *
 * Change vs original:
 *  - Added `preCategory` logic so ?category=entertainment (no sub param)
 *    auto-selects the category and starts at step 1 (subcategory picker).
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, Check, Ticket, Users, Zap, Settings2,
  Lock, Sparkles, ArrowRight, CalendarDays, LayoutTemplate,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { EVENT_CATEGORIES, RSVP_DEFAULTS, TICKET_DEFAULTS } from "@/config/event-categories";
import DateTimePicker from "@/components/ui/DateTimePicker";

/* ── Wizard steps ──────────────────────────────────────────── */
const STEPS = ["Category", "Type", "Setup", "Details"];

/* ── Plan limit error card ─────────────────────────────────── */
function EventLimitCard({ onUpgrade }) {
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
            Free plan limit reached
          </div>
          <h3 className="text-[15px] font-bold text-white">You&apos;ve used your 1 free event</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Upgrade to Premium for unlimited events, all 18 templates, and every feature — no caps, ever.
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-black transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", boxShadow: "0 4px 16px rgba(245,158,11,0.4)" }}
        >
          <Zap size={14} fill="currentColor" />
          Upgrade now
        </button>
      </div>
    </motion.div>
  );
}

/* ── Shared field wrapper ──────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ── Step 1: Category grid ─────────────────────────────────── */
function StepCategory({ onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What kind of event?</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose the category that best fits your event</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${cat.border} ${cat.bg} dark:bg-gray-800 dark:border-gray-700`}
          >
            <span className="text-3xl mt-0.5">{cat.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{cat.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>
              <p className="text-xs mt-2" style={{ color: cat.color }}>{cat.subcategories.length} event types</p>
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
    <div className="space-y-6">
      <div className="text-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-3xl">{category.icon}</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{category.label}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select the specific type</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {category.subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${category.border} ${category.bg} dark:bg-gray-800 dark:border-gray-700`}
          >
            <span className="text-2xl">{sub.icon}</span>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{sub.label}</p>
            {sub.ticketDefault && (
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                Ticketed
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: RSVP vs Ticketed ──────────────────────────────── */
function StepFlow({ subcategory, onSelect, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-3xl">{subcategory.icon}</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{subcategory.label}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How will guests attend?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RSVP */}
        <button
          onClick={() => onSelect(false)}
          className="group flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-indigo-400 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">Free RSVP</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Guests RSVP to confirm attendance. No payment required.
            </p>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            {["Guest list & invitations", "RSVP tracking", "QR check-in", "Private or public"].map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-500" />{f}
              </li>
            ))}
          </ul>
          <span className="mt-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
            Choose RSVP →
          </span>
        </button>

        {/* Ticketed */}
        <button
          onClick={() => onSelect(true)}
          className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-amber-400 hover:shadow-lg"
        >
          {subcategory.ticketDefault && (
            <span className="absolute right-4 top-4 text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
              Recommended
            </span>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
            <Ticket className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">Sell Tickets</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Guests purchase tickets online. Receive professional e-tickets with QR codes by email.
            </p>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            {["Multiple ticket tiers", "Stripe payments", "E-ticket with QR code", "Sales dashboard"].map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-500" />{f}
              </li>
            ))}
          </ul>
          <span className="mt-auto text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
            Choose Ticketing →
          </span>
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Details form ──────────────────────────────────── */
function StepDetails({ subcategory, isTicketed, onBack, onSubmit, submitting }) {
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({
    title: "", starts_at: "", ends_at: "", timezone: "UTC",
    venue_name: "", venue_address: "", city: "", country: "",
    description: "", short_description: "",
    visibility: isTicketed ? "PUBLIC" : "PRIVATE",
  });
  const [errors, setErrors] = useState({});

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition";

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.starts_at) e.starts_at = "Start date is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const defaults = isTicketed ? TICKET_DEFAULTS : RSVP_DEFAULTS;
    onSubmit({
      ...defaults,
      event_type:        subcategory.eventType,
      dashboard_mode:    subcategory.id,
      title:             form.title.trim(),
      starts_at:         form.starts_at,
      ends_at:           form.ends_at || undefined,
      timezone:          form.timezone,
      venue_name:        form.venue_name || undefined,
      venue_address:     form.venue_address || undefined,
      city:              form.city || undefined,
      country:           form.country || undefined,
      description:       form.description || undefined,
      short_description: form.short_description || undefined,
      visibility:        form.visibility,
      allow_ticketing:   isTicketed,
    });
  };

  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-3xl">{subcategory.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Create your event</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How much detail do you want to add now?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("quick")}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition hover:border-indigo-400 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Quick Setup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Just title & date. Done in 30 seconds.</p>
            </div>
          </button>
          <button
            onClick={() => setMode("advanced")}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition hover:border-indigo-400 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
              <Settings2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Full Setup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add description, visibility & more.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-semibold text-gray-400">
          {mode === "quick" ? "Quick Setup" : "Full Setup"}
        </span>
      </div>

      <Field label="Event Title *" error={errors.title}>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={`e.g. ${subcategory.icon} ${subcategory.label} 2025`}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date & Time *">
          <DateTimePicker
            value={form.starts_at}
            onChange={(v) => set("starts_at", v)}
            placeholder="Pick start date & time"
            error={errors.starts_at}
          />
        </Field>
        <Field label="End Date & Time">
          <DateTimePicker
            value={form.ends_at}
            onChange={(v) => set("ends_at", v)}
            placeholder="Pick end date & time"
            minValue={form.starts_at}
            error={errors.ends_at}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Venue Name">
          <input
            value={form.venue_name}
            onChange={(e) => set("venue_name", e.target.value)}
            placeholder="Venue or Online"
            className={inputCls}
          />
        </Field>
        <Field label="City">
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. New York"
            className={inputCls}
          />
        </Field>
      </div>

      {mode === "advanced" && (
        <>
          <Field label="Country">
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="e.g. United States"
              className={inputCls}
            />
          </Field>

          <Field label="Short Description">
            <input
              value={form.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              placeholder="One-line summary shown in previews"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell guests what to expect…"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Visibility">
            <select
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value)}
              className={inputCls}
            >
              <option value="PUBLIC">Public — anyone can find it</option>
              <option value="PRIVATE">Private — invite only</option>
            </select>
          </Field>

          <Field label="Timezone">
            <select
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className={inputCls}
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
      >
        {submitting ? (
          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
        ) : (
          <><Check className="w-4 h-4" /> Create {subcategory.label}</>
        )}
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
  const [isTicketed, setIsTicketed]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const event = await createEvent(payload);
      if (!event?.id) {
        setError({ type: "generic", message: "Failed to create event. Please try again." });
        return;
      }
      if (fromParam === "tickets") {
        router.push(`/events/${event.id}/builder?from=create`);
      } else if (isTicketed) {
        router.push(`/events/${event.id}/tickets`);
      } else {
        router.push(`/events/${event.id}/builder?from=create`);
      }
    } catch (err) {
      const data = err?.response?.data ?? {};
      if (data.code === "PLAN_LIMIT_EVENTS" || err?.response?.status === 403) {
        setError({ type: "limit" });
      } else {
        setError({ type: "generic", message: data.message || "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backLabel = fromParam === "tickets" ? "Back to tickets" : "Back to events";
  const backPath  = fromParam === "tickets" ? "/tickets" : "/events";

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => router.push(backPath)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </button>

        {/* Progress indicator */}
        <div className="mb-8">
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

        {error?.type === "limit" && (
          <div className="relative">
            <EventLimitCard onUpgrade={() => openUpgradeModal("events")} />
          </div>
        )}

        {error?.type === "generic" && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error.message}
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
          {step === 0 && (
            <StepCategory onSelect={(cat) => { setCategory(cat); setStep(1); }} />
          )}
          {step === 1 && category && (
            <StepSubcategory
              category={category}
              onSelect={(sub) => { setSubcategory(sub); setStep(2); }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && subcategory && (
            <StepFlow
              subcategory={subcategory}
              onSelect={(ticketed) => { setIsTicketed(ticketed); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && subcategory && (
            <StepDetails
              subcategory={subcategory}
              isTicketed={isTicketed}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
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

//         <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
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
