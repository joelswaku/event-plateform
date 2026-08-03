"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react";
import LegalModal from "@/components/legal/LegalModal";
import { createPaymentRequestKey } from "@/lib/payment-idempotency";
import { resolveThemeFromSections } from "@/lib/styleThemes";

const API = process.env.NEXT_PUBLIC_API_URL;

const colors = {
  background: "var(--t-bg)",
  surface: "var(--t-bg-alt)",
  soft: "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg))",
  border: "var(--t-border)",
  text: "var(--t-text)",
  muted: "var(--t-text-muted)",
  accent: "var(--t-accent)",
  accentLight: "color-mix(in srgb, var(--t-accent) 16%, var(--t-bg-alt))",
};

function fmtPrice(price, currency = "USD") {
  if (!price || Number(price) === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function ticketLabel(ticket) {
  const name = String(ticket?.name ?? "").toLowerCase();
  if (ticket?.kind === "FREE") return "Free access";
  if (name.includes("vip") || name.includes("premium") || name.includes("platinum")) return "Premium access";
  if (name.includes("early") || name.includes("bird")) return "Early access";
  return "Event ticket";
}

function EventMeta({ event, compact = false }) {
  const date = event?.starts_at_local
    ? new Date(event.starts_at_local).toLocaleDateString("en-US", {
        weekday: compact ? "short" : "long",
        month: "long",
        day: "numeric",
        year: compact ? undefined : "numeric",
      })
    : null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold" style={{ color: compact ? "var(--t-text-muted)" : "rgba(255,255,255,0.9)" }}>
      {date && <span className="flex items-center gap-2"><CalendarDays size={15} /> {date}</span>}
      {event?.venue_name && <span className="flex items-center gap-2"><MapPin size={15} /> {event.venue_name}{event.city ? `, ${event.city}` : ""}</span>}
    </div>
  );
}

function TicketChoice({ ticket, event, featured, onChoose }) {
  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const soldOut = available !== null && available <= 0;
  const urgent = available !== null && available > 0 && available <= 20;
  const filled = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 24px 46px var(--t-accent-dim)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col overflow-hidden rounded-[26px] border"
      style={{
        background: colors.surface,
        borderColor: featured ? colors.accent : colors.border,
        boxShadow: featured ? "0 18px 42px var(--t-accent-dim)" : "0 8px 22px rgba(20,52,37,0.06)",
      }}
    >
      {featured && (
        <div className="px-5 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em]" style={{ background: colors.accent, color: "var(--t-dark)" }}>
          Most popular
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: colors.accentLight, color: colors.accent }}>
              <Ticket size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>{ticketLabel(ticket)}</p>
              <h2 className="mt-1 text-xl font-black leading-tight" style={{ color: colors.text }}>{ticket.name}</h2>
            </div>
          </div>
          {soldOut ? (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "#fff0ef", color: "#bc3c37" }}>Sold out</span>
          ) : urgent ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: "#fff7e7", color: "#ad6c00" }}><Zap size={11} /> {available} left</span>
          ) : null}
        </div>

        {ticket.description && <p className="min-h-10 text-sm leading-relaxed" style={{ color: colors.muted }}>{ticket.description}</p>}

        <div className="rounded-2xl px-5 py-4" style={{ background: colors.soft, border: "1px solid var(--t-border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Price per ticket</p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="font-black leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: colors.text, fontSize: "clamp(2.35rem, 5vw, 3.1rem)", letterSpacing: "-0.04em" }}>
              {fmtPrice(ticket.price, ticket.currency)}
            </p>
            {ticket.kind !== "FREE" && <span className="pb-1 text-xs font-semibold" style={{ color: colors.muted }}>{ticket.currency}</span>}
          </div>
        </div>

        <EventMeta event={event} compact />

        {ticket.quantity_total != null && !soldOut && (
          <div className="pt-1">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold" style={{ color: colors.muted }}>
              <span>{urgent ? `${available} spots remaining` : `${available} available`}</span>
              <span style={{ color: colors.accent }}>{filled.toFixed(0)}% claimed</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--t-text) 10%, transparent)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${filled}%`, background: urgent ? "#dd8b31" : colors.accent }} />
            </div>
          </div>
        )}

        <button
          onClick={() => !soldOut && onChoose(ticket)}
          disabled={soldOut}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black transition-all hover:scale-[1.015] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ background: soldOut ? "color-mix(in srgb, var(--t-text) 12%, var(--t-bg))" : colors.accent, color: soldOut ? colors.muted : "var(--t-dark)", boxShadow: soldOut ? "none" : "0 8px 20px var(--t-accent-dim)" }}
        >
          {soldOut ? "Sold out" : ticket.kind === "FREE" ? "Reserve your free spot" : "Choose this ticket"}
          {!soldOut && <ArrowRight size={16} />}
        </button>
      </div>
    </motion.article>
  );
}

function CheckoutModal({ ticket, event, onClose }) {
  const [step, setStep] = useState("form");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [legalSlug, setLegalSlug] = useState(null);
  const paymentRequestKey = useRef(createPaymentRequestKey("ticket"));

  const available = ticket.quantity_total != null ? ticket.quantity_total - (ticket.quantity_sold ?? 0) : 10;
  const maxQty = Math.max(1, Math.min(available, 10));
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const total = priceEach * qty;
  const fee = priceEach > 0 ? Math.round((total * 0.035 + qty * 0.49) * 100) / 100 : 0;
  const inputStyle = { background: "var(--t-bg)", border: "1.5px solid var(--t-border)", color: colors.text };

  async function submit() {
    setTermsTouched(true);
    if (!form.name.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    if (!termsChecked) return setError("Please accept the terms to continue.");

    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/public/events/${event.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: form.name.trim(),
          buyer_email: form.email.trim().toLowerCase(),
          buyer_phone: form.phone.trim() || undefined,
          items: [{ ticket_type_id: ticket.id, quantity: qty }],
          idempotency_key: paymentRequestKey.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      setResult(data.data);
      if (data.data.payment_required && data.data.checkout_url) {
        setStep("redirecting");
        window.location.href = data.data.checkout_url;
      } else {
        setStep("success");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: "color-mix(in srgb, var(--t-dark) 68%, transparent)", backdropFilter: "blur(10px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 36, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 36, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] sm:rounded-[28px]" style={{ background: colors.surface, boxShadow: "0 28px 80px color-mix(in srgb, var(--t-dark) 38%, transparent)" }}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b px-6 py-5" style={{ background: "color-mix(in srgb, var(--t-bg-alt) 95%, transparent)", borderColor: "var(--t-border)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: colors.accentLight, color: colors.accent }}><Ticket size={18} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>{ticketLabel(ticket)}</p>
              <h2 className="mt-0.5 text-lg font-black" style={{ color: colors.text }}>{ticket.name}</h2>
              <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>{event?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition" style={{ color: colors.muted }} onMouseEnter={(event) => { event.currentTarget.style.background = colors.soft; }} onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }} aria-label="Close checkout"><X size={18} /></button>
        </div>

        {step === "form" && (
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl p-4" style={{ background: colors.soft, border: "1px solid var(--t-border)" }}>
              <div className="flex items-center justify-between gap-4"><span className="text-sm font-bold" style={{ color: colors.text }}>Your ticket</span><span className="text-lg font-black" style={{ color: colors.accent }}>{fmtPrice(priceEach, ticket.currency)}</span></div>
              {ticket.kind !== "FREE" && (
                <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--t-border)" }}>
                  <span className="text-sm font-semibold" style={{ color: colors.muted }}>Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQty((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: "var(--t-border)", color: colors.accent }} aria-label="Decrease quantity"><Minus size={15} /></button>
                    <span className="w-5 text-center text-base font-black" style={{ color: colors.text }}>{qty}</span>
                    <button onClick={() => setQty((value) => Math.min(maxQty, value + 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: "var(--t-border)", color: colors.accent }} aria-label="Increase quantity"><Plus size={15} /></button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3.5">
              {[{ key: "name", label: "Full name", type: "text", placeholder: "Your full name" }, { key: "email", label: "Email", type: "email", placeholder: "you@example.com" }, { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 234 567 8900" }].map(({ key, label, type, placeholder }) => (
                <label key={key} className="block text-xs font-bold" style={{ color: colors.text }}>
                  {label}
                  <input type={type} value={form[key]} placeholder={placeholder} onChange={(e) => setForm((value) => ({ ...value, [key]: e.target.value }))} className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#2f6b52]" style={inputStyle} />
                </label>
              ))}
            </div>

            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: "var(--t-bg)", color: colors.muted, border: "1px solid var(--t-border)" }}>
              Your ticket number and QR code will be sent to this email after checkout.
            </div>

            <div className="space-y-2 border-y py-4" style={{ borderColor: "var(--t-border)" }}>
              <div className="flex items-center justify-between text-sm" style={{ color: colors.muted }}><span>Tickets subtotal</span><span className="font-semibold">{fmtPrice(total, ticket.currency)}</span></div>
              {priceEach > 0 && <div className="flex items-center justify-between text-sm" style={{ color: colors.muted }}><span>Service fee</span><span className="font-semibold">{fmtPrice(fee, ticket.currency)}</span></div>}
              <div className="flex items-center justify-between pt-2"><span className="text-sm font-black" style={{ color: colors.text }}>Total</span><span className="text-xl font-black" style={{ color: colors.accent }}>{fmtPrice(total, ticket.currency)}</span></div>
            </div>

            <div className="flex items-start gap-2.5">
              <button type="button" onClick={() => { setTermsChecked((value) => !value); setTermsTouched(true); }} className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-2" style={{ background: termsChecked ? colors.accent : "transparent", borderColor: termsTouched && !termsChecked ? "#c64941" : termsChecked ? colors.accent : "var(--t-border)" }} aria-label="Accept terms">
                {termsChecked && <CheckCircle size={11} color="var(--t-dark)" strokeWidth={3} />}
              </button>
              <p className="text-xs leading-relaxed" style={{ color: colors.muted }}>I agree to the <button type="button" onClick={() => setLegalSlug("terms")} className="underline" style={{ color: colors.accent }}>Terms of Service</button> and <button type="button" onClick={() => setLegalSlug("privacy-policy")} className="underline" style={{ color: colors.accent }}>Privacy Policy</button>.</p>
            </div>
            <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

            {error && <p className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "#fff1ef", color: "#ae4238" }}>{error}</p>}

            <button onClick={submit} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black transition-all hover:scale-[1.01] active:scale-[0.985] disabled:opacity-55" style={{ background: colors.accent, color: "var(--t-dark)", boxShadow: "0 8px 20px var(--t-accent-dim)" }}>
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Processing…</> : <>{ticket.kind === "FREE" ? "Reserve my free spot" : `Pay ${fmtPrice(total, ticket.currency)}`} <ArrowRight size={16} /></>}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold" style={{ color: colors.muted }}><ShieldCheck size={13} /> Secure checkout powered by Stripe</p>
          </div>
        )}

        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 px-7 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: colors.accentLight, color: colors.accent }}><CheckCircle size={32} /></div>
            <div><h2 className="text-2xl font-black" style={{ color: colors.text }}>You&apos;re in!</h2><p className="mt-1 text-sm" style={{ color: colors.muted }}>Your ticket is confirmed and active.</p></div>
            {result?.issued_tickets?.[0] && <div className="rounded-2xl p-4" style={{ background: colors.soft, border: "1px solid var(--t-border)" }}><p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Your QR ticket</p><img src={`${API}/public/tickets/qr/${result.issued_tickets[0].qr_token}`} alt="Your ticket QR code" className="mx-auto h-40 w-40 rounded-xl bg-white p-2" /></div>}
            <p className="text-xs" style={{ color: colors.muted }}>Confirmation sent to <strong style={{ color: colors.text }}>{form.email}</strong></p>
            <a href={`/my-tickets?email=${encodeURIComponent(form.email)}`} className="block w-full rounded-xl py-3.5 text-sm font-black" style={{ background: colors.accent, color: "var(--t-dark)" }}>View my tickets</a>
            <button onClick={onClose} className="w-full py-2 text-sm font-semibold" style={{ color: colors.muted }}>Close</button>
          </motion.div>
        )}

        {step === "redirecting" && <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 px-7 py-12 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: colors.accentLight, color: colors.accent }}><Loader2 size={30} className="animate-spin" /></div><div><h2 className="text-xl font-black" style={{ color: colors.text }}>Opening secure checkout…</h2><p className="mt-1 text-sm" style={{ color: colors.muted }}>You&apos;re being sent to Stripe to complete payment.</p></div></motion.div>}
      </motion.div>
    </div>
  );
}

export default function EventTicketsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [theme, setTheme] = useState(() => resolveThemeFromSections([]));
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(null);
  const [banner, setBanner] = useState(() => {
    if (typeof window === "undefined") return null;
    const payment = new URLSearchParams(window.location.search).get("payment");
    return payment === "success" || payment === "cancelled" ? payment : null;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");
    if (payment === "success" || payment === "cancelled") window.history.replaceState({}, "", window.location.pathname);
    if (payment === "success" && orderId) fetch(`/api/public/orders/${orderId}/confirm`, { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/public/pages/${slug}`).then((response) => response.json()).then((data) => {
        setTheme(resolveThemeFromSections(data.data?.sections));
        return data.data?.event ?? null;
      }).catch(() => null),
      fetch(`/api/public/events/${slug}/tickets`).then((response) => response.json()).then((data) => data.tickets ?? []).catch(() => []),
    ]).then(([evt, foundTickets]) => {
      if (evt?.id && foundTickets.length === 0) {
        return fetch(`/api/public/events/${evt.id}/tickets`).then((response) => response.json()).then((data) => {
          setEvent(evt);
          setTickets(data.tickets ?? []);
        });
      }
      setEvent(evt);
      setTickets(foundTickets);
    }).finally(() => setLoading(false));
  }, [slug]);

  const maxPrice = tickets.length ? Math.max(...tickets.map((ticket) => Number(ticket.price ?? 0))) : 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ ...theme, background: colors.background, color: colors.text, fontFamily: "var(--t-font-body)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>

      <nav className="sticky top-0 z-40 border-b" style={{ background: "color-mix(in srgb, var(--t-bg-alt) 88%, transparent)", backdropFilter: "blur(22px)", borderColor: colors.border }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium transition" style={{ color: colors.muted }} onMouseEnter={(event) => { event.currentTarget.style.color = colors.accent; }} onMouseLeave={(event) => { event.currentTarget.style.color = colors.muted; }}><ArrowLeft size={15} /> Back to event</button>
          <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: colors.accent }}>Event tickets</p>
          <a href="/my-tickets" className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: colors.soft, color: colors.text, border: `1px solid ${colors.border}` }}>My Tickets</a>
        </div>
      </nav>

      <main className="relative w-full" style={{ zIndex: 2 }}>
        <AnimatePresence>
          {banner === "success" && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-5 flex max-w-5xl items-center justify-between gap-4 rounded-2xl px-5 py-4" style={{ background: "color-mix(in srgb, var(--t-accent) 12%, var(--t-bg-alt))", border: `1px solid ${colors.border}` }}><div className="flex items-center gap-3"><CheckCircle size={20} style={{ color: colors.accent, flexShrink: 0 }} /><div><p className="text-sm font-bold" style={{ color: colors.text }}>Payment successful!</p><p className="text-xs" style={{ color: colors.muted }}>Your ticket is being issued — check your email for the QR code.</p></div></div><button onClick={() => setBanner(null)} style={{ color: colors.muted }} aria-label="Dismiss message"><X size={16} /></button></motion.div>}
          {banner === "cancelled" && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-5 flex max-w-5xl items-center justify-between gap-4 rounded-2xl px-5 py-4" style={{ background: "#fff4f1", border: "1px solid #f1d1c9" }}><p className="text-sm font-medium" style={{ color: "#914d3e" }}>Payment was cancelled — your order has not been charged.</p><button onClick={() => setBanner(null)} style={{ color: "#9b675b" }} aria-label="Dismiss message"><X size={16} /></button></motion.div>}
        </AnimatePresence>

        {loading ? (
          <div className="mx-auto max-w-5xl px-4 py-8"><div className="overflow-hidden rounded-2xl"><div className="h-64 animate-pulse" style={{ background: "#dfeadf" }} /><div className="space-y-4 p-7"><div className="h-4 w-32 animate-pulse rounded" style={{ background: "#e4ece5" }} /><div className="h-11 w-4/5 animate-pulse rounded" style={{ background: "#edf3ee" }} /><div className="h-4 w-56 animate-pulse rounded" style={{ background: "#e4ece5" }} /></div></div></div>
        ) : event ? (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} style={{ background: colors.surface }}>
            <div className="relative min-h-[250px] overflow-hidden sm:min-h-[310px]" style={{ background: "linear-gradient(135deg,var(--t-dark),var(--t-dark-surface))" }}>
              {event.cover_image_url && <img src={event.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(0.62) saturate(0.9)" }} />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--t-dark) 84%, transparent) 0%, color-mix(in srgb, var(--t-dark) 48%, transparent) 58%, color-mix(in srgb, var(--t-dark) 18%, transparent) 100%)" }} />
              <div className="relative flex min-h-[250px] flex-col justify-end px-6 pb-7 pt-12 sm:min-h-[310px] sm:px-10 sm:pb-10">
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]" style={{ background: "rgba(255,255,255,0.16)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(10px)" }}><Ticket size={13} /> Tickets for this event</span>
                <h1 className="max-w-2xl text-4xl font-black leading-[0.98] text-white sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", letterSpacing: "-0.035em" }}>{event.title}</h1>
                <div className="mt-5"><EventMeta event={event} /></div>
              </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10 sm:py-10">
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: colors.muted }}>Your place is waiting</p><h2 className="mt-1 text-2xl font-black sm:text-3xl" style={{ color: colors.text, fontFamily: "var(--t-font-heading)" }}>Choose your ticket</h2><p className="mt-2 text-sm" style={{ color: colors.muted }}>Select an option below. Your secure ticket and QR code will arrive by email.</p></div>{tickets.length > 0 && <span className="flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold" style={{ background: colors.soft, color: colors.text }}><Users size={14} /> {tickets.length} {tickets.length === 1 ? "ticket type" : "ticket types"}</span>}</div>

              {tickets.length === 0 ? (
                <div className="rounded-[22px] px-6 py-16 text-center" style={{ background: colors.soft, border: "1px solid var(--t-border)" }}><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: colors.accentLight, color: colors.accent }}><Ticket size={25} /></div><p className="text-xl font-black" style={{ color: colors.text }}>Tickets coming soon</p><p className="mt-2 text-sm" style={{ color: colors.muted }}>Check back closer to the event date.</p></div>
              ) : (
                <div className={`grid w-full gap-5 ${tickets.length === 1 ? "max-w-xl" : tickets.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {tickets.map((ticket) => <TicketChoice key={ticket.id} ticket={ticket} event={event} featured={Number(ticket.price ?? 0) === maxPrice && maxPrice > 0} onChoose={setCheckout} />)}
                </div>
              )}
            </div>
          </motion.section>
        ) : <div className="px-6 py-20 text-center" style={{ background: colors.surface }}><p className="text-lg font-bold" style={{ color: colors.text }}>This event could not be found.</p></div>}

        {!loading && tickets.length > 0 && <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 px-4 py-9 sm:py-11">{[[ShieldCheck, "Secure checkout"], [Ticket, "Instant e-ticket"], [CheckCircle, "QR code entry"], [CreditCard, "Powered by Stripe"]].map(([Icon, label]) => <span key={label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.muted }}><Icon size={15} style={{ color: colors.accent }} /> {label}</span>)}</div>}
      </main>

      <AnimatePresence>{checkout && <CheckoutModal ticket={checkout} event={event} onClose={() => setCheckout(null)} />}</AnimatePresence>
    </div>
  );
}
