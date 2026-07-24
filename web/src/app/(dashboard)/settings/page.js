"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  CreditCard, User, Bell, Shield, ChevronRight,
  Calendar, Ticket, HelpCircle, LogOut, Layers,
  Zap, Home, Plus, Star, ExternalLink, Loader2,
  Check, ArrowRight, BarChart2, Globe, Scale,
  FileText, Lock, BookOpen,
} from "lucide-react";
import { useAuthStore }         from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import PageHeader               from "@/components/ui/page-header";
import BillingModal             from "@/components/layout/BillingModal";
import LegalModal               from "@/components/legal/LegalModal";

/* ─────────────────────────────────────────────────────────────────────
   SHARED — bottom navigation (mirrors the events page nav)
───────────────────────────────────────────────────────────────────── */
function MobileBottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: "Home",    Icon: Home,         active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: Calendar,     active: pathname.startsWith("/events") },
    null,
    { href: "/tickets",   label: "Tickets", Icon: Ticket,       active: pathname === "/tickets" },
    { href: "/settings",  label: "Account", Icon: User,         active: pathname.startsWith("/settings") },
  ];

  return (
    <div
      className="shrink-0 border-t px-1 pt-2"
      style={{
        background: "#0e0e16",
        borderColor: "rgba(255,255,255,0.08)",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-end justify-around">
        {tabs.map((tab, i) => {
          if (!tab) {
            return (
              <Link key="create" href="/events/create" className="-mt-5 flex flex-col items-center gap-1">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}
                >
                  <Plus size={24} className="text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Create
                </span>
              </Link>
            );
          }
          const { href, label, Icon, active } = tab;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
              <Icon size={22} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wide"
                style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MOBILE  (< sm)  — pixel-match of the React Native profile screen
───────────────────────────────────────────────────────────────────── */
function MobileSettings() {
  const router        = useRouter();
  const user          = useAuthStore((s) => s.user);
  const logoutAction  = useAuthStore((s) => s.logout);
  const updateAvatar  = useAuthStore((s) => s.updateAvatar);
  const { plan, isSubscribed, fetchSubscription } = useSubscriptionStore();

  const fileInputRef = useRef(null);

  const [loggingOut,        setLoggingOut]        = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [legalSlug,         setLegalSlug]         = useState(null);
  const [avatarLoading,     setAvatarLoading]     = useState(false);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    await updateAvatar(file);
    setAvatarLoading(false);
    e.target.value = "";
  }

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const isPremium = isSubscribed && plan !== "free";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const PLAN_DISPLAY = { free: "Free", starter: "Starter", pro: "Pro", premium: "Pro", enterprise: "Enterprise" };
  const planLabel = isPremium
    ? `✦ ${PLAN_DISPLAY[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1)}`
    : "Free";

  const planLimits = {
    free:       "1 event · 50 guests · Classic templates only",
    starter:    "5 events · 500 guests · All themes",
    pro:        "Unlimited events · Unlimited guests",
    enterprise: "Enterprise · Custom limits",
  }[plan] ?? "1 event · 50 guests · Classic templates only";

  async function handleLogout() {
    setLoggingOut(true);
    router.replace("/login");
    try { await logoutAction(); } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "#07070f" }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-3"
        style={{
          paddingTop: "max(52px, env(safe-area-inset-top))",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ width: 40 }} />
        <p style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>Profile</p>
        <div style={{ width: 40 }} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-5 pb-8 pt-6">

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 pt-2 pb-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {/* Avatar with camera badge - pressable */}
            <button
              className="relative"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              style={{ cursor: avatarLoading ? "default" : "pointer" }}
            >
              <div
                style={{
                  width: 96, height: 96, borderRadius: 48, padding: 3,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.55), rgba(167,139,250,0.35))",
                }}
              >
                <div
                  style={{
                    width: "100%", height: "100%", borderRadius: 48,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Camera badge */}
              <div
                style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 26, height: 26, borderRadius: 13,
                  background: "#6366f1",
                  border: "2.5px solid #07070f",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {avatarLoading ? (
                  <Loader2 size={11} className="animate-spin" style={{ color: "#fff" }} />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                )}
              </div>
            </button>

            <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.3, marginTop: 8 }}>
              {user?.name ?? "—"}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {user?.email ?? "—"}
            </p>
          </div>

          {/* Plan card */}
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              backgroundColor: "#14141f",
              border: `1px solid ${isPremium ? "rgba(201,169,110,0.40)" : "rgba(255,255,255,0.10)"}`,
            }}
          >
            {isPremium && (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.10) 0%, rgba(245,158,11,0.04) 100%)" }}
              />
            )}
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Current Plan
                </p>
                <p style={{ fontSize: 18, fontWeight: 900, marginTop: 2, color: isPremium ? "#C9A96E" : "rgba(255,255,255,0.45)" }}>
                  {planLabel}
                </p>
              </div>
              {!isPremium && (
                <Link
                  href="/settings/billing"
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: "rgba(245,158,11,0.15)",
                    border: "1px solid rgba(245,158,11,0.30)",
                  }}
                >
                  <Zap size={13} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>Upgrade</span>
                </Link>
              )}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
              {planLimits}
            </p>
          </div>

          {/* Menu items */}
          <div className="flex flex-col" style={{ gap: 2 }}>
            <MobileMenuItem Icon={Calendar}   label="My Events"       href="/events" />
            <MobileMenuItem Icon={Ticket}     label="My Tickets"      href="/tickets" />
            <MobileMenuItem Icon={Layers}     label="Plans & Billing" href="/settings/billing" />
            <MobileMenuItem Icon={User}       label="Edit Profile"    href="/settings/edit-profile" />
            <MobileMenuItem Icon={Bell}       label="Notifications"   href="/settings/notifications" />
            <MobileMenuItem Icon={Shield}     label="Security"        href="/settings/security" />
            <MobileMenuItem Icon={HelpCircle} label="Help & Support"  href="/settings/support" />

            {/* Legal section */}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", paddingLeft: 4, marginBottom: 4 }}>
                Legal
              </p>
              <MobileMenuItem Icon={FileText} label="Terms of Service" onPress={() => setLegalSlug("terms")}           iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" />
              <MobileMenuItem Icon={Lock}     label="Privacy Policy"  onPress={() => setLegalSlug("privacy-policy")} iconColor="#6366f1" iconBg="rgba(99,102,241,0.12)" />
              <MobileMenuItem Icon={Scale}    label="Cookies Policy"  onPress={() => setLegalSlug("cookies-policy")} iconColor="#10b981" iconBg="rgba(16,185,129,0.12)" />
              <MobileMenuItem Icon={BookOpen} label="Acceptable Use"  onPress={() => setLegalSlug("acceptable-use")} iconColor="#a78bfa" iconBg="rgba(167,139,250,0.12)" />
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 transition"
            style={{
              border: "1px solid rgba(239,68,68,0.28)",
              backgroundColor: "rgba(239,68,68,0.08)",
            }}
          >
            <LogOut size={16} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>Sign Out</span>
          </button>

        </div>
      </div>

      {/* Bottom nav — same as events page */}
      <MobileBottomNav />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] overflow-hidden"
            style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-[20px] font-black text-white text-center">Sign out?</h2>
              <p className="text-[13px] mt-2 text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
                You'll need to log back in to manage your events.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 space-y-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-3.5 rounded-[16px] text-sm font-bold transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#ef4444",
                }}
              >
                {loggingOut ? "Signing out…" : "Sign Out"}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 rounded-[14px] text-sm font-bold transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />
    </div>
  );
}

