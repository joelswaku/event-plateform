"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Clock, Lock, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import LegalModal from "@/components/legal/LegalModal";
import { createPaymentRequestKey } from "@/lib/payment-idempotency";
import { resolveThemeFromSections } from "@/lib/styleThemes";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}
function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);
}

const ROSE  = "var(--t-accent)";
const GOLD  = "var(--t-text-muted)";

// ── Selected contribution confirmation ────────────────────────────────────────
function ContributionSummary({ amount, frequency }) {
  if (!amount || amount <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: "color-mix(in srgb, var(--t-accent) 10%, var(--t-bg-alt))", border: "1px solid var(--t-border)" }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--t-accent) 18%, var(--t-bg-alt))", color: ROSE }}>
        <Heart size={14} fill="currentColor" stroke="currentColor" />
      </div>
      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--t-text)" }}>
        Your selected contribution is <strong>{fmt(amount)}</strong>{frequency === "monthly" ? " each month." : "."}
      </p>
    </motion.div>
  );
}

// ── Fundraiser information ────────────────────────────────────────────────────
function InfoCard({ event, donConfig, children }) {
  const fundraiserTitle = donConfig?.title || event?.title;
  const coverImage = donConfig?.cover_image || event?.cover_image_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden"
    >

      {/* Cover image or header */}
      {coverImage ? (
        <div className="relative h-[330px] overflow-hidden sm:h-[430px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--t-dark) 96%, transparent) 0%, color-mix(in srgb, var(--t-dark) 52%, transparent) 52%, color-mix(in srgb, var(--t-dark) 10%, transparent) 100%)" }} />
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{
              background: "radial-gradient(circle at 30% 50%, var(--t-accent-dim) 0%, transparent 70%)",
              mixBlendMode: "overlay"
            }}
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-3xl px-6 pb-8 sm:px-10 sm:pb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.22)" }}>
                <Heart size={12} fill="var(--t-accent)" stroke="var(--t-accent)" />
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white">Support this event</span>
              </div>
              <h1 className="text-3xl font-black text-white leading-tight mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {fundraiserTitle}
              </h1>
              {event?.title && event.title !== fundraiserTitle && (
                <p className="text-sm font-semibold text-white/70">Supporting {event.title}</p>
              )}
            </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative px-8 py-10 flex flex-col gap-4" style={{ background: "linear-gradient(135deg, var(--t-dark) 0%, var(--t-dark-surface) 100%)" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--t-accent) 16%, transparent)", border: "1.5px solid color-mix(in srgb, var(--t-accent) 42%, transparent)" }}>
              <Heart size={24} fill="var(--t-accent)" stroke="var(--t-accent)" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em]" style={{ color: "var(--t-accent)" }}>Support This Event</p>
              <p className="text-lg font-black text-white mt-1">{fundraiserTitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info body */}
      <div className="px-6 py-7 sm:px-10 sm:py-10" style={{ background: "var(--t-bg-alt)" }}>
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <div className="flex flex-col gap-6">

        {/* Event details */}
        <div className="space-y-3">
          {donConfig?.message ? (
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{donConfig.message}</p>
          ) : (
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
              Every contribution makes a difference. Your donation helps us create an unforgettable experience for everyone.
            </p>
          )}
          {event?.starts_at_local && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: "var(--t-text)", background: "color-mix(in srgb, var(--t-accent) 10%, var(--t-bg-alt))" }}>
              <Clock size={12} /> Event: {fmtDate(event.starts_at_local)}
            </p>
          )}
        </div>

        {/* Why donate section */}
        <div className="space-y-4 border-t pt-6" style={{ borderColor: "var(--t-border)" }}>
          <p className="text-center text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Donation details
          </p>
          <div className="space-y-3">
            {[
              { icon: "🔒", title: "Secure checkout", text: "Your contribution is processed securely through Stripe." },
              { icon: "💚", title: "Support the event", text: "Help the hosts deliver a memorable experience for their guests." },
              { icon: "✉️", title: "Confirmation by email", text: "You will receive a receipt after your contribution is complete." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-black" style={{ color: "var(--t-text)" }}>{item.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--t-text-muted)", letterSpacing: "0.12em" }}>
            <Lock size={10} /> Secure Payment
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 opacity-40">
            {/* Visa */}
            <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
              <rect width="40" height="26" rx="4" fill="#1A1F71"/>
              <path d="M16.2 17.8L17.8 8.2h2.5l-1.6 9.6h-2.5zm11-9.4c-.5-.2-1.3-.4-2.2-.4-2.4 0-4.1 1.2-4.1 3 0 1.3 1.2 2 2.1 2.4.9.5 1.2.8 1.2 1.2 0 .6-.8.9-1.5.9-1 0-1.5-.1-2.3-.5l-.3-.1-.3 2c.6.2 1.6.4 2.7.4 2.6 0 4.3-1.2 4.3-3.1 0-1-.6-1.8-2-2.4-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.7 1.3-.7.7 0 1.3.1 1.7.3l.2.1.3-1.9zm5.7-2.2h-1.9c-.6 0-1 .2-1.3.8l-3.6 8.6h2.6s.4-1.1.5-1.4h3.1c.1.3.3 1.4.3 1.4h2.3l-2-9.4zm-3 6.1c.2-.5 1-2.6 1-2.6s.2-.5.3-.8l.2.9s.5 2.2.6 2.7h-2.1v-.2zm-16.7-6.1l-2.4 6.5-.3-1.3c-.4-1.4-1.8-3-3.3-3.7l2.2 8.5h2.6l3.9-9.6h-2.7v-.4z" fill="white"/>
            </svg>
            <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
              <rect width="40" height="26" rx="4" fill="#EB001B"/>
              <circle cx="15" cy="13" r="7" fill="#FF5F00"/>
              <circle cx="25" cy="13" r="7" fill="#F79E1B"/>
              <path d="M20 7.5c-1.2 1.4-1.9 3.2-1.9 5.5s.7 4.1 1.9 5.5c1.2-1.4 1.9-3.2 1.9-5.5s-.7-4.1-1.9-5.5z" fill="#FF5F00"/>
            </svg>
            <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
              <rect width="40" height="26" rx="4" fill="#006FCF"/>
              <path d="M13.5 10.5h-2.2l-1.4 3.3-1.4-3.3h-2.3v4.8l-1.7-4.8h-2l-2.5 7h1.8l.5-1.4h2.7l.5 1.4h2.5v-5.3l1.6 5.3h1.5l1.6-5.3v5.3h1.8v-7zm-10.9 4.6l.8-2.2.8 2.2h-1.6zm21.9-4.6h-3.8v7h3.8c1.9 0 3.2-1.3 3.2-3.5s-1.3-3.5-3.2-3.5zm0 5.5h-1.8v-4h1.8c1 0 1.6.8 1.6 2s-.6 2-1.6 2zm9.5-5.5h-5v7h5v-1.5h-3.2v-1.2h3.1v-1.5h-3.1v-1.3h3.2v-1.5zm3.5 0l-2.2 3.5 2.2 3.5h-2.1l-1.3-2.2-1.3 2.2h-2.1l2.2-3.5-2.2-3.5h2.1l1.3 2.2 1.3-2.2h2.1z" fill="white"/>
            </svg>
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.05)" }}>
              <svg width="32" height="14" viewBox="0 0 60 25" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M60 12.5c0-6.9-5.6-12.5-12.5-12.5S35 5.6 35 12.5 40.6 25 47.5 25 60 19.4 60 12.5zm-23.8 0c0-4.3 2-8.2 5.1-10.6-2.3-1.5-5-2.4-7.9-2.4C26.5 0 20 5.6 20 12.5S26.5 25 33.4 25c2.9 0 5.6-.9 7.9-2.4-3.1-2.4-5.1-6.3-5.1-10.6zM20 12.5C20 5.6 13.8 0 6.2 0 2.8 0 0 2.2 0 5s2.8 5 6.2 5c1.5 0 2.9-.5 4-1.3v8.7c0 4.1-3.4 7.5-7.5 7.5-.7 0-1.4-.1-2-.3v.9c.6.3 1.3.5 2 .5C8.6 25 13.8 19.4 13.8 12.5c0-1.5-.3-2.9-.8-4.2 1.4.9 3 1.4 4.8 1.4 1.1 0 2.2-.2 3.2-.6v10.9c0 2.8-2.2 5-5 5h-1v1h1c3.3 0 6-2.7 6-6V5c0-2.8 2.2-5 5-5h1V0h-1c-3.3 0-6 2.7-6 6v6.5z" fill="#635BFF"/>
              </svg>
            </div>
          </div>
        </div>
          </div>
          {children && (
            <div className="min-w-0 lg:border-l lg:pl-14" style={{ borderColor: "var(--t-border)" }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Payment card (desktop right side + mobile) ────────────────────────────────
function PaymentCard({ event, donConfig }) {
  const presets = donConfig?.amounts?.length ? donConfig.amounts : [10, 25, 50, 100];
  const [freq,         setFreq]         = useState("once");
  const [preset,       setPreset]       = useState(null);
  const [custom,       setCustom]       = useState("");
  const [name,         setName]         = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [legalSlug,    setLegalSlug]    = useState(null);
  const donationRequestKey = useRef(createPaymentRequestKey("donation"));

  const amount = preset === "custom" ? Number(custom) : (preset ?? 0);

  async function handleDonate(e) {
    e.preventDefault();
    setTermsTouched(true);
    if (!amount || amount <= 0) return setError("Please select or enter an amount.");
    if (!termsChecked) return setError("Please accept the terms to donate.");
    setError(""); setSubmitting(true);
    try {
      const res  = await fetch(`${API}/engagement/events/${event.id}/donations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq, idempotency_key: donationRequestKey.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDone(true);
    } catch (err) { setError(err.message); setSubmitting(false); }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 py-16 text-center sm:px-10"
      >
        <div className="flex flex-col items-center gap-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--t-accent) 12%, var(--t-bg-alt))", border: "2px solid var(--t-border)" }}>
            <Heart size={36} fill={ROSE} stroke={ROSE} />
          </motion.div>
          <div className="space-y-2">
            <p style={{ fontFamily: "var(--t-font-heading)", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, color: "var(--t-text)", lineHeight: 1 }}>
              Thank you
            </p>
            <p className="text-base font-bold" style={{ color: "var(--t-text-muted)" }}>
              Your {freq === "monthly" ? "monthly " : ""}donation of <strong style={{ color: ROSE, fontSize: "1.15em" }}>{fmt(amount)}</strong> makes a real difference
            </p>
          </div>
          <div className="mt-2 rounded-2xl px-6 py-4 max-w-md" style={{ background: "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-alt))" }}>
            <p className="text-xs leading-relaxed font-semibold" style={{ color: "var(--t-text-muted)" }}>
               Your contribution helps make this event possible. You&apos;ll receive a confirmation email shortly with the details.
            </p>
          </div>
          <a href={`/e/${event.slug}`}
            className="mt-4 flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--t-accent)", color: "var(--t-dark)", letterSpacing: "0.06em" }}>
            <ArrowLeft size={14} /> Back to Event
          </a>
        </div>
      </motion.div>
    );
  }

  const inputBase = {
    background: "var(--t-bg)",
    border: "1.5px solid var(--t-border)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--t-text)",
    outline: "none",
    width: "100%",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pb-1 pt-6"
      style={{ background: "var(--t-bg-alt)" }}
    >
      <div className="flex max-w-none flex-col gap-6">

        {/* One Time / Monthly */}
        <div className="flex rounded-2xl p-1 gap-1"
          style={{ background: "color-mix(in srgb, var(--t-text) 7%, transparent)", border: "1px solid var(--t-border)" }}>
          {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setFreq(val)}
              className="flex-1 rounded-xl py-3 text-sm font-black tracking-wide transition-all"
              style={freq === val
                ? { background: "var(--t-accent)", color: "var(--t-dark)" }
                : { color: "var(--t-text-muted)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Amount selection */}
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#6d8f76" }}>
            Choose an amount
          </p>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(2, minmax(0, 1fr))` }}>
            {presets.map((a) => (
              <button key={a} type="button"
                onClick={() => { setPreset(a); setCustom(""); setError(""); }}
                className="py-6 font-black transition-all active:scale-95 hover:scale-105 relative overflow-hidden"
                style={{
                  borderRadius: 16,
                  fontFamily: "var(--t-font-heading)",
                  fontSize: "clamp(1.6rem,4vw,2.2rem)",
                  border: preset === a ? `2.5px solid ${ROSE}` : "1.5px solid var(--t-border)",
                  background: preset === a ? ROSE : "var(--t-bg)",
                  color: preset === a ? "var(--t-dark)" : "var(--t-text)",
                  boxShadow: preset === a ? "0 12px 26px var(--t-accent-dim)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                {preset === a && (
                  <motion.div
                    layoutId="selectedBg"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--t-accent) 82%, #fff) 0%, var(--t-accent) 100%)" }}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">${a}</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{
              ...inputBase,
              display: "flex",
              border: preset === "custom" ? `1.5px solid ${ROSE}` : "1.5px solid var(--t-border)",
            }}>
            <span className="text-base font-bold" style={{ color: "var(--t-text-muted)" }}>$</span>
            <input
              type="number" min="1"
              value={preset === "custom" ? custom : ""}
              placeholder="Other amount"
              onFocus={() => setPreset("custom")}
              onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 600, color: "var(--t-text)" }}
              className="placeholder-[#88958c]"
            />
          </div>

          {amount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-base font-black" style={{ color: ROSE }}>
              {freq === "monthly" ? `${fmt(amount)} / month` : `Total: ${fmt(amount)}`}
            </motion.p>
          )}
        </div>

        {/* Selected contribution */}
        <AnimatePresence mode="wait">
          {amount > 0 && <ContributionSummary amount={amount} frequency={freq} key={`${amount}-${freq}`} />}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.20em] mb-2" style={{ color: "var(--t-text-muted)" }}>
            Your name <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{ ...inputBase }}
            className="placeholder-[#98a49b]"
            onFocus={e => e.target.style.borderColor = ROSE}
            onBlur={e => e.target.style.borderColor = "var(--t-border)"}
          />
        </div>

        {error && (
          <p className="text-sm font-semibold" style={{ color: ROSE }}>{error}</p>
        )}

        {/* Terms acceptance */}
        <div className="flex items-start gap-2.5 select-none mt-1">
          <button
            type="button"
            onClick={() => { setTermsChecked(v => !v); setTermsTouched(true); }}
            className="mt-0.5 shrink-0 flex items-center justify-center rounded-[5px] border-2 transition-all"
            style={{ width: 16, height: 16,
              background: termsChecked ? "var(--t-accent)" : "transparent",
              borderColor: termsTouched && !termsChecked ? ROSE : "var(--t-border)" }}>
            {termsChecked && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3 5.5L8 1" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <span className="text-xs leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
            I agree to the{" "}
            <button type="button" onClick={() => setLegalSlug("terms")}
              className="underline underline-offset-2" style={{ color: ROSE }}>
              Terms of Service
            </button>
            {" "}and{" "}
            <button type="button" onClick={() => setLegalSlug("privacy-policy")}
              className="underline underline-offset-2" style={{ color: ROSE }}>
              Privacy Policy
            </button>
          </span>
        </div>
        <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

        {/* Primary CTA */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleDonate}
            disabled={submitting || !amount || amount <= 0}
            className="group w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden"
            style={{ background: "var(--t-accent)", color: "var(--t-dark)", fontSize: 14, letterSpacing: "0.10em", boxShadow: "0 8px 24px var(--t-accent-dim)" }}>
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--t-accent) 82%, #fff) 0%, var(--t-accent) 100%)" }}
            />
            <span className="relative z-10">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing Your Donation...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  <Heart size={16} fill="#ffffff" stroke="#ffffff" className="group-hover:scale-110 transition-transform" />
                  {amount > 0 ? (
                    freq === "monthly"
                      ? `Donate ${fmt(amount)}/Month`
                      : `Donate ${fmt(amount)}`
                  ) : (
                    "Select Amount to Continue"
                  )}
                  {amount > 0 && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </span>
              )}
            </span>
          </button>

          {amount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] font-semibold"
              style={{ color: "#607067" }}>
              You will receive instant confirmation by email.
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DonatePage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const [event,     setEvent]     = useState(null);
  const [theme,     setTheme]     = useState(() => resolveThemeFromSections([]));
  const [donConfig, setDonConfig] = useState({ amounts: [], message: "", title: "", cover_image: "" });
  const [loading,   setLoading]   = useState(true);
  const [banner] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("donation");
  });

  useEffect(() => {
    if (banner) window.history.replaceState({}, "", window.location.pathname);
  }, [banner]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/pages/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.event) setEvent(d.data.event);
        setTheme(resolveThemeFromSections(d.data?.sections));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!event?.id) return;
    fetch(`${API}/engagement/events/${event.id}/donation-config`)
      .then(r => r.json())
      .then(d => { if (d?.data) setDonConfig(d.data); })
      .catch(() => {});
  }, [event?.id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ ...theme, background: "var(--t-bg)", color: "var(--t-text)", fontFamily: "var(--t-font-body)" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');`}</style>

      {/* Fixed gradient layers */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0,
        background: "radial-gradient(ellipse 65% 45% at 10% 0%, var(--t-accent-dim) 0%,transparent 62%), radial-gradient(ellipse 55% 45% at 92% 90%, var(--t-accent-dim) 0%,transparent 62%)" }} />

      {/* Nav */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "color-mix(in srgb, var(--t-bg-alt) 88%, transparent)", backdropFilter: "blur(22px)", borderColor: "var(--t-border)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition"
            style={{ color: "var(--t-text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--t-accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--t-text-muted)"}>
            <ArrowLeft size={15} /> Back to event
          </button>
          <p className="text-[9px] font-black uppercase tracking-[0.30em]" style={{ color: "var(--t-accent)" }}>
            Support This Event
          </p>
          <div className="w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full py-0" style={{ zIndex: 2 }}>

        {/* Payment banner */}
        <AnimatePresence>
          {banner === "success" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl px-5 py-4 my-6"
              style={{ background: "color-mix(in srgb, var(--t-accent) 12%, var(--t-bg-alt))", border: "1px solid var(--t-border)" }}>
              <CheckCircle size={18} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
              <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>Thank you — your donation was received!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
            <div className="h-64 rounded-[28px] animate-pulse" style={{ background: "#e4ece5" }} />
            <div className="h-52 rounded-[28px] animate-pulse" style={{ background: "#edf3ee" }} />
          </div>
        )}

        {/* One continuous fundraiser experience */}
        {!loading && event && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full overflow-hidden"
            style={{ background: "var(--t-bg-alt)" }}
          >
            <InfoCard event={event} donConfig={donConfig}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: "var(--t-text-muted)" }}>Your contribution</p>
                <h2 className="mt-1 text-2xl font-black" style={{ color: "var(--t-text)", fontFamily: "var(--t-font-heading)" }}>Choose how you would like to give</h2>
                <PaymentCard event={event} donConfig={donConfig} />
              </div>
            </InfoCard>
          </motion.div>
        )}

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-9 sm:py-11" style={{ background: "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg))" }}>
          {[
            ["🔒", "Secure Stripe Checkout"],
            ["⚡", "Instant Confirmation"],
            ["✉️", "Receipt by Email"]
          ].map(([icon, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ color: "var(--t-text-muted)", letterSpacing: "0.10em" }}>
              <span className="text-sm">{icon}</span> {label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
