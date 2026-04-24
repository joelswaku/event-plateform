"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscriptionStore } from "@/store/subscription.store";
import {
  X, Zap, Check, Lock, Sparkles, ArrowRight,
  CalendarDays, LayoutTemplate, Users, Globe,
  BarChart2, Palette, Ticket, Image,
} from "lucide-react";

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "";

// ── Plan comparison data ──────────────────────────────────────────────────────
const FREE_FEATURES = [
  { icon: CalendarDays,   text: "1 event" },
  { icon: LayoutTemplate, text: "3 Classic templates (free style)" },
  { icon: Users,          text: "Up to 50 guests" },
  { icon: Zap,            text: "Basic page builder" },
];

const PRO_FEATURES = [
  { icon: CalendarDays,   text: "Unlimited events",              hot: false },
  { icon: LayoutTemplate, text: "All 18 premium templates",      hot: true  },
  { icon: Users,          text: "Unlimited guests & RSVPs",      hot: false },
  { icon: Globe,          text: "Custom domain support",         hot: false },
  { icon: BarChart2,      text: "Analytics & engagement stats",  hot: false },
  { icon: Palette,        text: "All 6 style themes",            hot: true  },
  { icon: Image,          text: "Galleries, countdown & more",   hot: false },
  { icon: Ticket,         text: "Ticketing & donations",         hot: false },
];

// Context-aware headline + subtext based on what triggered the modal
const TRIGGER_COPY = {
  events: {
    badge:    "Event Limit Reached",
    headline: "You've used your 1 free event.",
    sub:      "Upgrade to Premium and create unlimited events — no caps, ever.",
  },
  templates: {
    badge:    "Premium Template",
    headline: "This template is Premium.",
    sub:      "Unlock all 18 templates and every style theme with one upgrade.",
  },
  feature: {
    badge:    "Premium Feature",
    headline: "This feature requires Premium.",
    sub:      "Upgrade to access the full toolkit and take your events further.",
  },
  default: {
    badge:    "Go Premium",
    headline: "Build events without limits.",
    sub:      "Everything you need to create stunning, professional event pages.",
  },
};

function getTriggerCopy(feature) {
  if (!feature) return TRIGGER_COPY.default;
  const key = feature.toLowerCase();
  if (key.includes("event"))    return TRIGGER_COPY.events;
  if (key.includes("template")) return TRIGGER_COPY.templates;
  return { ...TRIGGER_COPY.feature, badge: feature };
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

export default function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalFeature, closeUpgradeModal, createCheckoutSession, isLoading } =
    useSubscriptionStore();

  const copy = getTriggerCopy(upgradeModalFeature);

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
            className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Ambient glow ─────────────────────────────────────────────── */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "rgba(245,158,11,0.18)" }}
              aria-hidden
            />

            {/* ── Close ────────────────────────────────────────────────────── */}
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

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="px-8 pb-0 pt-8 text-center">
              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#F59E0B" }}>
                <Sparkles size={10} />
                {copy.badge}
              </div>

              <h2 className="text-[1.6rem] font-extrabold leading-tight text-white">
                {copy.headline}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {copy.sub}
              </p>
            </div>

            {/* ── Plan comparison ───────────────────────────────────────────── */}
            <div className="mt-7 grid grid-cols-2 gap-3 px-8">
              {/* Free column */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Free
                </p>
                <ul className="space-y-2.5">
                  {FREE_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <Icon size={12} className="mt-0.5 shrink-0 opacity-40" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium column */}
              <div className="relative rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
                {/* "Most popular" label */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <div className="rounded-b-lg px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.15em]"
                    style={{ background: "#F59E0B", color: "#000" }}>
                    Premium
                  </div>
                </div>
                <p className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#F59E0B" }}>
                  Everything
                </p>
                <ul className="space-y-2.5">
                  {PRO_FEATURES.map(({ icon: Icon, text, hot }) => (
                    <li key={text} className="flex items-start gap-2 text-[12px]" style={{ color: hot ? "#fff" : "rgba(255,255,255,0.65)" }}>
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
                      {text}
                      {hot && (
                        <span className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase"
                          style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                          New
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <div className="mt-5 px-8">
              <div className="flex items-center justify-between rounded-2xl px-5 py-3.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Premium plan</p>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">$12</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>/month</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <div className="px-8 pb-8 pt-4">
              <button
                onClick={() => createCheckoutSession(PRICE_ID)}
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
                  color: "#000",
                  boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.55)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.35)")}
              >
                <Zap size={15} fill="currentColor" />
                {isLoading ? "Redirecting to checkout…" : "Upgrade to Premium"}
                {!isLoading && (
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>

              <p className="mt-3 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                Secure checkout · Powered by Stripe · No hidden fees
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
