"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Clock, Lock, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import LegalModal from "@/components/legal/LegalModal";

const API = process.env.NEXT_PUBLIC_API_URL;

const DONATION_MARKETING = {
  CONCERT:    ["Give Back to", "Live Music."],
  FESTIVAL:   ["Support the", "Magic We Make."],
  LIVE_SHOW:  ["Back the Artists.", "Fuel the Stage."],
  NIGHTCLUB:  ["Keep the Night", "Alive."],
  THEATER:    ["Support the Arts.", "Lift the Curtain."],
  COMEDY:     ["Keep Laughter", "Free & Alive."],
  SPORTS:     ["Back Your", "Champions."],
  EXHIBITION: ["Invest in", "Art & Culture."],
  CONFERENCE: ["Fund the Ideas", "That Matter."],
  WEDDING:    ["Celebrate Love.", "Give From the Heart."],
  BIRTHDAY:   ["Make Their Day", "Unforgettable."],
  GALA:       ["Give Generously.", "Give With Grace."],
};
function marketingLine(event) {
  const t = String(event?.event_type ?? event?.dashboard_mode ?? "").toUpperCase();
  return DONATION_MARKETING[t] ?? ["Make a Difference.", "Give What You Can."];
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}
function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);
}

const ROSE  = "#f43f5e";
const GOLD  = "rgba(201,169,110,0.70)";

