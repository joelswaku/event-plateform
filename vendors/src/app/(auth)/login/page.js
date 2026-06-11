"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Eye, EyeOff, Zap, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import useT from "@/hooks/useT";

const VENDOR_APP_URL = process.env.NEXT_PUBLIC_VENDOR_APP_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useVendorStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const T = useT();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setError("");
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    } else {
      setError(result.message || "Invalid email or password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#0a0a12" }} className="auth-layout">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #0d0d1a 0%, #10103a 50%, #0a0a1f 100%)",
        padding: "48px", display: "flex", flexDirection: "column",
        justifyContent: "space-between", position: "relative", overflow: "hidden",
      }} className="auth-brand">
        <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", position: "relative" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 900, fontSize: "18px", color: "#fff" }}>
            EventApp{" "}
            <span style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Vendors
            </span>
          </span>
        </Link>

        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: "20px", color: "#fff" }}>
            Grow your event business{" "}
            <span style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              without limits
            </span>
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginBottom: "36px" }}>
            Thousands of event organizers are searching for vendors like you right now.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              "Get discovered by top event organizers",
              "Manage all your inquiries from one dashboard",
              "Build reputation with verified reviews",
            ].map((point) => (
              <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <CheckCircle size={13} color="#a78bfa" />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", padding: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[{ value: "500+", label: "Vendors" }, { value: "12K+", label: "Events" }, { value: "4.9★", label: "Rating" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", background: T.pageBg }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "8px", color: T.text }}>Welcome back</h2>
          <p style={{ fontSize: "15px", color: T.textSub, fontWeight: 500, marginBottom: "32px" }}>
            Sign in to your vendor dashboard
          </p>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "13px", fontWeight: 600, color: "#ef4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.label, display: "block", marginBottom: "7px" }}>Email address</label>
              <input
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })}
                type="email" placeholder="you@example.com"
                style={{ width: "100%", padding: "13px 16px", background: T.inputBg, border: errors.email ? "1px solid rgba(239,68,68,0.5)" : `1px solid ${T.inputBorder}`, borderRadius: "11px", fontSize: "14px", fontWeight: 600, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              {errors.email && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, marginTop: "4px", display: "block" }}>{errors.email.message}</span>}
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.label, display: "block", marginBottom: "7px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  {...register("password", { required: "Password is required" })}
                  type={showPass ? "text" : "password"} placeholder="••••••••"
                  style={{ width: "100%", padding: "13px 46px 13px 16px", background: T.inputBg, border: errors.password ? "1px solid rgba(239,68,68,0.5)" : `1px solid ${T.inputBorder}`, borderRadius: "11px", fontSize: "14px", fontWeight: 600, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, marginTop: "4px", display: "block" }}>{errors.password.message}</span>}
            </div>

            <button type="submit" disabled={isLoading}
              style={{ padding: "14px", borderRadius: "11px", fontSize: "15px", fontWeight: 700, color: "#fff", background: isLoading ? "rgba(99,102,241,0.6)" : "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 6px 20px rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "inherit" }}>
              {isLoading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>
            New vendor?{" "}
            <Link href="/register/vendor" style={{ color: "#6366f1", fontWeight: 700, textDecoration: "none" }}>
              Join free →
            </Link>
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
            <span style={{ fontSize: "11px", color: T.textFaint }}>not a vendor?</span>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
          </div>

          {/* Looking to hire */}
          <Link href="/organizer/login" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            padding: "12px", borderRadius: "11px", fontSize: "13px", fontWeight: 600,
            border: `1px solid ${T.border}`, color: T.textSub, textDecoration: "none",
            background: T.cardBg, transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)"; e.currentTarget.style.color = "#10b981"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
            Looking to hire vendors? Sign in as Organizer
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-layout { grid-template-columns: 1fr !important; }
          .auth-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