function MobileMenuItem({ Icon, label, href, soon, newTab = false, onPress, iconColor = "#6366f1", iconBg = "rgba(99,102,241,0.14)" }) {
  const inner = (
    <div
      className="flex w-full items-center gap-3 px-1 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: soon ? "rgba(255,255,255,0.35)" : "#fff", flex: 1 }}>
        {label}
      </span>
      {soon ? (
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
          Soon
        </span>
      ) : (
        <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
      )}
    </div>
  );

  if (soon) return <div className="pointer-events-none">{inner}</div>;
  if (onPress) return <button onClick={onPress} className="block w-full text-left">{inner}</button>;
  if (newTab) return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
  return <Link href={href} className="block">{inner}</Link>;
}

/* ─────────────────────────────────────────────────────────────────────
   DESKTOP  (≥ sm)  — two-column profile + billing hub
───────────────────────────────────────────────────────────────────── */

const PLAN_PERKS = {
  free:    ["1 event", "50 guests / event", "Classic theme only", "QR check-in", "RSVP page builder", "Email support"],
  starter: ["5 events", "500 guests / event", "All themes & styles", "Ticket selling (2% fee)", "1 reminder / guest", "Basic analytics", "Up to 3 team members", "QR check-in scanner"],
  pro:     ["Unlimited events", "Unlimited guests", "All themes & styles", "Ticket selling (1.5% fee)", "Unlimited reminders", "Advanced analytics", "Custom domain", "Unlimited team members", "Priority support"],
};

