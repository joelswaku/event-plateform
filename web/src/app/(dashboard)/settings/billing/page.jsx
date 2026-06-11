"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, Zap, Star, Calendar, Users,
  Loader2, ExternalLink, AlertCircle, ArrowLeft,
} from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";
import PageHeader from "@/components/ui/page-header";
import { api } from "@/lib/api";

// Price IDs and amounts come entirely from the API (Stripe) — no client-side env vars needed.
// Set STRIPE_STARTER_PRICE_ID and STRIPE_PRO_PRICE_ID in api/.env and everything updates automatically.
function formatAmount(amount) {
  if (amount == null) return null;
  return Number.isInteger(amount) ? `$${amount}` : `$${Number(amount).toFixed(2)}`;
}

// Tier rank — higher = better plan. Used to decide if a card is "passed" or upgradeable.
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
const STARTER_FEATURES = ["5 events", "500 guests per event", "All themes & styles", "QR check-in scanner", "Ticket selling (2% platform fee)", "1 email reminder per guest", "Basic analytics", "Up to 3 team members"];
const PRO_FEATURES     = ["Unlimited events", "Unlimited guests", "All themes & styles", "Ticket selling (1.5% platform fee)", "Unlimited email reminders", "Advanced analytics", "Custom domain", "Unlimited team members", "Priority support"];

/* ─────────────────────────────────────────────────────────────────────
   MOBILE  (< sm)
───────────────────────────────────────────────────────────────────── */
function MobileBillingPage({
  plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
  usage, limits, checkoutLoading, portalLoading, error,
  handleCheckout, handlePortal,
  selectedPlan, setSelectedPlan, currentTier,
  starterPrice, proPrice,
}) {
  const router     = useRouter();
  const statusCfg  = STATUS_LABELS[subscriptionStatus] ?? null;
  const renewDate  = fmtDate(currentPeriodEnd);
  const eventsUsed = usage?.events ?? 0;
  const isPro      = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#07070f" }}>

      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-3"
        style={{
          paddingTop: "max(52px, env(safe-area-inset-top))",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "#14141f", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <p style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>Plans & Billing</p>
        <div style={{ width: 40 }} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 pb-12">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
            </div>
          )}

          {/* Current plan banner */}
          <div
            className="relative overflow-hidden rounded-[18px] p-4"
            style={{
              background: isSubscribed
                ? "linear-gradient(135deg, rgba(201,169,110,0.16) 0%, rgba(245,158,11,0.06) 100%)"
                : "#14141f",
              border: `1px solid ${isSubscribed ? "rgba(201,169,110,0.40)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[13px]"
                style={
                  isSubscribed
                    ? { background: "rgba(201,169,110,0.20)", border: "1px solid rgba(201,169,110,0.40)" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }
                }
              >
                {isSubscribed
                  ? <Star size={20} fill="#C9A96E" style={{ color: "#C9A96E" }} />
                  : <Zap size={20} style={{ color: "rgba(255,255,255,0.45)" }} />
                }
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
                    {isSubscribed ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : "Free Plan"}
                  </span>
                  {statusCfg && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                      style={{ background: `${statusCfg.color}1f`, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  )}
                  {!isSubscribed && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                      Free forever
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {isSubscribed && renewDate
                    ? `Renews ${renewDate}`
                    : isSubscribed
                    ? "Active subscription"
                    : "Upgrade for unlimited events & more"}
                </p>
              </div>
            </div>
          </div>

          {/* Usage row */}
          <div className="flex gap-2.5">
            <MobileUsageCard
              icon={<Calendar size={14} style={{ color: "#6366f1" }} />}
              label="Events"
              used={eventsUsed}
              limit={limits?.events ?? null}
            />
            <MobileUsageCard
              icon={<Users size={14} style={{ color: "#6366f1" }} />}
              label="Guests / event"
              used={0}
              limit={limits?.guests ?? null}
            />
          </div>

          {/* Section title */}
          <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8 }}>
            Choose a plan
          </p>

          {/* Plan cards */}
          <MobilePlanCard
            name="Free"
            price="$0"
            period="forever"
            features={FREE_FEATURES}
            isCurrent={!isSubscribed}
            isPassed={currentTier > tierOf("free")}
            accent="rgba(255,255,255,0.45)"
          />
          <MobilePlanCard
            name="Starter"
            price={starterPrice}
            period="/mo"
            badge="MOST POPULAR"
            features={STARTER_FEATURES}
            isCurrent={isSubscribed && plan === "starter"}
            isPassed={currentTier > tierOf("starter")}
            isPopular
            isSelected={selectedPlan === "starter"}
            onSelect={() => setSelectedPlan("starter")}
            accent="#6366f1"
            onUpgrade={() => handleCheckout(starterPriceId, "starter")}
            upgradeLoading={checkoutLoading === "starter"}
            upgradeDisabled={isPro || (isSubscribed && plan === "starter") || checkoutLoading !== null}
          />
          <MobilePlanCard
            name="Pro"
            price={proPrice}
            period="/mo"
            badge="BEST VALUE"
            features={PRO_FEATURES}
            isCurrent={isPro}
            isPassed={false}
            isSelected={selectedPlan === "pro"}
            onSelect={() => setSelectedPlan("pro")}
            accent="#C9A96E"
            onUpgrade={() => handleCheckout(proPriceId, "pro")}
            upgradeLoading={checkoutLoading === "pro"}
            upgradeDisabled={isPro || checkoutLoading !== null}
          />

          {/* Manage subscription */}
          {isSubscribed && (
            <div
              className="flex flex-col gap-3 rounded-[18px] p-4"
              style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Manage Subscription</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.5 }}>
                  Update payment method, view invoices, or cancel your plan.
                </p>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center justify-center gap-2 rounded-[13px] py-3.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  opacity: portalLoading ? 0.6 : 1,
                }}
              >
                {portalLoading
                  ? <Loader2 size={14} className="animate-spin" style={{ color: "rgba(255,255,255,0.45)" }} />
                  : <ExternalLink size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
                }
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                  {portalLoading ? "Opening…" : "Manage / Cancel on Stripe"}
                </span>
              </button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
                You'll be redirected to Stripe to manage payment or cancel.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MobileUsageCard({ icon, label, used, limit }) {
  const barPct = limit !== null
    ? Math.min(1, used / Math.max(limit, 1))
    : 0.15;

  return (
    <div
      className="flex flex-1 flex-col gap-2 rounded-[14px] p-3.5"
      style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="flex h-6.5 w-6.5 items-center justify-center rounded-lg"
          style={{ background: "rgba(99,102,241,0.15)" }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      </div>
      <p style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
        {used} / {limit ?? "∞"}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(barPct * 100)}%`, background: "#6366f1" }}
        />
      </div>
    </div>
  );
}

