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

const STARTER_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ||
  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

const PRO_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

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
            price="$19"
            period="/ month"
            badge="MOST POPULAR"
            features={STARTER_FEATURES}
            isCurrent={isSubscribed && plan === "starter"}
            isPassed={currentTier > tierOf("starter")}
            isPopular
            isSelected={selectedPlan === "starter"}
            onSelect={() => setSelectedPlan("starter")}
            accent="#6366f1"
            onUpgrade={() => handleCheckout(STARTER_PRICE_ID, "starter")}
            upgradeLoading={checkoutLoading === "starter"}
            upgradeDisabled={isPro || (isSubscribed && plan === "starter") || checkoutLoading !== null}
          />
          <MobilePlanCard
            name="Pro"
            price="$49"
            period="/ month"
            features={PRO_FEATURES}
            isCurrent={isPro}
            isPassed={false}
            isSelected={selectedPlan === "pro"}
            onSelect={() => setSelectedPlan("pro")}
            accent="#C9A96E"
            onUpgrade={() => handleCheckout(PRO_PRICE_ID, "pro")}
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
    usage, limits, fetchSubscription, openCustomerPortal, isLoading,
  } = useSubscriptionStore();

  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [error,           setError]           = useState(null);
  const [selectedPlan,    setSelectedPlan]    = useState(null);

  // After normalizePlan() runs in the store, plan is always "free"|"starter"|"pro"
  // Keep the legacy aliases as fallback for any stale localStorage values
  const isPro = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const currentTier = tierOf(isPro ? "pro" : plan);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

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

  const sharedProps = {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    usage, limits, checkoutLoading, portalLoading, error,
    handleCheckout, handlePortal,
    selectedPlan, setSelectedPlan, currentTier,
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
          className="relative overflow-hidden rounded-2xl border p-6"
          style={
            isSubscribed
              ? { background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(245,158,11,0.06) 100%)", borderColor: "rgba(201,169,110,0.35)" }
              : { background: "var(--bg-surface)", borderColor: "var(--border)" }
          }
        >
          {isSubscribed && (
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "rgba(201,169,110,0.18)" }}
              aria-hidden
            />
          )}
          <div className="relative flex flex-wrap items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={
                isSubscribed
                  ? { background: "linear-gradient(135deg,#c9a96e,#f59e0b)", boxShadow: "0 4px 16px rgba(201,169,110,0.35)" }
                  : { background: "var(--bg-elevated)", border: "1px solid var(--border)" }
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
          <h2 className="mb-4 text-base font-bold text-(--text-primary)">Choose a plan</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard
              name="Free"
              price="$0"
              period="forever"
              features={FREE_FEATURES}
              isCurrent={!isSubscribed}
              isPassed={currentTier > tierOf("free")}
              buttonLabel="Current plan"
              buttonDisabled
            />
            <PlanCard
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
            <PlanCard
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

        {isSubscribed && (
          <div className="rounded-2xl border border-border bg-(--bg-surface) p-6">
            <h2 className="mb-1 text-base font-bold text-(--text-primary)">Manage Subscription</h2>
            <p className="mb-4 text-sm text-(--text-muted)">
              Update payment method, download invoices, or cancel your plan.
            </p>
            <button
              onClick={handlePortal}
              disabled={portalLoading || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-(--bg-elevated) px-4 py-2.5 text-sm font-semibold text-(--text-primary) transition hover:bg-(--bg-base) disabled:opacity-60"
            >
              {portalLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ExternalLink className="h-4 w-4" />}
              {portalLoading ? "Opening…" : "Manage Subscription / Cancel"}
            </button>
            <p className="mt-2.5 text-xs text-(--text-muted)">
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
    <div className="rounded-2xl border border-border bg-(--bg-surface) p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold text-(--text-primary)">{label}</span>
        </div>
        <span className="text-sm font-bold text-(--text-primary)">
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-elevated)">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>
      {warningText && (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">{warningText}</p>
      )}
      {emptyText && !warningText && (
        <p className="mt-2 text-xs text-(--text-muted)">{emptyText}</p>
      )}
    </div>
  );
}

function PlanCard({ name, price, period, badge, features, isCurrent, isPassed, isPopular, isSelected, onSelect, buttonLabel, buttonDisabled, buttonLoading, onUpgrade }) {
  const isSelectable = !isCurrent && !isPassed && !!onSelect;

  let borderColor, boxShadow, background;
  if (isSelected) {
    borderColor = "var(--accent)";
    boxShadow   = "0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 32px color-mix(in srgb, var(--accent) 20%, transparent)";
    background  = "color-mix(in srgb, var(--accent) 5%, var(--bg-surface))";
  } else if (isPopular) {
    borderColor = "var(--accent)";
    boxShadow   = "0 0 24px color-mix(in srgb, var(--accent) 18%, transparent)";
    background  = "var(--bg-surface)";
  } else {
    borderColor = "var(--border)";
    background  = "var(--bg-surface)";
  }

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className="relative flex flex-col rounded-2xl border p-6 transition-all duration-200"
      style={{
        borderColor, boxShadow, background,
        cursor: isSelectable ? "pointer" : "default",
        opacity: isPassed ? 0.45 : 1,
      }}
    >
      {/* Selected check badge */}
      {isSelected && !isCurrent && (
        <div
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "var(--accent)" }}
        >
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {badge && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-white"
          style={{ background: "var(--accent)" }}
        >
          {badge}
        </div>
      )}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">{name}</p>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-black text-(--text-primary)">{price}</span>
          <span className="mb-1.5 text-sm text-(--text-muted)">{period}</span>
        </div>
      </div>
      <ul className="mb-6 flex flex-col gap-2.5">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-(--text-secondary)">
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
        disabled={buttonDisabled || isCurrent}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-default"
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