const PLAN_META = {
  free:    { label: "Free",    price: "$0",  period: "forever", accentHex: "#9ca3af", gradFrom: "#374151", gradTo: "#4b5563" },
  starter: { label: "Starter", price: "$19", period: "/ month", accentHex: "#6366f1", gradFrom: "#4f46e5", gradTo: "#818cf8" },
  pro:     { label: "Pro",     price: "$49", period: "/ month", accentHex: "#c9a96e", gradFrom: "#c9a96e", gradTo: "#f59e0b" },
};

const STATUS_CFG = {
  active:   { label: "Active",   color: "#10b981" },
  trialing: { label: "Trial",    color: "#6366f1" },
  past_due: { label: "Past due", color: "#f59e0b" },
  canceled: { label: "Canceled", color: "#ef4444" },
};

function fmtMonthYear(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
  catch { return null; }
}
function fmtFullDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
  catch { return null; }
}

function DesktopNavLink({ Icon, label, href, soon }) {
  const inner = (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        soon ? "opacity-40" : "hover:bg-(--bg-elevated)"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--bg-elevated)">
        <Icon className="h-4 w-4 text-(--text-muted)" />
      </div>
      <span className="flex-1 text-sm font-medium text-(--text-secondary)">{label}</span>
      {soon ? (
        <span className="rounded-full bg-(--bg-elevated) px-2 py-0.5 text-[9px] font-semibold text-(--text-muted)">Soon</span>
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-(--text-muted)" />
      )}
    </div>
  );
  if (soon) return <div className="pointer-events-none">{inner}</div>;
  return <Link href={href}>{inner}</Link>;
}

