"use client";

import { useState, useEffect } from "react";
import { X, Check, Zap, Star, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";
import { api } from "@/lib/api";

const STARTER_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ||
  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
const PRO_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

const TIER_ORDER = { free: 0, starter: 1, pro: 2, premium: 2, enterprise: 3 };
function tierOf(name) { return TIER_ORDER[name?.toLowerCase()] ?? 0; }

function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch { return null; }
}

const STATUS_LABELS = {
  active:   { label: "Active",   color: "#10b981" },
  trialing: { label: "Trial",    color: "#6366f1" },
  past_due: { label: "Past due", color: "#f59e0b" },
  canceled: { label: "Canceled", color: "#ef4444" },
};

const FREE_FEATURES    = ["1 event", "50 guests per event", "Classic theme only", "QR check-in scanner", "RSVP page builder", "Email support"];
const STARTER_FEATURES = ["5 events", "500 guests per event", "All themes & styles", "QR check-in scanner", "Ticket selling (2% fee)", "1 email reminder / guest", "Basic analytics", "Up to 3 team members"];
const PRO_FEATURES     = ["Unlimited events", "Unlimited guests", "All themes & styles", "Ticket selling (1.5% fee)", "Unlimited email reminders", "Advanced analytics", "Custom domain", "Unlimited team members", "Priority support"];

