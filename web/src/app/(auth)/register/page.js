"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";
import LegalModal from "@/components/legal/LegalModal";

const BASE   = "w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border";
const NORMAL = `${BASE} border-white/8 focus:border-indigo-500/50 focus:bg-white/6`;
const ERR    = `${BASE} border-red-500/50 focus:border-red-500/70`;

const STRENGTH_META = [
  { label: "Weak",   bar: "bg-red-500"    },
  { label: "Fair",   bar: "bg-orange-400" },
  { label: "Good",   bar: "bg-blue-400"   },
  { label: "Strong", bar: "bg-emerald-500"},
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
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? meta.bar : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-500 font-medium">{meta.label} password</p>
    </div>
  );
}

function Field({ label, id, error, touched, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {touched && error && (
        <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterForm() {
  const { register, login, isLoading, error: serverError } = useAuthStore();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const inviteToken  = searchParams.get("invite");

  const [form,         setForm]         = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [touched,      setTouched]      = useState({});
  const [showPw,       setShowPw]       = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [legalSlug,    setLegalSlug]    = useState(null);

  const validate = (vals) => {
    const e = {};
    if (!vals.full_name || vals.full_name.trim().length < 2) e.full_name = "Full name is required";
    if (!vals.email)                                         e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(vals.email))              e.email     = "Enter a valid email";
    if (!vals.password)                                      e.password  = "Password is required";
    else if (vals.password.length < 8)                      e.password  = "Min. 8 characters";
    if (vals.confirmPassword !== vals.password)              e.confirmPassword = "Passwords do not match";
    return e;
  };

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERR : NORMAL);
  const set    = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ full_name: true, email: true, password: true, confirmPassword: true });
    setTermsTouched(true);
    if (Object.keys(errors).length) return;
    if (!termsChecked) return;

    const res = await register({ full_name: form.full_name.trim(), email: form.email, password: form.password });

    if (res.success) {
      if (inviteToken) {
        const loginRes = await login({ email: form.email, password: form.password });
        router.push(loginRes.success ? `/invite/${inviteToken}` : `/login?redirect=/invite/${inviteToken}`);
      } else {
        router.push("/login?registered=1");
      }
    }
  };

  return (
    <AuthShell
      headline="Start your event journey today."
      subline="Create events, invite guests, and grow your audience with powerful tools."
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
        <p className="text-gray-500 text-sm mt-1">Join thousands of event organizers</p>
      </div>

      <GoogleLoginButton />

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Full Name" id="full_name" error={errors.full_name} touched={touched.full_name}>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={set("full_name")}
            onBlur={() => touch("full_name")}
            className={cls("full_name")}
          />
        </Field>

        <Field label="Email" id="email" error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            onBlur={() => touch("email")}
            className={cls("email")}
          />
        </Field>

        <Field label="Password" id="password" error={errors.password} touched={touched.password}>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set("password")}
              onBlur={() => touch("password")}
              className={`${cls("password")} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>

        <Field label="Confirm Password" id="confirmPassword" error={errors.confirmPassword} touched={touched.confirmPassword}>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            onBlur={() => touch("confirmPassword")}
            className={cls("confirmPassword")}
          />
        </Field>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
        >
          {isLoading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating account…</>
          ) : "Create account"}
        </button>

        {/* Terms acceptance checkbox */}
        <div>
          <div className="flex items-start gap-3 select-none">
            <button
              type="button"
              onClick={() => { setTermsChecked(v => !v); setTermsTouched(true); }}
              className={`mt-0.5 shrink-0 flex items-center justify-center rounded-md border-2 transition-all ${
                termsChecked
                  ? "bg-indigo-600 border-indigo-600"
                  : termsTouched && !termsChecked
                  ? "border-red-500 bg-red-500/10"
                  : "border-white/20 bg-white/4"
              }`}
              style={{ width: 18, height: 18 }}>
              {termsChecked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="text-xs text-gray-500 leading-relaxed">
              I have read and agree to the{" "}
              <button type="button" onClick={() => setLegalSlug("terms")}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                Terms of Service
              </button>
              {" "}and{" "}
              <button type="button" onClick={() => setLegalSlug("privacy-policy")}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                Privacy Policy
              </button>
              . I am at least 18 years old.
            </span>
          </div>
          {termsTouched && !termsChecked && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              You must accept the terms to create an account.
            </p>
          )}
        </div>

        <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