function MobilePlanCard({ name, price, period, badge, features, isCurrent, isPassed, isPopular, isSelected, onSelect, accent, onUpgrade, upgradeLoading, upgradeDisabled }) {
  const isSelectable = !isCurrent && !isPassed && !!onSelect;
  const borderColor = isSelected
    ? accent
    : isPopular
    ? `${accent}55`
    : "rgba(255,255,255,0.08)";
  const boxShadow = isSelected
    ? `0 0 0 2px ${accent}55, 0 0 28px ${accent}30`
    : undefined;

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className="relative flex flex-col gap-4 rounded-[18px] p-4 transition-all"
      style={{
        background: isSelected ? `${accent}0a` : "#0e0e16",
        border: `1px solid ${borderColor}`,
        boxShadow,
        marginTop: badge ? 12 : 0,
        cursor: isSelectable ? "pointer" : "default",
        opacity: isPassed ? 0.45 : 1,
      }}
    >
      {/* Selected check */}
      {isSelected && (
        <div
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: accent }}
        >
          <Check size={12} style={{ color: "#fff" }} />
        </div>
      )}

      {badge && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1"
          style={{ top: -12, background: "#6366f1" }}
        >
          <span style={{ fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between" style={{ paddingTop: badge ? 4 : 0 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1 }}>
            {name}
          </p>
          <div className="flex items-end gap-1 mt-1">
            <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: accent }}>{price}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{period}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {features.map((f) => {
          const text = typeof f === "string" ? f : f.text;
          const dim  = typeof f === "object" && f.dim;
          return (
            <div key={text} className="flex items-center gap-2.5">
              <Check size={13} style={{ color: dim ? "rgba(255,255,255,0.25)" : accent, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: dim ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)", flex: 1 }}>
                {text}
              </span>
            </div>
          );
        })}
      </div>

      {isCurrent ? (
        <div
          className="flex items-center justify-center rounded-[14px] py-3.5"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>Current plan</span>
        </div>
      ) : onUpgrade ? (
        <button
          onClick={onUpgrade}
          disabled={upgradeDisabled}
          className="relative flex h-12.5 items-center justify-center gap-2 overflow-hidden rounded-[14px]"
          style={{
            background: "linear-gradient(90deg, #C9A96E, #F59E0B)",
            opacity: upgradeDisabled ? 0.6 : 1,
          }}
        >
          {upgradeLoading
            ? <Loader2 size={16} className="animate-spin text-white" />
            : <>
                <Zap size={15} fill="white" style={{ color: "white" }} />
                <span style={{ fontSize: 15, fontWeight: 900, color: "white" }}>Upgrade to {name}</span>
              </>
          }
        </button>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────────────────────────── */
export default function BillingPage() {
  const {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    usage, limits, fetchSubscription, fetchPrices, openCustomerPortal, isLoading,
    prices,
  } = useSubscriptionStore();

  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [error,           setError]           = useState(null);
  const [selectedPlan,    setSelectedPlan]    = useState(null);

  // After normalizePlan() runs in the store, plan is always "free"|"starter"|"pro"
  // Keep the legacy aliases as fallback for any stale localStorage values
  const isPro = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const currentTier = tierOf(isPro ? "pro" : plan);

  useEffect(() => {
    fetchSubscription();
    fetchPrices(); // also load prices independently so display updates even before subscription loads
  }, [fetchSubscription, fetchPrices]);

  // Auto-select Pro plan if coming from planner
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      if (planParam === "pro") {
        setSelectedPlan("pro");
        // Scroll to Pro plan card and add highlight animation
        setTimeout(() => {
          const proCard = document.querySelector('[data-plan="pro"]');
          if (proCard) {
            proCard.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add pulse animation
            proCard.style.animation = "pulse 2s ease-in-out 3";
          }
        }, 300);
      }
    }
  }, []);

  const handleCheckout = async (priceId, tier) => {
    if (!priceId) { setError("Price not configured. Contact support."); return; }
    setCheckoutLoading(tier);
    setError(null);
    try {
      // Store tier so /billing/success knows which plan to activate optimistically
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

  // Price IDs from Stripe (via API) — no client-side env vars needed
  const starterPriceId = prices?.starter?.id   ?? null;
  const proPriceId     = prices?.pro?.id        ?? null;

  // Display prices — live from Stripe with fallback while loading
  const starterPrice = formatAmount(prices?.starter?.amount) ?? (prices ? "—" : "…");
  const proPrice     = formatAmount(prices?.pro?.amount)     ?? (prices ? "—" : "…");

  const sharedProps = {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    usage, limits, checkoutLoading, portalLoading, error,
    handleCheckout, handlePortal,
    starterPrice, proPrice,
    starterPriceId, proPriceId,
    selectedPlan, setSelectedPlan, currentTier,
    pricesLoaded: !!(prices?.starter || prices?.pro),
  };

  const statusCfg       = STATUS_LABELS[subscriptionStatus] ?? null;
  const renewDate       = fmtDate(currentPeriodEnd);
  const eventsUsed      = usage?.events ?? 0;
  const eventsLimit     = limits?.events ?? 1;
  const eventsUnlimited = isSubscribed && limits?.events === null;
  const guestsUnlimited = isSubscribed && limits?.guests === null;

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="sm:hidden">
        <MobileBillingPage {...sharedProps} />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:block space-y-8">
        <PageHeader
          eyebrow="Account"
          title="Plans & Billing"
          description="Manage your subscription, usage, and billing details."
        />

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            isSubscribed
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-700/40'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'
          }`}
        >
          {isSubscribed && (
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl bg-amber-200/30 dark:bg-amber-600/20"
              aria-hidden
            />
          )}
          <div className="relative flex flex-wrap items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isSubscribed
                  ? 'bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
                  : 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {isSubscribed
                ? <Star className="h-5 w-5 fill-white text-white" />
                : <Zap className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              }
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-lg font-bold capitalize text-gray-900 dark:text-white">
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
                  <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 dark:text-slate-400">
                    Free forever
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-slate-400">
                {isSubscribed && renewDate
                  ? `Renews on ${renewDate}`
                  : isSubscribed
                  ? "Active subscription"
                  : "Upgrade for unlimited events, templates & more"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <UsageCard
            Icon={Calendar}
            label="Events"
            used={eventsUsed}
            limit={eventsLimit}
            unlimited={eventsUnlimited}
            warningText={!eventsUnlimited && eventsUsed >= eventsLimit ? "Limit reached — upgrade to create more" : null}
          />
          <UsageCard
            Icon={Users}
            label="Guests per event"
            used={0}
            limit={limits?.guests ?? 50}
            unlimited={guestsUnlimited}
            emptyText={!guestsUnlimited ? "Upgrade for unlimited guests across all events" : null}
          />
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Choose a plan</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard
              name="Free"
              price="$0"
              period="forever"
              features={FREE_FEATURES}
              isCurrent={!isSubscribed}
              isPassed={currentTier > tierOf("free")}
              buttonLabel={!isSubscribed ? "Current plan" : "Free plan"}
              buttonDisabled={true}
            />
            <PlanCard
              name="Starter"
              price={starterPrice}
              period="/mo"
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
              onUpgrade={() => handleCheckout(starterPriceId, "starter")}
            />
            <div data-plan="pro">
              <PlanCard
                name="Pro"
                price={proPrice}
                period="/mo"
                badge="BEST VALUE"
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
                onUpgrade={() => handleCheckout(proPriceId, "pro")}
                isGold
              />
            </div>
          </div>
        </div>

        {isSubscribed && (
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Manage Subscription</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
              Update payment method, download invoices, or cancel your plan.
            </p>
            <button
              onClick={handlePortal}
              disabled={portalLoading || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              {portalLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ExternalLink className="h-4 w-4" />}
              {portalLoading ? "Opening…" : "Manage Subscription / Cancel"}
            </button>
            <p className="mt-2.5 text-xs text-gray-600 dark:text-slate-400">
              You'll be redirected to Stripe to manage payment or cancel.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Desktop sub-components ─────────────────────────────────────────── */

function UsageCard({ Icon, label, used, limit, unlimited, warningText, emptyText }) {
  const pct = unlimited ? 15 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500 bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {warningText && (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">{warningText}</p>
      )}
      {emptyText && !warningText && (
        <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

function PlanCard({ name, price, period, badge, features, isCurrent, isPassed, isPopular, isSelected, onSelect, buttonLabel, buttonDisabled, buttonLoading, onUpgrade, isGold }) {
  const isSelectable = !isCurrent && !isPassed && !!onSelect;

  // Dynamic Tailwind classes for light/dark mode support
  let containerClasses = "relative flex flex-col rounded-2xl border p-6 transition-all duration-200";

  if (isSelected && isGold) {
    containerClasses += " border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/20 shadow-xl shadow-amber-500/20";
  } else if (isSelected) {
    containerClasses += " border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 shadow-xl shadow-indigo-500/20";
  } else if (isPopular || isGold) {
    containerClasses += isGold
      ? " border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-900 shadow-lg shadow-amber-500/10"
      : " border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-slate-900 shadow-lg shadow-indigo-500/10";
  } else {
    containerClasses += " border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900";
  }

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className={containerClasses}
      style={{
        cursor:  isSelectable ? "pointer" : "default",
        opacity: isPassed ? 0.45 : 1,
        marginTop: badge ? "14px" : undefined,
      }}
    >
      {/* Selected check */}
      {isSelected && !isCurrent && (
        <div
          className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full ${
            isGold ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
        >
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {badge && (
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap ${
            isGold ? 'bg-linear-to-r from-amber-400 to-orange-500' : 'bg-indigo-500'
          }`}
        >
          {badge}
        </div>
      )}

      {/* Name + price */}
      <div className="mb-5">
        <p className={`text-xs font-bold uppercase tracking-widest ${isGold ? 'text-amber-600 dark:text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
          {name}
        </p>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-black text-gray-900 dark:text-white">{price}</span>
          <span className="mb-1.5 text-sm text-gray-600 dark:text-slate-400">{period}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-6 flex flex-col gap-2.5">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isGold ? 'text-amber-600 dark:text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
        disabled={buttonDisabled || isCurrent}
        className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.97] disabled:cursor-default disabled:opacity-60 ${
          isCurrent
            ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500'
            : isGold
            ? 'bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40'
            : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
        }`}
      >
        {buttonLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  );
}