// ── Donation card ─────────────────────────────────────────────────────────────
function DonationCard({ event, donConfig }) {
  const presets = donConfig?.amounts?.length === 3 ? donConfig.amounts : [5, 10, 25];
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
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq }),
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
        className="overflow-hidden rounded-3xl text-center"
        style={{ background: "#f0ebe0", boxShadow: "0 32px 80px rgba(0,0,0,0.50)" }}
      >
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,#be185d,${ROSE},#fb923c)` }} />
        <div className="px-8 py-16 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.20)" }}>
            <Heart size={28} fill={ROSE} stroke={ROSE} />
          </div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "#0f0d0a", lineHeight: 1 }}>
            Thank you!
          </p>
          <p className="text-sm font-semibold" style={{ color: "#7a6e5f" }}>
            Your {freq === "monthly" ? "monthly " : ""}donation of <strong style={{ color: ROSE }}>{fmt(amount)}</strong> means everything.
          </p>
          <a href={`/e/${event.slug}`}
            className="mt-4 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white transition-all"
            style={{ background: "#0f0d0a", letterSpacing: "0.06em" }}>
            Back to Event
          </a>
        </div>
      </motion.div>
    );
  }

  const inputBase = {
    background: "rgba(0,0,0,0.06)",
    border: "1.5px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    color: "#0f0d0a",
    outline: "none",
    width: "100%",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl"
      style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Dark header ── */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ background: "#0c0814", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.30)" }}>
            <Heart size={16} fill={ROSE} stroke={ROSE} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: "rgba(244,63,94,0.75)" }}>
              Contribution
            </p>
            <p className="text-sm font-bold text-white">{event?.title}</p>
          </div>
        </div>
        {donConfig?.message && (
          <p className="hidden sm:block text-xs font-semibold max-w-xs text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
            {donConfig.message}
          </p>
        )}
      </div>

      {/* ── Cream body ── */}
      <div className="px-6 sm:px-8 pt-8 pb-8 flex flex-col gap-6" style={{ background: "#f0ebe0" }}>

        {donConfig?.message && (
          <p className="text-sm font-semibold text-center sm:hidden" style={{ color: "#7a6e5f" }}>{donConfig.message}</p>
        )}

        {/* One Time / Monthly */}
        <div className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.10)" }}>
          {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setFreq(val)}
              className="flex-1 rounded-xl py-3 text-sm font-black tracking-wide transition-all"
              style={freq === val
                ? { background: "#0f0d0a", color: "#f0ebe0" }
                : { color: "#7a6e5f" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Large centered price display */}
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#9a8c7e" }}>
            Choose your amount
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {presets.map((a) => (
              <button key={a} type="button"
                onClick={() => { setPreset(a); setCustom(""); setError(""); }}
                className="py-5 font-black transition-all active:scale-95"
                style={{
                  borderRadius: 16,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(1.4rem,3vw,2rem)",
                  border: preset === a ? `2px solid ${ROSE}` : "1.5px solid rgba(0,0,0,0.12)",
                  background: preset === a ? ROSE : "rgba(0,0,0,0.04)",
                  color: preset === a ? "#fff" : "#0f0d0a",
                  boxShadow: preset === a ? `0 8px 24px rgba(244,63,94,0.30)` : "none",
                }}>
                ${a}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{
              ...inputBase,
              display: "flex",
              border: preset === "custom" ? `1.5px solid ${ROSE}` : "1.5px solid rgba(0,0,0,0.12)",
            }}>
            <span className="text-base font-bold" style={{ color: "#9a8c7e" }}>$</span>
            <input
              type="number" min="1"
              value={preset === "custom" ? custom : ""}
              placeholder="Other amount"
              onFocus={() => setPreset("custom")}
              onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 600, color: "#0f0d0a" }}
              className="placeholder-[#9a8c7e]"
            />
          </div>

          {amount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm font-bold" style={{ color: ROSE }}>
              {freq === "monthly" ? `${fmt(amount)} / month` : `Donating ${fmt(amount)}`}
            </motion.p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.20em] mb-2" style={{ color: "#9a8c7e" }}>
            Your name <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{ ...inputBase }}
            className="placeholder-[#b0a89a]"
            onFocus={e => e.target.style.borderColor = ROSE}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
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
              background: termsChecked ? "#0f0d0a" : "transparent",
              borderColor: termsTouched && !termsChecked ? ROSE : "rgba(0,0,0,0.25)" }}>
            {termsChecked && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3 5.5L8 1" stroke="#f0ebe0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* Dual CTA buttons */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            onClick={handleDonate}
            disabled={submitting || !amount || amount <= 0}
            className="w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#0f0d0a", color: "#f0ebe0", fontSize: 14, letterSpacing: "0.09em" }}>
            {submitting
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Processing…</span>
              : <span className="flex items-center justify-center gap-2">
                  <Heart size={14} fill="#f0ebe0" stroke="#f0ebe0" />
                  {freq === "monthly" ? "Give Monthly" : "Donate Now"}{amount > 0 ? ` — ${fmt(amount)}` : ""}
                </span>
            }
          </button>
          {!submitting && amount > 0 && (
            <button
              onClick={handleDonate}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
              style={{ background: "transparent", color: "#4a3f30", border: `1.5px solid rgba(0,0,0,0.18)`, fontSize: 11, letterSpacing: "0.12em" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ROSE}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"}>
              Reserve Contribution
            </button>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(0,0,0,0.25)", letterSpacing: "0.12em" }}>
          <Lock size={9} /> Secure payment via Stripe
        </p>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DonatePage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const [event,     setEvent]     = useState(null);
  const [donConfig, setDonConfig] = useState({ amounts: [], message: "" });
  const [loading,   setLoading]   = useState(true);
  const [banner,    setBanner]    = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("donation");
    if (p) { setBanner(p); window.history.replaceState({}, "", window.location.pathname); }
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/pages/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.data?.event) setEvent(d.data.event); })
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

  const [line1, line2] = marketingLine(event);

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: "linear-gradient(160deg,#1a0533 0%,#0d0a1e 28%,#061428 60%,#020a18 100%)" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');`}</style>

      {/* Fixed gradient layers */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0,
        background: "radial-gradient(ellipse 65% 50% at 10% 8%, rgba(160,50,220,0.16) 0%,transparent 55%), radial-gradient(ellipse 55% 45% at 90% 85%, rgba(6,50,110,0.18) 0%,transparent 55%)" }} />

      {/* Cover image hero */}
      {event?.cover_image_url && (
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: "62vh", zIndex: 1 }}>
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.40) saturate(0.75)" }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: "58%", background: "linear-gradient(to bottom,transparent,#061428)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 0%,transparent 40%,rgba(6,20,40,0.55) 100%)" }} />
        </div>
      )}

      {/* Nav */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(14,5,28,0.90)", backdropFilter: "blur(22px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition"
            style={{ color: "rgba(255,255,255,0.40)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.40)"}>
            <ArrowLeft size={15} /> Back
          </button>
          <p className="text-[9px] font-black uppercase tracking-[0.30em]" style={{ color: "rgba(201,169,110,0.50)" }}>
            Support This Event
          </p>
          <div className="w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 space-y-6" style={{ paddingTop: event?.cover_image_url ? "min(38vh,300px)" : "3rem", paddingBottom: "5rem", zIndex: 2 }}>

        {/* Payment banner */}
        <AnimatePresence>
          {banner === "success" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.30)" }}>
              <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              <p className="text-sm font-bold text-white">Thank you — your donation was received!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Marketing headline */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 w-28 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-20 w-4/5 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-[9px] font-black uppercase tracking-[0.30em] mb-3" style={{ color: "rgba(201,169,110,0.60)" }}>
              ✦ Curated Events &amp; Ticket Première
            </p>
            <h1 className="leading-[0.95] mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900 }}>
              <span className="block" style={{ fontSize: "clamp(1.9rem,4vw,3.2rem)", color: "#f5f0e8", letterSpacing: "-0.02em" }}>{line1}</span>
              <span className="block italic" style={{ fontSize: "clamp(1.9rem,4vw,3.2rem)", color: "rgba(244,63,94,0.85)", letterSpacing: "-0.02em" }}>{line2}</span>
            </h1>
            {event && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-6" style={{ background: "rgba(201,169,110,0.45)" }} />
                <p className="text-sm font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.50)" }}>
                  {event.title}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {event?.starts_at_local && (
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.38)" }}>
                  <Clock size={13} style={{ color: "rgba(201,169,110,0.55)" }} />
                  {fmtDate(event.starts_at_local)}
                </span>
              )}
              {event?.venue_name && (
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.38)" }}>
                  <span style={{ color: "rgba(201,169,110,0.55)" }}>📍</span>
                  {event.venue_name}{event.city ? `, ${event.city}` : ""}
                </span>
              )}
            </div>
            <div className="mt-8 h-px" style={{ background: "linear-gradient(90deg,rgba(201,169,110,0.35),transparent 70%)" }} />
          </motion.div>
        )}

        {/* Donation card */}
        {!loading && event && (
          <DonationCard event={event} donConfig={donConfig} />
        )}

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[["🔒","Secure Payment"],["💝","Your Impact Matters"],["💳","Powered by Stripe"]].map(([icon, label]) => (
            <span key={label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(201,169,110,0.30)", letterSpacing: "0.12em" }}>
              {icon} {label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
