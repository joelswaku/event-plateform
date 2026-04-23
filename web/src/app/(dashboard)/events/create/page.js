"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Ticket, Users, Zap, Settings2 } from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { EVENT_CATEGORIES, RSVP_DEFAULTS, TICKET_DEFAULTS, findSubcategory } from "@/config/event-categories";

const STEPS = ["Category", "Type", "Flow", "Details"];

// ── Step 1: Category grid ──────────────────────────────────────────────────────
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

// ── Step 2: Sub-event type ─────────────────────────────────────────────────────
function StepSubcategory({ category, onSelect, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
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
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Ticketed</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: RSVP vs Ticket ─────────────────────────────────────────────────────
function StepFlow({ subcategory, onSelect, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-2xl">{subcategory.icon}</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{subcategory.label}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Will guests need to buy tickets to attend?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* No tickets — RSVP */}
        <button
          onClick={() => onSelect(false)}
          className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-indigo-400 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">Free / Invitation Only</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Guests are invited by email or link. They RSVP to confirm attendance. No payment required.
            </p>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            {["Guest list & invitations", "RSVP tracking", "QR check-in", "Private or public"].map((f) => (
              <li key={f} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
            ))}
          </ul>
          <span className="mt-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
            Choose RSVP →
          </span>
        </button>

        {/* Sell tickets */}
        <button
          onClick={() => onSelect(true)}
          className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition hover:border-amber-400 hover:shadow-lg"
        >
          {subcategory.ticketDefault && (
            <span className="absolute right-4 top-4 text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Recommended</span>
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
              <li key={f} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
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

// ── Step 4: Quick or Full details ──────────────────────────────────────────────
function StepDetails({ category, subcategory, isTicketed, onBack, onSubmit, submitting }) {
  const [mode, setMode]   = useState(null); // null | "quick" | "advanced"
  const [form, setForm]   = useState({
    title: "", starts_at: "", ends_at: "", timezone: "UTC",
    venue_name: "", venue_address: "", city: "", country: "",
    description: "", short_description: "",
    visibility: isTicketed ? "PUBLIC" : "PRIVATE",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.starts_at)    e.starts_at = "Start date is required";
    if (!form.ends_at)      e.ends_at = "End date is required";
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at))
      e.ends_at = "End must be after start";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const defaults = isTicketed ? TICKET_DEFAULTS : RSVP_DEFAULTS;
    onSubmit({
      ...defaults,
      ...form,
      event_type: subcategory.eventType,
      dashboard_mode: subcategory.id,
    });
  };

  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mx-auto mb-3">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-2xl">{subcategory.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {subcategory.label} · {isTicketed ? "Ticketed" : "RSVP"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How do you want to set up?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <button
            onClick={() => setMode("quick")}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition hover:border-indigo-400 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Quick Setup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Title, date & venue. Done in 30 seconds.</p>
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

  const Field = ({ label, error, children }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );

  const Input = ({ field, ...props }) => (
    <input
      value={form[field]}
      onChange={(e) => set(field, e.target.value)}
      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      {...props}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setMode(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-semibold text-gray-400">{mode === "quick" ? "Quick Setup" : "Full Setup"}</span>
      </div>

      <Field label="Event Title *" error={errors.title}>
        <Input field="title" placeholder={`e.g. ${subcategory.icon} ${subcategory.label} 2025`} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date & Time *" error={errors.starts_at}>
          <Input field="starts_at" type="datetime-local" />
        </Field>
        <Field label="End Date & Time *" error={errors.ends_at}>
          <Input field="ends_at" type="datetime-local" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Venue Name">
          <Input field="venue_name" placeholder="Venue or Online" />
        </Field>
        <Field label="City">
          <Input field="city" placeholder="City" />
        </Field>
      </div>

      {mode === "advanced" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address">
              <Input field="venue_address" placeholder="Street address" />
            </Field>
            <Field label="Country">
              <Input field="country" placeholder="Country" />
            </Field>
          </div>

          <Field label="Short Description">
            <Input field="short_description" placeholder="One-line summary shown in previews" />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Tell guests what this event is about…"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </Field>

          <Field label="Visibility">
            <select
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="PUBLIC">Public — anyone can find it</option>
              <option value="PRIVATE">Private — by invitation only</option>
              <option value="UNLISTED">Unlisted — link only</option>
            </select>
          </Field>
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 py-3.5 text-sm font-bold text-white transition"
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

// ── Wizard shell ───────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEventStore();

  const [step, setStep]               = useState(0); // 0=category 1=sub 2=flow 3=details
  const [category, setCategory]       = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [isTicketed, setIsTicketed]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createEvent(payload);
      if (!res?.success) { setError("Failed to create event. Please try again."); return; }
      // Navigate to builder for RSVP events, or ticket setup for ticketed events
      const eventId = res.data?.id;
      if (isTicketed) {
        router.push(`/events/${eventId}/tickets`);
      } else {
        router.push(`/events/${eventId}/builder`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < step ? "bg-indigo-600 text-white" :
                  i === step ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400" :
                  "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-2 ${i < step ? "bg-indigo-400" : "bg-gray-200 dark:bg-gray-700"}`} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
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
              category={category}
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
