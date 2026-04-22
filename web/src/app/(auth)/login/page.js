"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";

/* ── Shared field styles ─────────────────────────────────────── */
const BASE = [
  "w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600",
  "outline-none transition-all bg-white/4 border",
].join(" ");
const NORMAL = `${BASE} border-white/8 focus:border-indigo-500/50 focus:bg-white/6`;
const ERROR  = `${BASE} border-red-500/50   focus:border-red-500/70`;

function validate(form) {
  const e = {};
  if (!form.email)                            e.email    = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
  if (!form.password)                         e.password = "Password is required";
  return e;
}

/* ── Field wrapper ───────────────────────────────────────────── */
function Field({ label, id, error, touched, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-gray-400 mb-1.5">
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

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const [form,        setForm]        = useState({ email: "", password: "" });
  const [touched,     setTouched]     = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERROR : NORMAL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");
    if (errors.email || errors.password) return;

    const res = await login(form);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setServerError(res.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <AuthShell
      headline="Manage your events like a pro."
      subline="Create, sell tickets, track guests, and grow your events effortlessly."
    >
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign in</h1>
        <p className="text-gray-500 text-sm mt-1.5">
          New here?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <Field label="Email address" id="email" error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => touch("email")}
            className={cls("email")}
          />
        </Field>

        <Field label="Password" id="password" error={errors.password} touched={touched.password}>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => touch("password")}
              className={`${cls("password")} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-[13px] text-gray-500 hover:text-gray-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-gray-600 text-xs uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      <div className="mt-5">
        <GoogleLoginButton />
      </div>
    </AuthShell>
  );
}
