"use client";

/**
 * ProGate — contextual upgrade gates for premium features.
 *
 * Usage modes:
 *
 * 1. OVERLAY  — blurs children, shows a lock badge on top (default)
 *    <ProGate feature="Custom Domain"><YourComponent /></ProGate>
 *
 * 2. BANNER   — full-width inline banner strip above/below
 *    <ProGate mode="banner" feature="Analytics" />
 *
 * 3. TOOLTIP  — wraps a button, shows tooltip on hover
 *    <ProGate mode="tooltip" feature="Ticketing"><button>Tickets</button></ProGate>
 *
 * 4. REPLACE  — replaces children with a locked placeholder card
 *    <ProGate mode="replace" feature="Gallery" label="Unlock Gallery" />
 *
 * All modes: if user isPremium the gate is transparent and children render normally.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

// ── Shared upgrade trigger ────────────────────────────────────────────────────
function useGate(feature) {
  const { isSubscribed, plan, openUpgradeModal } = useSubscriptionStore();
  const isPremium = isSubscribed && plan === "premium";
  const trigger   = () => openUpgradeModal(feature);
  return { isPremium, trigger };
}

// ── Mode: OVERLAY (default) ───────────────────────────────────────────────────
function OverlayGate({ children, feature, label }) {
  const { isPremium, trigger } = useGate(feature);
  if (isPremium) return <>{children}</>;

  return (
    <div className="group relative cursor-pointer" onClick={trigger}>
      {/* Blurred content */}
      <div className="pointer-events-none select-none opacity-40 blur-[2px] transition-all duration-300 group-hover:blur-[3px]">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 text-center shadow-xl"
          style={{ background: "rgba(15,15,18,0.88)", border: "1px solid rgba(245,158,11,0.25)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <Lock size={15} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white">
              {label || "Premium Feature"}
            </p>
            {feature && (
              <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {feature}
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); trigger(); }}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all active:scale-95"
            style={{ background: "#F59E0B", color: "#000" }}
          >
            <Zap size={10} fill="currentColor" />
            Upgrade
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Mode: BANNER ──────────────────────────────────────────────────────────────
function BannerGate({ feature, description }) {
  const { isPremium, trigger } = useGate(feature);
  const [dismissed, setDismissed] = useState(false);

  if (isPremium || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(249,115,22,0.08) 100%)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(245,158,11,0.15)" }}>
            <Sparkles size={14} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-gray-900">
              {feature ? `${feature} requires Premium` : "This feature requires Premium"}
            </p>
            {description && (
              <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={trigger}
            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[11px] font-bold transition-all active:scale-95"
            style={{ background: "#F59E0B", color: "#000" }}
          >
            <Zap size={11} fill="currentColor" />
            Upgrade
            <ArrowRight size={11} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Mode: TOOLTIP ─────────────────────────────────────────────────────────────
function TooltipGate({ children, feature }) {
  const { isPremium, trigger } = useGate(feature);
  const [show, setShow] = useState(false);

  if (isPremium) return <>{children}</>;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Child rendered but click intercepted */}
      <div
        className="cursor-not-allowed opacity-60"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); trigger(); }}
        style={{ pointerEvents: "all" }}
      >
        {children}
      </div>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl px-3.5 py-2.5 shadow-xl"
            style={{ background: "#0f0f12", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <div className="flex items-center gap-2">
              <Lock size={11} style={{ color: "#F59E0B" }} />
              <span className="text-[11px] font-bold text-white">
                {feature || "Premium"} · <span
                  onClick={(e) => { e.stopPropagation(); trigger(); }}
                  className="cursor-pointer underline"
                  style={{ color: "#F59E0B" }}
                >
                  Upgrade
                </span>
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45"
              style={{ background: "#0f0f12", border: "0 solid transparent", borderRight: "1px solid rgba(245,158,11,0.25)", borderBottom: "1px solid rgba(245,158,11,0.25)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mode: REPLACE ─────────────────────────────────────────────────────────────
function ReplaceGate({ feature, label, description, minHeight = 160 }) {
  const { isPremium, trigger } = useGate(feature);
  if (isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={trigger}
      className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl text-center transition-all duration-200"
      style={{
        minHeight,
        background: "rgba(245,158,11,0.04)",
        border: "1.5px dashed rgba(245,158,11,0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(245,158,11,0.07)";
        e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(245,158,11,0.04)";
        e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)";
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Lock size={16} style={{ color: "#F59E0B" }} />
      </div>
      <div>
        <p className="text-[12px] font-bold text-gray-800">{label || "Premium Feature"}</p>
        {description && (
          <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>
        )}
      </div>
      <button
        className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
        style={{ background: "#F59E0B", color: "#000" }}
      >
        <Sparkles size={10} />
        Upgrade to unlock
      </button>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ProGate({
  children,
  mode       = "overlay",  // "overlay" | "banner" | "tooltip" | "replace"
  feature    = null,       // human-readable feature name shown in copy
  label      = null,       // short label (replace / overlay modes)
  description = null,      // longer description (banner / replace modes)
  minHeight  = 160,        // replace mode card height
}) {
  if (mode === "banner")  return <BannerGate   feature={feature} description={description} />;
  if (mode === "tooltip") return <TooltipGate  feature={feature}>{children}</TooltipGate>;
  if (mode === "replace") return <ReplaceGate  feature={feature} label={label} description={description} minHeight={minHeight} />;
  return                         <OverlayGate  feature={feature} label={label}>{children}</OverlayGate>;
}
