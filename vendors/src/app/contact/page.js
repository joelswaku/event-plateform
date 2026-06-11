"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, MessageSquare, Clock, ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";

const TOPICS = [
  "General Inquiry",
  "Vendor Support",
  "Billing & Payments",
  "Technical Issue",
  "Partnership",
  "Other",
];

export default function ContactPage() {
  const T = useT();
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: "11px",
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    color: T.text, fontSize: "14px", fontWeight: 400, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ paddingTop: "120px", paddingBottom: "64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "100px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", fontSize: "11px", fontWeight: 600, color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "24px" }}>
            <MessageSquare size={11} /> Get in Touch
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px" }}>
            We&apos;re Here to Help
          </h1>
          <p style={{ fontSize: "16px", color: T.textSub, fontWeight: 400, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>
            Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px", maxWidth: "900px", margin: "0 auto" }} className="contact-grid">

          {/* Info sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { icon: Mail,         title: "Email Us",         desc: "support@eventapp.io", sub: "We reply within 24 hours" },
              { icon: MessageSquare,title: "Live Chat",         desc: "Available in app",    sub: "Mon–Fri, 9am–6pm EST"   },
              { icon: Clock,        title: "Response Time",    desc: "Under 24 hours",       sub: "Usually much faster"     },
            ].map(({ icon: Icon, title, desc, sub }) => (
              <div key={title} style={{ ...T.glass, padding: "20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Icon size={16} color="#818cf8" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{title}</div>
                <div style={{ fontSize: "13px", color: T.textSub, marginBottom: "2px" }}>{desc}</div>
                <div style={{ fontSize: "11px", color: T.textFaint }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Form */}
          {sent ? (
            <div style={{ ...T.glass, padding: "48px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "360px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <CheckCircle size={24} color="#4ade80" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.015em", marginBottom: "10px" }}>Message Sent!</h3>
              <p style={{ fontSize: "14px", color: T.textSub, lineHeight: 1.7, maxWidth: "300px" }}>
                Thanks for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ ...T.glass, padding: "36px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: T.label, display: "block", marginBottom: "6px" }}>Full Name</label>
                  <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: T.label, display: "block", marginBottom: "6px" }}>Email</label>
                  <input type="email" style={inputStyle} placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: T.label, display: "block", marginBottom: "6px" }}>Topic</label>
                <select style={{ ...inputStyle, appearance: "none", background: T.selectBg }} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required>
                  <option value="">Select a topic…</option>
                  {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: T.label, display: "block", marginBottom: "6px" }}>Message</label>
                <textarea style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 28px", borderRadius: "11px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontWeight: 600, fontSize: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
                {loading ? "Sending…" : <><ArrowRight size={14} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus, select:focus { border-color: rgba(99,102,241,0.35) !important; background: rgba(255,255,255,0.05) !important; }
        select option { background: #0e0e1a; color: #fff; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
