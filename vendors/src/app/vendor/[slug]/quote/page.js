"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Star, MapPin, CheckCircle, Send, Loader2,
  Calendar, Users, MessageSquare, BadgeCheck, User, Mail,
  ArrowRight, DollarSign
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

const CATEGORY_COLORS = {
  "Photography": "#6366f1", "Videography": "#a78bfa", "Music & DJ": "#10b981",
  "Catering": "#f59e0b", "Flowers & Décor": "#f43f5e", "Venue": "#0ea5e9",
  "Transportation": "#f59e0b", "Security": "#6366f1", "Lighting": "#fbbf24",
  "Sound & AV": "#10b981", "Hair & Makeup": "#ec4899", "Officiant": "#a78bfa",
  "Cake & Desserts": "#f59e0b", "Invitations": "#6366f1", "Rentals": "#0ea5e9",
  "Entertainment": "#f43f5e",
};

const EVENT_TYPES = [
  "Wedding", "Corporate Event", "Birthday Party", "Baby Shower",
  "Graduation", "Anniversary", "Holiday Party", "Conference",
  "Product Launch", "Gala", "Fundraiser", "Networking Event", "Other",
];

function StarRow({ rating, size = 13, T }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          color={i <= Math.round(rating) ? "#f59e0b" : T.textFaint} />
      ))}
    </span>
  );
}