export default function BillingModal({ open, onClose }) {
  const {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    fetchSubscription, openCustomerPortal, isLoading,
  } = useSubscriptionStore();

  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [error,           setError]           = useState(null);
  const [selectedPlan,    setSelectedPlan]    = useState(null);

  const isPro      = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const currentTier = tierOf(isPro ? "pro" : plan);

  useEffect(() => {
    if (open) {
      fetchSubscription();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, fetchSubscription]);

  const handleCheckout = async (priceId, tier) => {
    if (!priceId) { setError("Price not configured. Contact support."); return; }
    setCheckoutLoading(tier);
    setError(null);
    try {
      if (typeof window !== "undefined") sessionStorage.setItem("checkout_tier", tier);
      const res = await api.post("/subscription/checkout", {
        priceId,
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${window.location.origin}/settings/billing`,
      });
      const { url } = res.data?.data ?? {};
      if (url) window.location.href = url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      if (typeof window !== "undefined") sessionStorage.removeItem("checkout_tier");
      setError(err?.response?.data?.message || "Failed to start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    await openCustomerPortal();
    setPortalLoading(false);
  };

  if (!open) return null;

  const statusCfg = STATUS_LABELS[subscriptionStatus] ?? null;
  const renewDate = fmtDate(currentPeriodEnd);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[88vh] rounded-2xl border border-border bg-(--bg-surface) shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-(--bg-surface)">
          <div>
            <p className="text-lg font-bold text-(--text-primary)">Plans & Billing</p>
            <p className="text-sm text-(--text-muted)">Manage your subscription and plan</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Current plan banner */}
          <div
            className="relative overflow-hidden rounded-2xl border p-5"
            style={
              isSubscribed
                ? { background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(245,158,11,0.06) 100%)", borderColor: "rgba(201,169,110,0.35)" }
                : { background: "var(--bg-elevated)", borderColor: "var(--border)" }
            }
          >
            {isSubscribed && (
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
                style={{ background: "rgba(201,169,110,0.18)" }}
              />
            )}
            <div className="relative flex flex-wrap items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={
                  isSubscribed
                    ? { background: "linear-gradient(135deg,#c9a96e,#f59e0b)", boxShadow: "0 4px 16px rgba(201,169,110,0.35)" }
                    : { background: "var(--bg-surface)", border: "1px solid var(--border)" }
                }
              >
                {isSubscribed
                  ? <Star className="h-5 w-5 fill-white text-white" />
                  : <Zap className="h-5 w-5 text-(--text-muted)" />
                }
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-lg font-bold capitalize text-(--text-primary)">
                    {isSubscribed ? plan : "Free"} Plan
                  </p>
                  {statusCfg && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: `${statusCfg.color}22`, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  )}
                  {!isSubscribed && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-(--text-muted) dark:bg-white/8">
                      Free forever
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-(--text-muted)">
                  {isSubscribed && renewDate
                    ? `Renews on ${renewDate}`
                    : isSubscribed
                    ? "Active subscription"
                    : "Upgrade for unlimited events, templates & more"}
                </p>
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div>
            <h2 className="mb-4 text-base font-bold text-(--text-primary)">Choose a plan</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <ModalPlanCard
                name="Free"
                price="$0"
                period="forever"
                features={FREE_FEATURES}
                isCurrent={!isSubscribed}
                isPassed={currentTier > tierOf("free")}
                buttonLabel="Current plan"
                buttonDisabled
              />
              <ModalPlanCard
                name="Starter"
                price="$19"
                period="/ month"
                badge="MOST POPULAR"
                features={STARTER_FEATURES}
                isCurrent={isSubscribed && plan === "starter"}
                isPassed={currentTier > tierOf("starter")}
                isPopular
                isSelected={selectedPlan === "starter"}
                onSelect={() => setSelectedPlan("starter")}
                buttonLabel={
                  isSubscribed && plan === "starter" ? "Current plan"
                  : checkoutLoading === "starter" ? "Redirecting…"
                  : isSubscribed ? "Switch to Starter"
                  : "Upgrade to Starter"
                }
                buttonDisabled={isPro || (isSubscribed && plan === "starter") || checkoutLoading !== null}
                buttonLoading={checkoutLoading === "starter"}
                onUpgrade={() => handleCheckout(STARTER_PRICE_ID, "starter")}
              />
              <ModalPlanCard
                name="Pro"
                price="$49"
                period="/ month"
                features={PRO_FEATURES}
                isCurrent={isPro}
                isPassed={false}
                isSelected={selectedPlan === "pro"}
                onSelect={() => setSelectedPlan("pro")}
                buttonLabel={
                  isPro ? "Current plan"
                  : checkoutLoading === "pro" ? "Redirecting…"
                  : "Upgrade to Pro"
                }
                buttonDisabled={isPro || checkoutLoading !== null}
                buttonLoading={checkoutLoading === "pro"}
                onUpgrade={() => handleCheckout(PRO_PRICE_ID, "pro")}
              />
            </div>
          </div>

          {/* Manage subscription */}
          {isSubscribed && (
            <div className="rounded-2xl border border-border bg-(--bg-elevated) p-5">
              <h3 className="mb-0.5 text-sm font-bold text-(--text-primary)">Manage Subscription</h3>
              <p className="mb-4 text-sm text-(--text-muted)">
                Update payment method, download invoices, or cancel your plan.
              </p>
              <button
                onClick={handlePortal}
                disabled={portalLoading || isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-(--bg-surface) px-4 py-2.5 text-sm font-semibold text-(--text-primary) transition hover:bg-(--bg-base) disabled:opacity-60"
              >
                {portalLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ExternalLink className="h-4 w-4" />
                }
                {portalLoading ? "Opening…" : "Manage Subscription / Cancel"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalPlanCard({
  name, price, period, badge, features,
  isCurrent, isPassed, isPopular, isSelected, onSelect,
  buttonLabel, buttonDisabled, buttonLoading, onUpgrade,
}) {
  const isSelectable = !isCurrent && !isPassed && !!onSelect;

  let borderColor, boxShadow, background;
  if (isSelected) {
    borderColor = "var(--accent)";
    boxShadow   = "0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 28px color-mix(in srgb, var(--accent) 18%, transparent)";
    background  = "color-mix(in srgb, var(--accent) 5%, var(--bg-surface))";
  } else if (isCurrent) {
    borderColor = "var(--accent)";
    boxShadow   = "0 0 24px color-mix(in srgb, var(--accent) 18%, transparent)";
    background  = "var(--bg-surface)";
  } else if (isPopular) {
    borderColor = "var(--accent)";
    background  = "var(--bg-surface)";
  } else {
    borderColor = "var(--border)";
    background  = "var(--bg-surface)";
  }

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className="relative flex flex-col rounded-2xl border p-5 transition-all duration-200"
      style={{
        borderColor, boxShadow, background,
        cursor: isSelectable ? "pointer" : "default",
        opacity: isPassed ? 0.45 : 1,
      }}
    >
      {badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white"
          style={{ background: "var(--accent)" }}
        >
          {badge}
        </div>
      )}
      {/* Current badge or selected check */}
      {isCurrent && (
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
        >
          <Check className="h-2.5 w-2.5" />
          Current
        </div>
      )}
      {isSelected && !isCurrent && (
        <div
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "var(--accent)" }}
        >
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="mb-4 pt-1">
        <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">{name}</p>
        <div className="mt-1.5 flex items-end gap-1">
          <span className="text-3xl font-black text-(--text-primary)">{price}</span>
          <span className="mb-1 text-sm text-(--text-muted)">{period}</span>
        </div>
      </div>
      <ul className="mb-5 flex flex-1 flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-(--text-secondary)">
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
        disabled={buttonDisabled || isCurrent}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-default"
        style={
          isCurrent
            ? { background: "var(--bg-elevated)", color: "var(--text-muted)" }
            : { background: "var(--accent)", color: "#fff" }
        }
      >
        {buttonLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  );
}
