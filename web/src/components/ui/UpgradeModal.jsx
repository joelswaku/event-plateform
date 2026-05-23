"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscriptionStore } from "@/store/subscription.store";
import {
  X, Zap, Check, Sparkles, ArrowRight,
  CalendarDays, Users, Palette, Ticket,
  BarChart2, Globe, Bell, QrCode,
} from "lucide-react";

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "";
const PRO_PRICE_ID     = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID     || "";

// ── Plan data ─────────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  { icon: CalendarDays, text: "1 event"              },
  { icon: Users,        text: "50 guests"            },
  { icon: Palette,      text: "Classic theme only"   },
  { icon: Ticket,       text: "No ticket selling"    },
];

const STARTER_FEATURES = [
  { icon: CalendarDays, text: "5 events"             },
  { icon: Users,        text: "500 guests"           },
  { icon: Palette,      text: "All themes & styles"  },
  { icon: Ticket,       text: "Tickets (2% fee)"     },
  { icon: QrCode,       text: "QR scanner"           },
  { icon: Bell,         text: "1 reminder / guest"   },
  { icon: BarChart2,    text: "Basic analytics"      },
];

const PRO_FEATURES = [
  { icon: CalendarDays, text: "Unlimited events"     },
  { icon: Users,        text: "Unlimited guests"     },
  { icon: Ticket,       text: "Tickets (1.5% fee)"   },
  { icon: Bell,         text: "∞ reminders"          },
  { icon: Globe,        text: "Custom domain"        },
  { icon: BarChart2,    text: "Adv. analytics"       },
];

// ── Context-aware copy (plan-aware) ──────────────────────────────────────────
function getTriggerCopy(feature, plan) {
  const isStarter = plan === "starter";

  const COPY = {
    events: isStarter
      ? { badge: "Starter Limit Reached", headline: "You've used all 5 Starter events.", sub: "Upgrade to Pro for unlimited events — no caps, ever." }
      : { badge: "Event Limit Reached",   headline: "You've used your 1 free event.",    sub: "Upgrade to Starter for 5 events, or go Pro for unlimited." },
    guests: isStarter
      ? { badge: "Starter Limit Reached", headline: "500-guest Starter cap reached.",    sub: "Upgrade to Pro for unlimited guests per event." }
      : { badge: "Guest Limit Reached",   headline: "You've hit the free guest cap.",    sub: "Upgrade to Starter for 500 guests, or Pro for unlimited." },
    templates: { badge: "Style Locked",      headline: "This style requires Starter or above.", sub: "Unlock all themes and every style with one upgrade." },
    tickets:   { badge: "Ticketing Locked",  headline: "Ticket selling requires Starter.",      sub: "Sell tickets and collect payments — Starter gets you a 2% fee." },
    reminders: isStarter
      ? { badge: "Reminder Limit Reached", headline: "You've sent your 1 Starter reminder.",  sub: "Upgrade to Pro for unlimited email reminders per guest." }
      : { badge: "Reminders Locked",       headline: "Email reminders require Starter.",       sub: "Send guest reminders — Starter: 1 per guest, Pro: unlimited." },
    feature: isStarter
      ? { badge: "Pro Feature",    headline: "This feature requires Pro.", sub: "Upgrade to Pro to unlock every feature without limits." }
      : { badge: "Feature Locked", headline: "This feature requires a paid plan.", sub: "Upgrade to Starter or Pro to unlock the full toolkit." },
    default: isStarter
      ? { badge: "Upgrade to Pro",    headline: "Ready for no limits?",           sub: "Pro gives you unlimited events, guests, and every feature." }
      : { badge: "Upgrade Your Plan", headline: "Build events without limits.",   sub: "Starter at $19/mo, or go unlimited with Pro at $49/mo." },
  };

  if (!feature) return COPY.default;
  const key = feature.toLowerCase();
  if (key.includes("event"))                                           return COPY.events;
  if (key.includes("guest"))                                           return COPY.guests;
  if (key.includes("template") || key.includes("style") || key.includes("theme")) return COPY.templates;
  if (key.includes("ticket"))                                          return COPY.tickets;
  if (key.includes("reminder"))                                        return COPY.reminders;
  return { ...COPY.feature, badge: feature };
}

// ── Animation variants ────────────────────────────────────────────────────────
const backdrop = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};
const panel = {
  hidden:  { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: "spring", stiffness: 380, damping: 32 } },
  exit:    { opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.18 } },
};