export default function QuotePage() {
  const T = useT();
  const params = useParams();
  const slug = params.slug;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    eventType: "", eventDate: "", guests: "", budget: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!slug) return;
    const fetchVendor = async () => {
      try {
        const res = await api.get(`/vendors/${slug}`);
        setVendor(res.data.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [slug]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.message.trim()) errs.message = "Please describe your event";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/vendors/${slug}/inquire`, {
        senderName: form.name,
        senderEmail: form.email,
        eventType: form.eventType || null,
        eventDate: form.eventDate || null,
        guestCount: form.guests ? parseInt(form.guests) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        message: form.message,
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.pageBg, color: T.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div style={{ minHeight: "100vh", background: T.pageBg, color: T.text }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "140px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px" }}>Vendor Not Found</h1>
          <Link href="/marketplace" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 700 }}>
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const color = CATEGORY_COLORS[vendor.category] || "#6366f1";
  const location = [vendor.city, vendor.country].filter(Boolean).join(", ") || "—";
  const initial = vendor.business_name?.[0]?.toUpperCase() || "V";
  const rating = parseFloat(vendor.rating) || 0;

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: "10px", fontSize: "14px", fontWeight: 500,
    color: T.text, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle = {
    fontSize: "13px", fontWeight: 700, color: T.textSub,
    display: "block", marginBottom: "6px",
  };
  const sectionStyle = {
    background: T.cardBgSolid, border: `1px solid ${T.border}`,
    borderRadius: "18px", padding: "26px", marginBottom: "20px",
  };
  const sectionHeadStyle = {
    display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px",
  };
  const sectionIconStyle = {
    width: "36px", height: "36px", borderRadius: "10px",
    background: `${color}15`, border: `1px solid ${color}25`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: "580px", margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
          <div style={{
            width: "88px", height: "88px", borderRadius: "50%",
            background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px",
          }}>
            <CheckCircle size={40} color="#10b981" />
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "14px" }}>
            Quote Request Sent!
          </h1>
          <p style={{ fontSize: "15px", color: T.textSub, fontWeight: 500, lineHeight: 1.75, marginBottom: "36px" }}>
            Your inquiry has been sent to <strong style={{ color: T.text }}>{vendor.business_name}</strong>.
            They&apos;ll review your details and respond to <strong style={{ color: T.text }}>{form.email}</strong> shortly.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/vendor/${slug}`} style={{
              padding: "13px 26px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "14px",
              display: "inline-flex", alignItems: "center", gap: "8px",
              boxShadow: `0 6px 24px ${color}30`,
            }}>
              View Vendor Profile <ArrowRight size={15} />
            </Link>
            <Link href="/marketplace" style={{
              padding: "13px 26px", borderRadius: "12px",
              background: T.cardBgSolid, border: `1px solid ${T.border}`,
              color: T.textSub, textDecoration: "none", fontWeight: 700, fontSize: "14px",
            }}>
              Browse More Vendors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.pageBg, color: T.text, minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <Navbar />

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${T.borderSub}`,
        padding: "88px 0 32px",
        background: `linear-gradient(160deg, ${color}0e 0%, transparent 55%)`,
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <Link href={`/vendor/${slug}`} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", fontWeight: 600, color: T.textSub,
            textDecoration: "none", marginBottom: "20px",
          }}>
            <ChevronLeft size={15} /> Back to {vendor.business_name}
          </Link>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                Request a Quote
              </h1>
              <p style={{ fontSize: "15px", color: T.textSub, fontWeight: 500 }}>
                Fill in your event details and{" "}
                <span style={{ color: T.text, fontWeight: 700 }}>{vendor.business_name}</span>{" "}
                will get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto", padding: "36px 24px 80px",
        display: "grid", gridTemplateColumns: "1fr 310px", gap: "28px", alignItems: "start",
      }} className="quote-layout">

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: "14px 18px", borderRadius: "12px", marginBottom: "20px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "14px", color: "#ef4444", fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Contact Details */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={sectionIconStyle}><User size={16} color={color} /></div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: T.text, margin: 0 }}>Your Contact Details</h2>
                <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 500, marginTop: "2px" }}>How can the vendor reach you?</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid">
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={form.name} placeholder="Jane Smith"
                  onChange={setField("name")}
                  style={{ ...inputStyle, borderColor: fieldErrors.name ? "rgba(239,68,68,0.5)" : undefined }} />
                {fieldErrors.name && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "5px", display: "block" }}>{fieldErrors.name}</span>}
              </div>
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="email" value={form.email} placeholder="jane@email.com"
                  onChange={setField("email")}
                  style={{ ...inputStyle, borderColor: fieldErrors.email ? "rgba(239,68,68,0.5)" : undefined }} />
                {fieldErrors.email && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "5px", display: "block" }}>{fieldErrors.email}</span>}
              </div>
              <div>
                <label style={labelStyle}>
                  Phone Number <span style={{ fontSize: "11px", color: T.textFaint, fontWeight: 400 }}>(optional)</span>
                </label>
                <input type="tel" value={form.phone} placeholder="+1 (555) 000-0000"
                  onChange={setField("phone")} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={sectionIconStyle}><Calendar size={16} color={color} /></div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: T.text, margin: 0 }}>Event Details</h2>
                <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 500, marginTop: "2px" }}>Tell us about your event</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid">
              <div>
                <label style={labelStyle}>Event Type</label>
                <select value={form.eventType} onChange={setField("eventType")}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select event type…</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Event Date</label>
                <input type="date" value={form.eventDate} onChange={setField("eventDate")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Expected Guests</label>
                <div style={{ position: "relative" }}>
                  <Users size={14} color={T.textFaint} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input type="number" value={form.guests} placeholder="150"
                    onChange={setField("guests")}
                    style={{ ...inputStyle, paddingLeft: "36px" }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Budget (USD)</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={14} color={T.textFaint} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input type="number" value={form.budget} placeholder="5,000"
                    onChange={setField("budget")}
                    style={{ ...inputStyle, paddingLeft: "36px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={sectionIconStyle}><MessageSquare size={16} color={color} /></div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: T.text, margin: 0 }}>Your Message</h2>
                <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 500, marginTop: "2px" }}>Share your vision, requirements, or questions</p>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Message <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                value={form.message} onChange={setField("message")} rows={5}
                placeholder={`Hi! I'm planning a ${form.eventType || "special event"} and I'm interested in your services. I'd love to discuss availability and pricing for my event on ${form.eventDate || "my preferred date"}…`}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }}
              />
              {fieldErrors.message && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "5px", display: "block" }}>{fieldErrors.message}</span>}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} style={{
            width: "100%", padding: "17px", borderRadius: "13px",
            fontSize: "16px", fontWeight: 800, color: "#fff",
            background: submitting ? "rgba(99,102,241,0.45)" : `linear-gradient(135deg, ${color}, ${color}bb)`,
            border: "none", cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: submitting ? "none" : `0 8px 32px ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "all 0.2s", fontFamily: "inherit", letterSpacing: "-0.01em",
          }}>
            {submitting
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Sending your inquiry…</>
              : <><Send size={17} /> Send Quote Request</>
            }
          </button>
          <p style={{ fontSize: "12px", color: T.textFaint, fontWeight: 500, textAlign: "center", marginTop: "14px", lineHeight: 1.6 }}>
            By submitting, you agree to share your details with {vendor.business_name} for the purpose of this inquiry.
          </p>
        </form>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: "84px" }}>

          {/* Vendor card */}
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", overflow: "hidden", marginBottom: "16px" }}>
            {/* Cover */}
            <div style={{
              height: "100px",
              background: vendor.cover_url
                ? `url(${vendor.cover_url}) center/cover`
                : `linear-gradient(135deg, ${color}45, ${color}18)`,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", bottom: "-28px", left: "20px",
                width: "58px", height: "58px", borderRadius: "15px",
                background: vendor.logo_url ? `url(${vendor.logo_url}) center/cover` : `linear-gradient(135deg, ${color}, ${color}cc)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", fontWeight: 900, color: "#fff",
                border: `3px solid ${T.pageBg}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                overflow: "hidden", flexShrink: 0,
              }}>
                {!vendor.logo_url && initial}
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: "44px 20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "5px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2, color: T.text }}>
                  {vendor.business_name}
                </h3>
                {vendor.verification_status === "verified" && (
                  <BadgeCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                )}
              </div>

              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "100px",
                fontSize: "11px", fontWeight: 700, background: `${color}15`,
                color, border: `1px solid ${color}25`, marginBottom: "10px",
              }}>
                {vendor.category}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: T.textSub, marginBottom: "12px", fontWeight: 500 }}>
                <MapPin size={11} color={T.textMuted} /> {location}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                <StarRow rating={rating} size={13} T={T} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>{rating.toFixed(1)}</span>
                <span style={{ fontSize: "12px", color: T.textFaint, fontWeight: 500 }}>({vendor.review_count || 0})</span>
              </div>

              {vendor.base_price != null && (
                <div style={{
                  padding: "13px", borderRadius: "11px",
                  background: `${color}0d`, border: `1px solid ${color}20`, textAlign: "center",
                }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>
                    {vendor.price_label || "Starting from"}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color }}>
                    {vendor.currency || "USD"} {Number(vendor.base_price).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips card */}
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.text, marginBottom: "14px" }}>Tips for a great inquiry</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "Mention your event date and guest count",
                "Share your budget range upfront",
                "Describe your vision and style",
                "Ask specific questions you have",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
                  <CheckCircle size={13} color={color} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "12px", color: T.textSub, fontWeight: 500, lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `1px solid ${T.borderSub}` }}>
              <Link href={`/vendor/${slug}`} style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "12px", fontWeight: 600, color: color,
                textDecoration: "none",
              }}>
                <Mail size={12} /> View full vendor profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.18) !important; }
        input:focus, textarea:focus { border-color: ${color}50 !important; box-shadow: 0 0 0 3px ${color}10 !important; }
        select:focus { outline: none; border-color: ${color}50 !important; }
        select option { background: #1a1825; }
        @media (max-width: 860px) {
          .quote-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
