"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, Mail, MessageSquare, ExternalLink, HelpCircle, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

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
    a: "Every confirmed guest gets a unique QR code on their confirmation page. Use the Scanner tab in the mobile app (or web scanner) to scan and check them in instantly.",
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
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-(--bg-elevated)"
      >
        <span className="flex-1 text-sm font-semibold text-(--text-primary)">{q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-(--text-muted) transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-(--text-muted)">{a}</p>
      )}
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = !!user?.is_super_admin;
  const openSupport = useChatStore((s) => s.openSupport);
  const unreadTotal = useChatStore((s) => s.unreadTotal);
  const fetchUnreadCount = useChatStore((s) => s.fetchUnreadCount);
  const [opening, setOpening] = useState(false);

  // Fetch unread count on mount and poll
  useEffect(() => {
    if (isSuperAdmin) return;
    fetchUnreadCount();
    const interval = setInterval(() => fetchUnreadCount(), 5000);
    return () => clearInterval(interval);
  }, [isSuperAdmin, fetchUnreadCount]);

  async function handleLiveChat() {
    if (isSuperAdmin) { router.push('/chat'); return; }
    if (opening) return;
    setOpening(true);
    try {
      const conv = await openSupport();
      if (conv) router.push(`/chat/${conv.id}`);
      else toast.error('Could not open support chat. Try again later.');
    } finally { setOpening(false); }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-(--bg-surface) transition hover:bg-(--bg-elevated)"
        >
          <ChevronLeft className="h-4 w-4 text-(--text-muted)" />
        </button>
        <div>
          <h1 className="text-lg font-black text-(--text-primary)">Help & Support</h1>
          <p className="text-xs text-(--text-muted)">Answers and ways to reach us</p>
        </div>
      </div>

      {/* Hero */}
      <div
        className="flex flex-col items-center gap-2 rounded-3xl px-6 py-8 text-center"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(167,139,250,0.07) 100%)", border: "1px solid rgba(99,102,241,0.20)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <HelpCircle className="h-7 w-7" style={{ color: "#818cf8" }} />
        </div>
        <p className="text-base font-bold text-(--text-primary)">How can we help?</p>
        <p className="text-xs text-(--text-muted)">Browse the FAQ below or reach out directly — we typically reply within a few hours.</p>
      </div>

      {/* FAQ */}
      <div className="overflow-hidden rounded-3xl border border-border bg-(--bg-surface)">
        <p className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">
          Frequently Asked Questions
        </p>
        {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
      </div>

      {/* Contact */}
      <div className="rounded-3xl border border-border bg-(--bg-surface) p-5 space-y-3">
        <p className="text-sm font-bold text-(--text-primary)">Still need help?</p>
        <a
          href="mailto:support@meetcraft.app"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-(--bg-elevated)"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <Mail className="h-4 w-4" style={{ color: "#6366f1" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-(--text-primary)">Email support</p>
            <p className="text-xs text-(--text-muted)">support@meetcraft.app</p>
          </div>
          <ExternalLink className="h-4 w-4 text-(--text-muted)" />
        </a>
        <button
          onClick={handleLiveChat}
          disabled={opening}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-(--bg-elevated) disabled:opacity-50"
        >
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            {opening ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#10b981" }} />
            ) : (
              <MessageSquare className="h-4 w-4" style={{ color: "#10b981" }} />
            )}
            {!isSuperAdmin && !opening && unreadTotal > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-(--text-primary)">Live chat</p>
            <p className="text-xs text-(--text-muted)">
              {!isSuperAdmin && unreadTotal > 0
                ? `${unreadTotal} new message${unreadTotal > 1 ? 's' : ''}`
                : 'Available Mon–Fri, 9am–6pm UTC'}
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </button>
      </div>

      <p className="text-center text-xs text-(--text-muted)">
        Version 1.0.0 · Meetcraft
      </p>
    </div>
  );
}