// ── Plan column ───────────────────────────────────────────────────────────────
function PlanCol({ label, price, period, features, highlight, badge, accentColor, dimmed, selected, onClick }) {
  const selectedBorder = label === "Starter"
    ? "2px solid #8b5cf6"
    : label === "Pro"
    ? "2px solid #c9a96e"
    : undefined;

  const selectedShadow = label === "Starter"
    ? "0 0 20px rgba(139,92,246,0.3)"
    : label === "Pro"
    ? "0 0 20px rgba(201,169,110,0.3)"
    : undefined;

  return (
    <div
      className="relative flex flex-col rounded-2xl p-4"
      onClick={onClick}
      style={{
        background: highlight
          ? "rgba(99,102,241,0.10)"
          : dimmed
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.05)",
        border: selected && selectedBorder
          ? selectedBorder
          : `1px solid ${highlight ? "rgba(99,102,241,0.40)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: selected && selectedShadow ? selectedShadow : undefined,
        transform: selected && label === "Pro" ? "scale(1.02)" : undefined,
        transition: "all 0.2s ease",
        opacity: dimmed ? 0.7 : 1,
        cursor: dimmed ? "default" : "pointer",
      }}
    >
      {badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <div
            className="rounded-b-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap"
            style={{ background: accentColor, color: "#fff" }}
          >
            {badge}
          </div>
        </div>
      )}

      <p
        className="mb-1 mt-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: highlight ? accentColor : "rgba(255,255,255,0.35)" }}
      >
        {label}
      </p>

      <div className="mb-3 flex items-baseline gap-0.5">
        <span className="text-xl font-black text-white">{price}</span>
        {period && (
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>
            {period}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {features.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-start gap-1.5 text-[11px] leading-snug"
            style={{ color: dimmed ? "rgba(255,255,255,0.30)" : highlight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}
          >
            {dimmed
              ? <Icon size={11} className="mt-0.5 shrink-0 opacity-30" />
              : <Check size={11} className="mt-0.5 shrink-0" style={{ color: highlight ? accentColor : "rgba(255,255,255,0.4)" }} />
            }
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalFeature, closeUpgradeModal, createCheckoutSession, isLoading, plan } =
    useSubscriptionStore();

  const isStarter = plan === "starter";
  const [loadingTier, setLoadingTier] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(isStarter ? "pro" : "starter");

  // Re-derive the default selection each time the modal opens so stale
  // initial state (captured before the store hydrates from localStorage) doesn't persist.
  useEffect(() => {
    if (upgradeModalOpen) setSelectedPlan(isStarter ? "pro" : "starter");
  }, [upgradeModalOpen, isStarter]);

  const copy = getTriggerCopy(upgradeModalFeature, plan);

  const handleCheckout = async (priceId, tier) => {
    if (!priceId) return;
    setLoadingTier(tier);
    await createCheckoutSession(priceId);
    setLoadingTier(null);
  };

  return (
    <AnimatePresence>
      {upgradeModalOpen && (
        <motion.div
          key="upgrade-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
          onClick={closeUpgradeModal}
        >
          <motion.div
            key="upgrade-panel"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "rgba(99,102,241,0.20)" }}
              aria-hidden
            />

            {/* Close */}
            <button
              onClick={closeUpgradeModal}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              aria-label="Close"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Header */}
            <div className="px-7 pb-0 pt-7 text-center">
              <div
                className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}
              >
                <Sparkles size={10} />
                {copy.badge}
              </div>
              <h2 className="text-[1.4rem] font-extrabold leading-tight text-white">
                {copy.headline}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
                {copy.sub}
              </p>
            </div>

            {/* Plan columns — 2-col for starter users, 3-col for free */}
            <div className={`mt-5 grid gap-2.5 px-6 ${isStarter ? "grid-cols-2" : "grid-cols-3"}`}>
              {!isStarter && (
                <PlanCol
                  label="Free"
                  price="$0"
                  period=""
                  features={FREE_FEATURES}
                  dimmed
                />
              )}
              <PlanCol
                label="Starter"
                price="$19"
                period="/mo"
                features={STARTER_FEATURES}
                highlight={!isStarter}
                badge={isStarter ? "Current Plan" : "Most Popular"}
                accentColor="#6366f1"
                dimmed={isStarter}
                selected={!isStarter && selectedPlan === "starter"}
                onClick={!isStarter ? () => setSelectedPlan("starter") : undefined}
              />
              <PlanCol
                label="Pro"
                price="$49"
                period="/mo"
                features={PRO_FEATURES}
                highlight={isStarter}
                badge={isStarter ? "Recommended" : undefined}
                accentColor="#f59e0b"
                selected={isStarter || selectedPlan === "pro"}
                onClick={() => setSelectedPlan("pro")}
              />
            </div>

            {/* Cancel-anytime badge */}
            <div className="mt-4 flex justify-center px-6">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Cancel anytime · No hidden fees
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 px-6 pb-7 pt-4">
              {/* Starter — only shown for free users */}
              {!isStarter && (
                <button
                  onClick={() => handleCheckout(STARTER_PRICE_ID, "starter")}
                  disabled={isLoading || loadingTier !== null}
                  className="group flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-black uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                    color: "#fff",
                    boxShadow: "0 6px 24px rgba(99,102,241,0.40)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.60)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.40)")}
                >
                  <Zap size={14} fill="currentColor" />
                  {loadingTier === "starter" ? "Redirecting…" : "Upgrade to Starter"}
                  {loadingTier !== "starter" && (
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                </button>
              )}

              {/* Pro — primary for starter users, secondary for free users */}
              <button
                onClick={() => handleCheckout(PRO_PRICE_ID, "pro")}
                disabled={isLoading || loadingTier !== null}
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-black uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                style={isStarter ? {
                  background: "linear-gradient(135deg, #c9a96e 0%, #f59e0b 100%)",
                  color: "#000",
                  boxShadow: "0 6px 24px rgba(201,169,110,0.45)",
                } : {
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.30)",
                  color: "#f59e0b",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Zap size={14} fill="currentColor" />
                {loadingTier === "pro" ? "Redirecting…" : "Upgrade to Pro"}
                {loadingTier !== "pro" && isStarter && (
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>
            </div>

            <p className="pb-5 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
              Secure checkout · Powered by Stripe
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
