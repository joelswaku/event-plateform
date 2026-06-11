"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Eye, EyeOff, Zap, ArrowRight, ChevronLeft, Loader2, Check,
  Upload, X, Plus, Trash2, CheckCircle, User, Mail, Lock,
  Building, MapPin, Globe, Phone, MessageSquare, FileText, BadgeCheck
} from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

/* ─── Static data ────────────────────────────────────────────────────────── */

const ALL_CATEGORIES = [
  "Catering", "Photography", "Videography", "Music & DJ", "Flowers & Décor",
  "Venue", "Transportation", "Security", "Lighting", "Sound & AV",
  "Hair & Makeup", "Officiant", "Cake & Desserts", "Invitations", "Rentals", "Entertainment",
];
const CURRENCIES   = ["USD", "EUR", "GBP", "AUD", "CAD", "AED", "CHF"];
const PRICE_LABELS = ["Starting from", "Per hour", "Per day", "Per person", "Fixed price", "Contact for pricing"];
const STEP_META    = [
  { label: "Account",   icon: User      },
  { label: "Business",  icon: Building  },
  { label: "Portfolio", icon: FileText  },
  { label: "Services",  icon: BadgeCheck},
];

/* ─── Password strength ──────────────────────────────────────────────────── */

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks  = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score   = checks.filter(Boolean).length;
  const colors  = ["#ef4444", "#f59e0b", "#4ade80", "#818cf8"];
  const labels  = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
        {[0,1,2,3].map((i) => (
          <div key={i} style={{ flex:1, height:"2px", borderRadius:"1px", background: i < score ? colors[score-1] : "rgba(255,255,255,0.08)", transition:"background 0.25s" }} />
        ))}
      </div>
      <span style={{ fontSize:"10px", fontWeight:600, color: score > 0 ? colors[score-1] : "rgba(255,255,255,0.2)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {score > 0 ? labels[score-1] : ""}
      </span>
    </div>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────────────── */

function Field({ label, icon: Icon, error, hint, children }) {
  return (
    <div>
      {label && (
        <label style={{ fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.09em", color:"rgba(255,255,255,0.32)", display:"block", marginBottom:"7px" }}>
          {label}
        </label>
      )}
      <div style={{ position:"relative" }}>
        {Icon && (
          <Icon size={14} style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(255,255,255,0.22)", zIndex:1 }} />
        )}
        {children}
      </div>
      {error && <span style={{ fontSize:"11px", color:"#f87171", fontWeight:500, marginTop:"4px", display:"block" }}>{error}</span>}
      {hint && !error && <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.22)", marginTop:"4px", display:"block" }}>{hint}</span>}
    </div>
  );
}

/* ─── Step progress indicator ────────────────────────────────────────────── */

function StepBar({ step }) {
  return (
    <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"flex-start", maxWidth:"480px", margin:"0 auto 40px", padding:"0 16px" }}>
      {/* Connecting line */}
      <div style={{ position:"absolute", top:"15px", left:"calc(16px + 15px)", right:"calc(16px + 15px)", height:"1px", background:"rgba(255,255,255,0.06)", zIndex:0 }} />
      {/* Progress fill */}
      <div style={{ position:"absolute", top:"15px", left:"calc(16px + 15px)", height:"1px", background:"linear-gradient(90deg, #4f46e5, #7c3aed)", zIndex:0, width:`${((step - 1) / (STEP_META.length - 1)) * 100}%`, transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />

      {STEP_META.map(({ label }, idx) => {
        const done   = idx < step - 1;
        const active = idx === step - 1;
        return (
          <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative", zIndex:1 }}>
            <div style={{
              width:"30px", height:"30px", borderRadius:"50%",
              background: done ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : active ? "#0f0e1a" : "#0B0A0F",
              border: done ? "none" : active ? "1.5px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"11px", fontWeight:600,
              color: done ? "#fff" : active ? "#818cf8" : "rgba(255,255,255,0.2)",
              boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.12), 0 0 16px rgba(99,102,241,0.2)" : "none",
              transition:"all 0.3s",
            }}>
              {done ? <Check size={13} strokeWidth={2.5} /> : idx + 1}
            </div>
            <span style={{ fontSize:"10px", fontWeight: active ? 600 : 400, marginTop:"6px", color: active ? "#a78bfa" : done ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerVendor, isLoading } = useVendorStore();
  const [step,             setStep]             = useState(1);
  const [showPass,         setShowPass]         = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [portfolioImages,  setPortfolioImages]  = useState([]);
  const [services,         setServices]         = useState([{ name:"", price:"", description:"" }]);
  const [done,             setDone]             = useState(false);
  const T = useT();

  /* ─── Shared input style factory (inside component so T is in scope) ── */
  const inp = (hasErr = false, iconLeft = false) => ({
    width: "100%",
    padding: iconLeft ? "11px 14px 11px 36px" : "11px 14px",
    background: T.inputBg,
    border: `1px solid ${hasErr ? "rgba(248,113,113,0.4)" : T.inputBorder}`,
    borderRadius: "11px",
    fontSize: "13px",
    fontWeight: 400,
    color: T.text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
  });

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({ mode: "onChange" });
  const password = watch("password", "");

  const nextStep = async () => {
    const fields = step === 1
      ? ["fullName", "email", "password", "confirmPassword"]
      : step === 2 ? ["businessName", "city", "country"] : [];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const onFinalSubmit = async (data) => {
    if (!selectedCategory) {
      toast.error("Please select a category in Step 2 before submitting.");
      setStep(2);
      return;
    }

    // Step A — register (this sets the auth token in the store)
    const result = await registerVendor({
      businessName: data.businessName,
      category:     selectedCategory,
      email:        data.email,
      password:     data.password,
      fullName:     data.fullName,
      city:         data.city    || null,
      country:      data.country || null,
      phone:        data.phone   || null,
    });
    if (!result.success) {
      toast.error(result.message || "Registration failed");
      return;
    }

    // Step B — upload portfolio images now that we have a token
    const portfolioWithFiles = portfolioImages.filter((p) => p.file);
    const uploadedPortfolio  = [];

    for (const img of portfolioWithFiles) {
      try {
        const fd = new FormData();
        fd.append("image", img.file);
        const { data: up } = await api.post(
          "/vendors/me/upload?folder=vendors/portfolio",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        uploadedPortfolio.push({ title: img.title || img.fileName || "", url: up.data.url });
      } catch {
        // Non-fatal — skip this image, rest of profile still saves
      }
    }

    // Step C — update profile with extra fields
    const extra = {};
    if (data.tagline)    extra.tagline     = data.tagline;
    if (data.bio)        extra.bio         = data.bio;
    if (data.basePrice)  extra.base_price  = parseFloat(data.basePrice);
    if (data.currency)   extra.currency    = data.currency;
    if (data.priceLabel) extra.price_label = data.priceLabel;
    if (data.website)    extra.website_url = data.website;

    const filledServices = services.filter((s) => s.name.trim());
    if (filledServices.length)    extra.services  = filledServices;
    if (uploadedPortfolio.length) extra.portfolio = uploadedPortfolio;

    if (Object.keys(extra).length > 0) {
      const { updateProfile } = useVendorStore.getState();
      await updateProfile(extra);
    }

    setDone(true);
  };

  // Store file locally — actual upload happens in onFinalSubmit after registration
  const handleFileSelect = (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const preview = URL.createObjectURL(file);
    setPortfolioImages((prev) => prev.map((p, i) =>
      i === idx ? { ...p, file, preview, fileName: file.name } : p
    ));
  };

  /* ── Success screen ─────────────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{ minHeight:"100vh", background: T.pageBg, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 65%)", filter:"blur(40px)", pointerEvents:"none" }} />
        <div style={{ maxWidth:"440px", width:"100%", textAlign:"center", ...T.glass, padding:"52px 40px", position:"relative" }}>
          <div style={{ width:"60px", height:"60px", borderRadius:"18px", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <CheckCircle size={26} color="#4ade80" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize:"24px", fontWeight:700, letterSpacing:"-0.02em", marginBottom:"10px", color: T.text }}>You&apos;re all set!</h1>
          <p style={{ fontSize:"14px", lineHeight:1.75, color: T.textMuted, fontWeight:400, marginBottom:"32px" }}>
            Your vendor profile is under review. We typically approve profiles within 24 hours and will email you when you&apos;re live.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <Link href="/dashboard" style={{ display:"block", padding:"13px", borderRadius:"12px", fontSize:"14px", fontWeight:600, color:"#fff", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", textDecoration:"none", textAlign:"center", letterSpacing:"-0.01em" }}>
              Go to Dashboard
            </Link>
            <Link href="/marketplace" style={{ display:"block", padding:"13px", borderRadius:"12px", fontSize:"14px", fontWeight:500, color: T.textSub, border:`1px solid ${T.border}`, textDecoration:"none", textAlign:"center" }}>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Page shell ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background: T.pageBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 16px", position:"relative", overflow:"hidden", fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Atmospheric glow */}
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"700px", height:"700px", borderRadius:"50%", background:"radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 65%)", filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", top:"20%", right:"10%", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, rgba(192,38,211,0.04) 0%, transparent 70%)", filter:"blur(40px)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:"560px", position:"relative", zIndex:1 }}>

        {/* Logo */}
        <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:"9px", textDecoration:"none", marginBottom:"40px" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={15} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontWeight:700, fontSize:"15px", letterSpacing:"-0.015em", color: T.text }}>EventApp</span>
        </Link>

        {/* Step bar */}
        <StepBar step={step} />

        {/* Card */}
        <div style={{ ...T.glass, padding:"36px 32px" }}>

          {/* ── STEP 1 — Account ──────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom:"28px" }}>
                <h2 style={{ fontSize:"21px", fontWeight:700, letterSpacing:"-0.02em", marginBottom:"5px", color: T.text }}>Create your account</h2>
                <p style={{ fontSize:"13px", color: T.textMuted, fontWeight:400 }}>
                  Start your vendor journey —{" "}
                  <span style={{ color:"#818cf8", fontWeight:500 }}>it&apos;s completely free.</span>
                </p>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }} className="form-grid">
                <Field label="Full Name" icon={User} error={errors.fullName?.message}>
                  <input className="prem-input" {...register("fullName", { required:"Full name is required" })}
                    placeholder="Jane Smith" style={inp(!!errors.fullName, true)} />
                </Field>

                <Field label="Email Address" icon={Mail} error={errors.email?.message}>
                  <input className="prem-input" {...register("email", {
                    required:"Email is required",
                    pattern:{ value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message:"Invalid email" },
                  })} type="email" placeholder="jane@studio.com" style={inp(!!errors.email, true)} />
                </Field>

                <Field label="Password" icon={Lock} error={errors.password?.message}>
                  <div style={{ position:"relative" }}>
                    <input className="prem-input" {...register("password", {
                      required:"Password is required",
                      minLength:{ value:8, message:"At least 8 characters" },
                    })} type={showPass ? "text" : "password"} placeholder="••••••••"
                      style={{ ...inp(!!errors.password, true), paddingRight:"40px" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color: T.textFaint, cursor:"pointer", display:"flex", padding:0 }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </Field>

                <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword?.message}>
                  <div style={{ position:"relative" }}>
                    <input className="prem-input" {...register("confirmPassword", {
                      required:"Please confirm your password",
                      validate:(v) => v === password || "Passwords do not match",
                    })} type={showConfirm ? "text" : "password"} placeholder="••••••••"
                      style={{ ...inp(!!errors.confirmPassword, true), paddingRight:"40px" }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color: T.textFaint, cursor:"pointer", display:"flex", padding:0 }}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
              </div>
            </>
          )}

          {/* ── STEP 2 — Business ─────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom:"28px" }}>
                <h2 style={{ fontSize:"21px", fontWeight:700, letterSpacing:"-0.02em", marginBottom:"5px", color: T.text }}>Your business details</h2>
                <p style={{ fontSize:"13px", color: T.textMuted, fontWeight:400 }}>Tell organizers who you are and what you do.</p>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                <Field label="Business Name" icon={Building} error={errors.businessName?.message}>
                  <input className="prem-input" {...register("businessName", { required:"Business name is required" })}
                    placeholder="e.g. Lumière Photo Studio" style={inp(!!errors.businessName, true)} />
                </Field>

                <div>
                  <label style={{ fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.09em", color: T.textFaint, display:"block", marginBottom:"10px" }}>Category</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                    {ALL_CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button type="button" key={cat} onClick={() => setSelectedCategory(active ? "" : cat)}
                          style={{ padding:"6px 13px", borderRadius:"100px", fontSize:"12px", fontWeight:500, border:`1px solid ${active ? "rgba(99,102,241,0.4)" : T.borderSub}`, background:active ? "rgba(99,102,241,0.12)" : T.cardBg, color:active ? "#a78bfa" : T.textMuted, cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}>
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  <Field label="City" icon={MapPin} error={errors.city?.message}>
                    <input className="prem-input" {...register("city", { required:"City is required" })} placeholder="Paris" style={inp(!!errors.city, true)} />
                  </Field>
                  <Field label="Country" icon={Globe} error={errors.country?.message}>
                    <input className="prem-input" {...register("country", { required:"Country is required" })} placeholder="France" style={inp(!!errors.country, true)} />
                  </Field>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  <Field label="Phone" icon={Phone}>
                    <input className="prem-input" {...register("phone")} placeholder="+1 234 567 8900" style={inp(false, true)} />
                  </Field>
                  <Field label="Website" icon={Globe}>
                    <input className="prem-input" {...register("website")} placeholder="https://yourstudio.com" style={inp(false, true)} />
                  </Field>
                </div>

                <Field label="Tagline" icon={MessageSquare} hint="Max 120 characters — shown under your name in the marketplace">
                  <input className="prem-input" {...register("tagline", { maxLength:{ value:120, message:"Max 120 chars" } })}
                    placeholder="Capturing timeless moments with cinematic flair" style={inp(!!errors.tagline, true)} />
                </Field>

                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"7px" }}>
                    <label style={{ fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.09em", color: T.textFaint }}>Bio</label>
                    <span style={{ fontSize:"10px", color: T.textFaint }}>{watch("bio","").length}/500</span>
                  </div>
                  <textarea className="prem-input" {...register("bio", { maxLength:{ value:500, message:"Max 500 chars" } })}
                    placeholder="Tell organizers about your experience, style, and what makes you unique…"
                    rows={4} style={{ ...inp(), resize:"vertical", paddingTop:"11px" }} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 — Portfolio ────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"28px" }}>
                <div>
                  <h2 style={{ fontSize:"21px", fontWeight:700, letterSpacing:"-0.02em", marginBottom:"5px", color: T.text }}>Portfolio images</h2>
                  <p style={{ fontSize:"13px", color: T.textMuted, fontWeight:400 }}>Upload up to 6 images to showcase your work.</p>
                </div>
                <button type="button" onClick={() => setStep(4)}
                  style={{ background:"none", border:"none", fontSize:"12px", fontWeight:500, color: T.textMuted, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
                  Skip for now
                </button>
              </div>

              {/* Image grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"10px", marginBottom:"14px" }} className="portfolio-grid">
                {portfolioImages.map((img, idx) => (
                  <div key={img.id} style={{ position:"relative", borderRadius:"12px", overflow:"hidden", border:`1px solid ${T.border}`, background: T.cardBg, aspectRatio:"4/3" }}>
                    {img.preview ? (
                      <>
                        <img src={img.preview} alt={img.title || `Image ${idx+1}`}
                          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                        {/* Queued badge */}
                        <div style={{ position:"absolute", top:"6px", left:"6px", padding:"2px 7px", borderRadius:"100px", background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)", fontSize:"9px", fontWeight:600, color:"#4ade80" }}>
                          Queued
                        </div>
                        {/* Title overlay */}
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"6px 8px", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)" }}>
                          <input value={img.title}
                            onChange={(e) => setPortfolioImages((p) => p.map((x,i) => i===idx ? {...x, title:e.target.value} : x))}
                            placeholder="Add a title…"
                            style={{ width:"100%", background:"none", border:"none", outline:"none", fontSize:"10px", color:"rgba(255,255,255,0.8)", fontFamily:"inherit" }} />
                        </div>
                        <button type="button" onClick={() => setPortfolioImages((p) => p.filter((_,i) => i!==idx))}
                          style={{ position:"absolute", top:"6px", right:"6px", background:"rgba(0,0,0,0.5)", border:"none", borderRadius:"50%", width:"22px", height:"22px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.7)" }}>
                          <X size={11} />
                        </button>
                      </>
                    ) : (
                      <label style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"7px", cursor:"pointer" }}>
                        <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Upload size={15} color="rgba(129,140,248,0.55)" strokeWidth={1.5} />
                        </div>
                        <span style={{ fontSize:"10px", color: T.textMuted, textAlign:"center", lineHeight:1.4 }}>Click to<br/>upload</span>
                        <input type="file" accept="image/*" style={{ display:"none" }}
                          onChange={(e) => handleFileSelect(e, idx)} />
                      </label>
                    )}
                  </div>
                ))}

                {/* Add slot */}
                {portfolioImages.length < 6 && (
                  <button type="button"
                    onClick={() => setPortfolioImages((p) => [...p, { id:Date.now(), title:"", url:null, preview:null }])}
                    style={{ borderRadius:"12px", border:"1px dashed rgba(99,102,241,0.25)", background:"rgba(99,102,241,0.03)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"7px", cursor:"pointer", aspectRatio:"4/3", fontFamily:"inherit" }}>
                    <Plus size={18} color="rgba(129,140,248,0.4)" />
                    <span style={{ fontSize:"10px", color: T.textMuted }}>Add image</span>
                  </button>
                )}
              </div>

              <p style={{ fontSize:"11px", color: T.textFaint, fontWeight:400 }}>
                PNG, JPG, WEBP · Max 10MB each · {portfolioImages.length}/6 selected
                {portfolioImages.filter(p=>p.file).length > 0 && ` · ${portfolioImages.filter(p=>p.file).length} queued — will upload when you submit`}
              </p>
            </>
          )}

          {/* ── STEP 4 — Services ─────────────────────────────────────── */}
          {step === 4 && (
            <form onSubmit={handleSubmit(onFinalSubmit)}>
              <div style={{ marginBottom:"28px" }}>
                <h2 style={{ fontSize:"21px", fontWeight:700, letterSpacing:"-0.02em", marginBottom:"5px", color: T.text }}>Services & Pricing</h2>
                <p style={{ fontSize:"13px", color: T.textMuted, fontWeight:400 }}>Add up to 5 service packages with pricing.</p>
              </div>

              {/* Base price row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"20px" }}>
                <Field label="Base Price">
                  <input className="prem-input" {...register("basePrice")} type="number" placeholder="1200" style={inp()} />
                </Field>
                <Field label="Currency">
                  <select className="prem-input" {...register("currency")} style={{ ...inp(), cursor:"pointer" }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Price Label">
                  <select className="prem-input" {...register("priceLabel")} style={{ ...inp(), cursor:"pointer" }}>
                    {PRICE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
              </div>

              {/* Service packages */}
              <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"14px" }}>
                {services.map((svc, idx) => (
                  <div key={idx} style={{ padding:"16px", borderRadius:"13px", background: T.cardBg, border:`1px solid ${T.borderSub}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                      <span style={{ fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color: T.textFaint }}>Package {idx + 1}</span>
                      {services.length > 1 && (
                        <button type="button" onClick={() => setServices((p) => p.filter((_,i) => i !== idx))}
                          style={{ background:"none", border:"none", color:"rgba(248,113,113,0.45)", cursor:"pointer", display:"flex", padding:0 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"8px" }}>
                      <input value={svc.name} onChange={(e) => setServices((p) => p.map((s,i) => i===idx ? {...s, name:e.target.value} : s))}
                        placeholder="Package name" className="prem-input" style={inp()} />
                      <input value={svc.price} onChange={(e) => setServices((p) => p.map((s,i) => i===idx ? {...s, price:e.target.value} : s))}
                        type="number" placeholder="Price" className="prem-input" style={inp()} />
                    </div>
                    <textarea value={svc.description} onChange={(e) => setServices((p) => p.map((s,i) => i===idx ? {...s, description:e.target.value} : s))}
                      placeholder="Short description of this package…" rows={2} className="prem-input"
                      style={{ ...inp(), resize:"none", paddingTop:"11px" }} />
                  </div>
                ))}
              </div>

              {services.length < 5 && (
                <button type="button" onClick={() => setServices((p) => [...p, { name:"", price:"", description:"" }])}
                  style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"8px 14px", borderRadius:"9px", fontSize:"12px", fontWeight:500, color:"#818cf8", border:"1px solid rgba(99,102,241,0.22)", background:"rgba(99,102,241,0.06)", cursor:"pointer", fontFamily:"inherit", marginBottom:"20px" }}>
                  <Plus size={13} /> Add service
                </button>
              )}

              {/* Terms */}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer", padding:"14px", borderRadius:"11px", background: T.cardBg, border:`1px solid ${T.borderSub}`, marginBottom:"6px" }}>
                <input {...register("terms", { required:true })} type="checkbox"
                  style={{ marginTop:"2px", accentColor:"#6366f1", width:"14px", height:"14px", flexShrink:0 }} />
                <span style={{ fontSize:"12px", fontWeight:400, color: T.textMuted, lineHeight:1.6 }}>
                  I agree to the{" "}
                  <Link href="/terms" style={{ color:"#818cf8", fontWeight:500, textDecoration:"none" }}>Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" style={{ color:"#818cf8", fontWeight:500, textDecoration:"none" }}>Privacy Policy</Link>
                </span>
              </label>
              {errors.terms && <span style={{ fontSize:"11px", color:"#f87171", fontWeight:500, display:"block", marginBottom:"12px" }}>You must accept the terms to continue.</span>}

              {/* Submit */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"20px", paddingTop:"20px", borderTop:`1px solid ${T.borderSub}` }}>
                <button type="button" onClick={() => setStep(3)}
                  style={{ display:"flex", alignItems:"center", gap:"5px", padding:"10px 18px", borderRadius:"9px", fontSize:"13px", fontWeight:500, border:`1px solid ${T.border}`, background: T.cardBg, color: T.textSub, cursor:"pointer", fontFamily:"inherit" }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <button type="submit" disabled={isLoading}
                  style={{ display:"inline-flex", alignItems:"center", gap:"7px", padding:"11px 24px", borderRadius:"11px", fontSize:"13px", fontWeight:600, color:"#fff", background:isLoading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #4f46e5, #7c3aed)", border:"none", cursor:isLoading ? "not-allowed":"pointer", fontFamily:"inherit", letterSpacing:"-0.01em", boxShadow:"0 4px 16px rgba(79,70,229,0.25)" }}>
                  {isLoading
                    ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Creating Profile…</>
                    : <>Create My Profile <ArrowRight size={14} /></>}
                </button>
              </div>
            </form>
          )}

          {/* ── Step nav (steps 1–3) ─────────────────────────────────── */}
          {step < 4 && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"24px", paddingTop:"20px", borderTop:`1px solid ${T.borderSub}` }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))}
                  style={{ display:"flex", alignItems:"center", gap:"5px", padding:"10px 18px", borderRadius:"9px", fontSize:"13px", fontWeight:500, border:`1px solid ${T.border}`, background: T.cardBg, color: T.textSub, cursor:"pointer", fontFamily:"inherit" }}>
                  <ChevronLeft size={14} /> Back
                </button>
              ) : (
                <Link href="/login" style={{ fontSize:"12px", fontWeight:400, color: T.textFaint, textDecoration:"none" }}>
                  Already have an account? <span style={{ color:"#818cf8" }}>Log in</span>
                </Link>
              )}
              <button type="button" onClick={nextStep}
                style={{ display:"inline-flex", alignItems:"center", gap:"7px", padding:"11px 24px", borderRadius:"11px", fontSize:"13px", fontWeight:600, border:"none", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", color:"#fff", cursor:"pointer", fontFamily:"inherit", letterSpacing:"-0.01em", boxShadow:"0 4px 16px rgba(79,70,229,0.22)" }}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign:"center", marginTop:"20px", fontSize:"11px", color: T.textFaint, fontWeight:400 }}>
          By registering you agree to our{" "}
          <Link href="/terms" style={{ color: T.textMuted, textDecoration:"none" }}>Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: T.textMuted, textDecoration:"none" }}>Privacy Policy</Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .prem-input:focus {
          border-color: rgba(99, 102, 241, 0.38) !important;
          background: rgba(255, 255, 255, 0.045) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.09) !important;
        }
        .prem-input::placeholder { color: rgba(255,255,255,0.18) !important; }
        select.prem-input option { background: #16131f; }
        @media (max-width: 540px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
