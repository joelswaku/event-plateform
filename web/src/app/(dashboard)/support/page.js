"use client";

import { useState } from "react";
import {
  HelpCircle, Mail, MessageSquare, ChevronDown,
  ExternalLink, LifeBuoy, BookOpen, Zap, X, Minus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

/* ── FAQ data ──────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "How do I upgrade my plan?",
    a: "Go to Settings → Plans & Billing and click Upgrade. You'll be taken to a secure Stripe checkout. Upgrades take effect immediately after payment.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Click 'Manage Billing' in your settings and choose 'Cancel Subscription'. You'll keep access until the end of your billing period — no prorated refunds.",
  },
  {
    q: "Why aren't my guests receiving emails?",
    a: "Check your event's email settings and ensure the guest has a valid email address. Emails can sometimes land in spam — ask guests to check there. If problems persist, contact support.",
  },
  {
    q: "How does QR check-in work?",
    a: "Every confirmed guest gets a unique QR code on their confirmation page. Use the Scanner tab in the mobile app or web scanner to scan and check them in instantly.",
  },
  {
    q: "Can I sell tickets on the free plan?",
    a: "Ticket selling requires the Starter plan or above. Starter has a 2% platform fee; Pro reduces this to 1.5%. Stripe processes all payments securely.",
  },
  {
    q: "How do I export my guest list?",
    a: "On any event's Guests page, click the Export button (CSV). You can export all guests, or filter by status before exporting.",
  },
  {
    q: "I lost access to my account. What do I do?",
    a: "Use the 'Forgot password' link on the login page to reset your password via email. If you still can't access your account, email us at support@meetcraft.app.",
  },
  {
    q: "How do I add team members to my event?",
    a: "Open the event → Team tab → Invite Member. Enter their email and choose a role (Admin, Editor, or Scanner). They'll receive an invitation link.",
  },
];

/* ── FAQ accordion ─────────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-white/10 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/3"
      >
        <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-white/80">{q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-gray-400 dark:text-white/30 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600 dark:text-white/50">{a}</p>
      )}
    </div>
  );
}

/* ── Contact card ──────────────────────────────────────────────────────────── */
function ContactCard({ href, icon: Icon, iconColor, iconBg, title, sub, external }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-white/4 cursor-pointer"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg, border: `1px solid ${iconColor}33` }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-white/40 truncate">{sub}</p>
      </div>
      {external && <ExternalLink className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />}
    </Tag>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1">Help &amp; Support</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">How can we help?</h1>
        <p className="text-sm text-gray-600 dark:text-white/40 mt-1">Browse answers below, email us, or start a live chat with our team.</p>
      </div>

      {/* ── Quick-action hero cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: BookOpen,
            color: "#6366f1",
            bg: "rgba(99,102,241,0.12)",
            title: "Browse FAQ",
            desc: "Instant answers to common questions",
            action: () => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" }),
          },
          {
            icon: Mail,
            color: "#10b981",
            bg: "rgba(16,185,129,0.12)",
            title: "Email us",
            desc: "support@meetcraft.app",
            href: "mailto:support@meetcraft.app",
          },
          {
            icon: MessageSquare,
            color: "#a78bfa",
            bg: "rgba(167,139,250,0.12)",
            title: "Live chat",
            desc: "Mon–Fri, 9am–6pm UTC",
            action: () => setChatOpen(true),
          },
        ].map(({ icon: Icon, color, bg, title, desc, href, action }) => {
          const Tag = href ? "a" : "button";
          return (
            <Tag
              key={title}
              href={href}
              onClick={action}
              className="group flex flex-col gap-3 rounded-2xl p-5 text-left transition hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: bg,
                border: `1px solid ${color}28`,
                boxShadow: `0 8px 30px rgba(0,0,0,0.25)`,
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${color}1a`, border: `1px solid ${color}40` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-600 dark:text-white/50 mt-0.5">{desc}</p>
              </div>
            </Tag>
          );
        })}
      </div>

      {/* ── Main grid: FAQ left, contact right ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FAQ */}
        <div id="faq-section" className="lg:col-span-2">
          <div className="rounded-3xl border overflow-hidden bg-white dark:bg-white/3 border-gray-200 dark:border-white/8">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <HelpCircle className="h-4 w-4 text-gray-400 dark:text-white/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">
                Frequently Asked Questions
              </p>
            </div>
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>

        {/* Right column: contact + status */}
        <div className="flex flex-col gap-4">

          {/* Still need help */}
          <div className="rounded-3xl border p-5 space-y-1 bg-white dark:bg-white/3 border-gray-200 dark:border-white/8">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-white/40 px-1 pb-2">Still need help?</p>

            <ContactCard
              href="mailto:support@meetcraft.app"
              icon={Mail}
              iconColor="#6366f1"
              iconBg="rgba(99,102,241,0.12)"
              title="Email support"
              sub="support@meetcraft.app"
              external
            />

            <button
              onClick={() => setChatOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-white/4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <MessageSquare className="h-5 w-5" style={{ color: "#10b981" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Live chat</p>
                <p className="text-xs text-gray-500 dark:text-white/40">Available Mon–Fri, 9am–6pm UTC</p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                style={{ boxShadow: "0 0 6px #10b981" }} />
            </button>
          </div>

          {/* Status card */}
          <div className="rounded-3xl border p-5 bg-white dark:bg-white/3 border-gray-200 dark:border-white/8">
            <div className="flex items-center gap-2.5 mb-3">
              <Zap className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">Platform status</p>
            </div>
            <div className="space-y-2">
              {[["API", "Operational"], ["Scanner", "Operational"], ["Email delivery", "Operational"], ["Payments", "Operational"]].map(([name, status]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-white/50">{name}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="rounded-3xl border p-5 space-y-1 bg-white dark:bg-white/3 border-gray-200 dark:border-white/8">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-white/40 px-1 pb-2">Resources</p>
            {[
              { label: "Documentation", url: "https://meetcraft.app/docs" },
              { label: "Privacy Policy", url: "/privacy-policy" },
              { label: "Terms of Service", url: "/terms" },
            ].map(({ label, url }) => (
              <a key={label} href={url} target={url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition hover:bg-gray-50 dark:hover:bg-white/4">
                <span className="text-sm text-gray-700 dark:text-white/60">{label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-300 dark:text-white/20" />
              </a>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-white/20 pb-2">
            LiteEvent · v1.0.0
          </p>
        </div>
      </div>

    </div>

    {/* ── Floating chat widget ──────────────────────────────────────────── */}
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          key="chat-float"
          initial={{ opacity: 0, y: 32, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.92 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", bottom: 28, right: 28, width: 380, zIndex: 9999,
            display: "flex", flexDirection: "column",
            borderRadius: 20, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.08)",
            border: "1px solid rgba(99,102,241,0.25)",
            background: "#0a0a12",
          }}
        >
          {/* title bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", flexShrink: 0,
            background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)",
            }}>
              <LifeBuoy size={16} style={{ color: "#818cf8" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>Support</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.40)" }}>We typically reply within a few hours</p>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setMinimized(m => !m)} title={minimized ? "Expand" : "Minimize"}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                <Minus size={13} />
              </button>
              <button onClick={() => { setChatOpen(false); setMinimized(false); }} title="Close"
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* chat body */}
          <motion.div
            animate={{ height: minimized ? 0 : 460 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <div style={{ height: 460 }}>
              <ChatWorkspace variant="support" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Launcher bubble */}
    <AnimatePresence>
      {!chatOpen && (
        <motion.button
          key="chat-launcher"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.2 }}
          onClick={() => { setChatOpen(true); setMinimized(false); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Open support chat"
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#6366f1,#7c3aed)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.50), 0 0 0 1px rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}
        >
          <MessageSquare size={22} />
        </motion.button>
      )}
    </AnimatePresence>
    </>
  );
}