function DesktopSettings() {
  const router        = useRouter();
  const user          = useAuthStore((s) => s.user);
  const logoutAction  = useAuthStore((s) => s.logout);
  const updateAvatar  = useAuthStore((s) => s.updateAvatar);
  const avatarFileRef = useRef(null);
  const {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    usage, limits, fetchSubscription, openCustomerPortal, isLoading,
  } = useSubscriptionStore();

  const [billingOpen,    setBillingOpen]   = useState(false);
  const [portalLoading,  setPortalLoading] = useState(false);
  const [showLogout,     setShowLogout]    = useState(false);
  const [loggingOut,     setLoggingOut]    = useState(false);
  const [avatarLoading,  setAvatarLoading] = useState(false);
  const [legalSlug,      setLegalSlug]     = useState(null);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    await updateAvatar(file);
    setAvatarLoading(false);
    e.target.value = "";
  }

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const isPaid    = isSubscribed && plan !== "free";
  const isPro     = isPaid && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const isStarter = plan === "starter";
  const meta      = PLAN_META[isPro ? "pro" : isStarter ? "starter" : "free"];
  const statusCfg = STATUS_CFG[subscriptionStatus] ?? null;
  const renewDate = fmtFullDate(currentPeriodEnd);
  const joinDate  = fmtMonthYear(user?.createdAt);

  const eventsUsed  = usage?.events ?? 0;
  const eventsLimit = limits?.events ?? null;
  const usePct      = eventsLimit ? Math.min((eventsUsed / eventsLimit) * 100, 100) : 0;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  async function handlePortal() {
    setPortalLoading(true);
    await openCustomerPortal();
    setPortalLoading(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    router.replace("/login");
    try { await logoutAction(); } catch {}
  }

  const perks = PLAN_PERKS[isPro ? "pro" : isStarter ? "starter" : "free"] ?? PLAN_PERKS.free;

  return (
    <>
      <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
      <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

      <div className="space-y-5">

        {/* ── PROFILE HERO (full-width, prominent — mirrors mobile) ── */}
        <div className="overflow-hidden rounded-3xl border border-border bg-(--bg-surface)">
          {/* Cover banner */}
          <div
            className="relative h-36"
            style={{ background: `linear-gradient(135deg, ${meta.gradFrom} 0%, ${meta.gradTo} 100%)` }}
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 50%, rgba(255,255,255,0.22) 0%, transparent 55%), radial-gradient(circle at 85% 30%, rgba(255,255,255,0.14) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.10) 0%, transparent 40%)",
              }}
            />
          </div>

          <div className="px-8 pb-7">
            {/* Avatar row — overlaps cover */}
            <div className="-mt-12 mb-5 flex items-end justify-between gap-4">
              {/* Avatar — click to upload */}
              <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              <button
                onClick={() => avatarFileRef.current?.click()}
                title="Change profile photo"
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[22px] text-3xl font-black text-white select-none transition-opacity hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${meta.gradFrom}, ${meta.gradTo})`,
                  boxShadow: `0 6px 24px ${meta.accentHex}55`,
                  outline: "4px solid var(--bg-surface)",
                  outlineOffset: "0px",
                }}
              >
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                  : initials}
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
                  {avatarLoading
                    ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    : <svg className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  }
                </div>
              </button>

              {/* Plan badge + edit placeholder */}
              <div className="mb-1 flex items-center gap-2">
                {statusCfg && (
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}33` }}
                  >
                    {statusCfg.label}
                  </span>
                )}
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  style={{
                    background: `${meta.accentHex}18`,
                    color: meta.accentHex,
                    border: `1px solid ${meta.accentHex}33`,
                  }}
                >
                  {meta.label} Plan
                </span>
              </div>
            </div>

            {/* Name + email */}
            <p className="text-2xl font-black leading-tight text-(--text-primary)">
              {user?.name || "—"}
            </p>
            <p className="mt-0.5 text-sm text-(--text-muted)">{user?.email || "—"}</p>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-border pt-4">
              {joinDate && (
                <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {joinDate}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                <Layers className="h-3.5 w-3.5" />
                {eventsUsed} event{eventsUsed !== 1 ? "s" : ""} created
              </div>
              {isPaid && renewDate && (
                <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                  <Star className="h-3.5 w-3.5" />
                  Renews {renewDate}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                {isPaid && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading || isLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-(--bg-elevated) px-3.5 py-2 text-xs font-semibold text-(--text-primary) transition hover:bg-(--bg-base) disabled:opacity-60"
                  >
                    {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    {portalLoading ? "Opening…" : "Manage Billing"}
                  </button>
                )}
                {!isPro && (
                  <button
                    onClick={() => setBillingOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-90"
                    style={{
                      background: isStarter ? "linear-gradient(135deg,#c9a96e,#f59e0b)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                      color: isStarter ? "#000" : "#fff",
                      boxShadow: isStarter ? "0 3px 12px rgba(201,169,110,0.35)" : "0 3px 12px rgba(99,102,241,0.35)",
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" fill="currentColor" />
                    {isStarter ? "Upgrade to Pro" : "Upgrade Plan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT + BILLING GRID ──────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-5">

          {/* LEFT: Account links + sign out */}
          <div className="flex flex-col gap-4 lg:col-span-2">

            <div className="rounded-3xl border border-border bg-(--bg-surface) p-4">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">
                Account
              </p>
              <div className="flex flex-col gap-0.5">
                <DesktopNavLink Icon={Calendar}   label="My Events"       href="/events" />
                <DesktopNavLink Icon={Ticket}     label="My Tickets"      href="/tickets" />
                <DesktopNavLink Icon={CreditCard} label="Plans & Billing" href="/settings/billing" />
                <DesktopNavLink Icon={User}       label="Edit Profile"    href="/settings/edit-profile" />
                <DesktopNavLink Icon={Bell}       label="Notifications"   href="/settings/notifications" />
                <DesktopNavLink Icon={Shield}     label="Security"        href="/settings/security" />
                <DesktopNavLink Icon={HelpCircle} label="Help & Support"  href="/settings/support" />
              </div>
            </div>

            {/* Legal */}
            <div className="rounded-3xl border border-border bg-(--bg-surface) p-4">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">
                Legal
              </p>
              <div className="flex flex-col gap-0.5">
                {[
                  { Icon: FileText, label: "Terms of Service", slug: "terms",           color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
                  { Icon: Lock,     label: "Privacy Policy",   slug: "privacy-policy",  color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
                  { Icon: Scale,    label: "Cookies Policy",   slug: "cookies-policy",  color: "#10b981", bg: "rgba(16,185,129,0.12)" },
                  { Icon: BookOpen, label: "Acceptable Use",   slug: "acceptable-use",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
                ].map(({ Icon: I, label, slug, color, bg }) => (
                  <button
                    key={slug}
                    onClick={() => setLegalSlug(slug)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--bg-elevated) w-full text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: bg }}>
                      <I size={15} style={{ color }} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-(--text-secondary)">{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sign out */}
            {showLogout ? (
              <div
                className="rounded-3xl p-5"
                style={{ border: "1px solid rgba(239,68,68,0.30)", background: "rgba(239,68,68,0.05)" }}
              >
                <p className="mb-1 text-sm font-bold text-(--text-primary)">Sign out?</p>
                <p className="mb-4 text-xs text-(--text-muted)">
                  You&apos;ll need to log in again to manage your events.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogout(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-(--text-muted) transition hover:bg-(--bg-elevated)"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
                  >
                    {loggingOut ? "Signing out…" : "Sign Out"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLogout(true)}
                className="flex w-full items-center justify-center gap-2 rounded-3xl py-3 text-sm font-semibold transition hover:opacity-80"
                style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.04)", color: "#ef4444" }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            )}
          </div>

          {/* RIGHT: Billing */}
          <div className="flex flex-col gap-4 lg:col-span-3">

            {/* Current plan card */}
            <div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                border: isPaid ? `1px solid ${meta.accentHex}44` : "1px solid var(--border)",
                background: isPaid
                  ? `linear-gradient(135deg, ${meta.accentHex}0d 0%, var(--bg-surface) 60%)`
                  : "var(--bg-surface)",
              }}
            >
              {isPaid && (
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
                  style={{ background: `${meta.accentHex}18` }}
                />
              )}
              <div className="relative">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={isPaid
                        ? { background: `linear-gradient(135deg,${meta.gradFrom},${meta.gradTo})`, boxShadow: `0 4px 14px ${meta.accentHex}44` }
                        : { background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                      {isPaid ? <Star className="h-5 w-5 fill-white text-white" /> : <Zap className="h-5 w-5 text-(--text-muted)" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold capitalize text-(--text-primary)">{meta.label} Plan</p>
                        {!isPaid && (
                          <span className="rounded-full bg-(--bg-elevated) px-2 py-0.5 text-[10px] font-bold text-(--text-muted)">
                            Free forever
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-(--text-muted)">
                        {renewDate ? `Renews ${renewDate}` : isPaid ? "Active subscription" : "Upgrade for more events, themes & features"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-(--text-primary)">{meta.price}</p>
                    <p className="text-xs text-(--text-muted)">{meta.period}</p>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="mb-5 rounded-2xl border border-border bg-(--bg-elevated) p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-(--text-muted)">Events used</span>
                    <span className="text-xs font-bold text-(--text-primary)">
                      {eventsUsed} / {eventsLimit === null ? "∞" : eventsLimit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--bg-base)">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: eventsLimit === null ? "0%" : `${usePct}%`,
                        background: usePct >= 90
                          ? "linear-gradient(90deg,#ef4444,#f97316)"
                          : `linear-gradient(90deg,${meta.gradFrom},${meta.gradTo})`,
                      }}
                    />
                  </div>
                  {eventsLimit !== null && usePct >= 80 && (
                    <p className="mt-1.5 text-[11px]" style={{ color: usePct >= 100 ? "#ef4444" : "#f59e0b" }}>
                      {usePct >= 100 ? "You've reached your event limit." : "You're close to your event limit."}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {isPaid && (
                    <button
                      onClick={handlePortal}
                      disabled={portalLoading || isLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-(--bg-elevated) px-4 py-2.5 text-sm font-semibold text-(--text-primary) transition hover:bg-(--bg-base) disabled:opacity-60"
                    >
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      {portalLoading ? "Opening…" : "Manage Subscription"}
                    </button>
                  )}
                  {!isPro && (
                    <button
                      onClick={() => setBillingOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
                      style={{
                        background: isStarter ? "linear-gradient(135deg,#c9a96e,#f59e0b)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                        color: isStarter ? "#000" : "#fff",
                        boxShadow: isStarter ? "0 4px 16px rgba(201,169,110,0.35)" : "0 4px 16px rgba(99,102,241,0.35)",
                      }}
                    >
                      <Zap className="h-4 w-4" fill="currentColor" />
                      {isStarter ? "Upgrade to Pro" : "Upgrade Plan"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <Link
                    href="/settings/billing"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text-muted) transition hover:text-(--text-primary)"
                  >
                    Full billing details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="rounded-3xl border border-border bg-(--bg-surface) p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-(--text-primary)">What&apos;s included</p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                  style={{ background: `${meta.accentHex}18`, color: meta.accentHex, border: `1px solid ${meta.accentHex}30` }}
                >
                  {meta.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {perks.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-(--text-secondary)">
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${meta.accentHex}22` }}
                    >
                      <Check className="h-2.5 w-2.5" style={{ color: meta.accentHex }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              {!isPro && (
                <div
                  className="mt-5 flex items-center justify-between rounded-2xl p-4"
                  style={{
                    background: isStarter
                      ? "linear-gradient(135deg,rgba(201,169,110,0.08) 0%,rgba(245,158,11,0.04) 100%)"
                      : "linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(139,92,246,0.04) 100%)",
                    border: isStarter ? "1px solid rgba(201,169,110,0.25)" : "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  <div>
                    <p className="text-sm font-bold text-(--text-primary)">
                      {isStarter ? "Ready for unlimited?" : "Unlock everything"}
                    </p>
                    <p className="mt-0.5 text-xs text-(--text-muted)">
                      {isStarter
                        ? "Pro gives you unlimited events, guests, and every feature."
                        : "Starter starts at $19/mo — or go unlimited with Pro at $49/mo."}
                    </p>
                  </div>
                  <button
                    onClick={() => setBillingOpen(true)}
                    className="ml-4 shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition hover:opacity-90"
                    style={{
                      background: isStarter ? "linear-gradient(135deg,#c9a96e,#f59e0b)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                      color: isStarter ? "#000" : "#fff",
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" fill="currentColor" />
                    {isStarter ? "Go Pro" : "Upgrade"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  return (
    <>
      <div className="sm:hidden">
        <MobileSettings />
      </div>
      <div className="hidden sm:block">
        <DesktopSettings />
      </div>
    </>
  );
}
