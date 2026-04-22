"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";

/* ── Input styles ────────────────────────────────────────────── */
const BASE   = "w-full px-4 py-2.5 rounded-lg text-gray-900 text-sm outline-none transition-all duration-200 border shadow-sm placeholder:text-gray-400";
const NORMAL = `${BASE} border-gray-200 bg-white focus:border-black focus:ring-4 focus:ring-black/5`;
const ERR    = `${BASE} border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100`;

/* ── Password strength ───────────────────────────────────────── */
const STRENGTH_META = [
  { label: "Weak",   color: "bg-red-400",    text: "text-red-500"     },
  { label: "Fair",   color: "bg-orange-300", text: "text-orange-600"  },
  { label: "Good",   color: "bg-blue-400",   text: "text-blue-600"    },
  { label: "Strong", color: "bg-emerald-500",text: "text-emerald-600" },
];

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  const meta = STRENGTH_META[score - 1] ?? STRENGTH_META[0];
  return (
    <div className="mt-3">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= score ? meta.color : "bg-gray-100"
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium mt-1.5 uppercase tracking-wider ${meta.text}`}>
        {meta.label} Security
      </p>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────── */
function Field({ label, id, error, touched, children }) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 uppercase tracking-tight mb-1.5">
        {label}
      </label>
      {children}
      {touched && error && (
        <p className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const { register, isLoading, error: serverError } = useAuthStore();
  const router = useRouter();

  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPass, setShowPass] = useState(false);

  const validate = (vals) => {
    const e = {};
    if (!vals.full_name || vals.full_name.trim().length < 2) e.full_name = "Full name required";
    if (!vals.email) e.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(vals.email)) e.email = "Invalid email format";
    if (!vals.password) e.password = "Password required";
    else if (vals.password.length < 8) e.password = "Min. 8 characters";
    if (vals.confirmPassword !== vals.password) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERR : NORMAL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ full_name: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(errors).length) return;

    const res = await register({
      full_name: form.full_name.trim(),
      email:     form.email,
      password:  form.password,
    });

    if (res.success) router.push("/login?registered=1");
  };

  return (
    <AuthShell
      headline="Start your event journey today."
      subline="Create events, invite guests, and grow your audience with powerful tools."
    >
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
        <p className="text-gray-500 text-sm mt-2">
          Already a member?{" "}
          <Link href="/login" className="text-black font-semibold hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Full Name" id="full_name" error={errors.full_name} touched={touched.full_name}>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Joel Makila"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            onBlur={() => touch("full_name")}
            className={cls("full_name")}
          />
        </Field>

        <Field label="Email Address" id="email" error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="joel@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => touch("email")}
            className={cls("email")}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password" id="password" error={errors.password} touched={touched.password}>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => touch("password")}
                className={`${cls("password")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm" id="confirmPassword" error={errors.confirmPassword} touched={touched.confirmPassword}>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              onBlur={() => touch("confirmPassword")}
              className={cls("confirmPassword")}
            />
          </Field>
        </div>

        <PasswordStrength password={form.password} />

        {serverError && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-black hover:bg-zinc-800 text-white text-sm font-bold shadow-lg shadow-black/5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span>Creating account…</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-center text-[11px] text-gray-400 px-4 leading-relaxed">
          By joining, you agree to our{" "}
          <Link href="/terms" className="text-gray-600 hover:text-black transition-colors font-medium">Terms</Link>{" "}
          &amp;{" "}
          <Link href="/privacy" className="text-gray-600 hover:text-black transition-colors font-medium">Privacy Policy</Link>.
        </p>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
          <span className="bg-white px-4 text-gray-400 font-bold">Or continue with</span>
        </div>
      </div>

      <GoogleLoginButton />
    </AuthShell>
  );
}
