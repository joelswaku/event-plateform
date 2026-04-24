"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import AuthShell from "@/components/auth/AuthShell";

const BASE   = "w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border";
const NORMAL = `${BASE} border-white/8 focus:border-indigo-500/50 focus:bg-white/6`;
const ERR    = `${BASE} border-red-500/50 focus:border-red-500/70`;

/* ── Password strength ───────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_META = [
  { label: "Weak",   bar: "bg-red-500",     text: "text-red-400"     },
  { label: "Fair",   bar: "bg-orange-500",  text: "text-orange-400"  },
  { label: "Good",   bar: "bg-amber-500",   text: "text-amber-400"   },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-400" },
];

function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  const meta = STRENGTH_META[score - 1] ?? STRENGTH_META[0];
  return (
    <div className="mt-2.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? meta.bar : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1.5 ${meta.text}`}>{meta.label} password</p>
    </div>
  );
}

/* ── Validation ──────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.password)
    e.password = "Password is required";
  else if (form.password.length < 8)
    e.password = "Password must be at least 8 characters";
  if (!form.confirmPassword)
    e.confirmPassword = "Please confirm your password";
  else if (form.password && form.confirmPassword !== form.password)
    e.confirmPassword = "Passwords do not match";
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

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const { resetPassword, isLoading } = useAuthStore();

  const [form,        setForm]        = useState({ password: "", confirmPassword: "" });
  const [touched,     setTouched]     = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [serverError, setServerError] = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERR : NORMAL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    setServerError("");
    if (errors.password || errors.confirmPassword) return;
    if (!token) { setServerError("Invalid or expired link."); return; }

    const res = await resetPassword({ token, newPassword: form.password });
    if (res?.success) {
      setSuccess(true);
    } else {
      setServerError(res?.message || "Reset failed. The link may have expired.");
    }
  };

  return (
    <AuthShell
      headline="Secure your account."
      subline="Set a new password and get back to managing your events."
    >
      {!success ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Choose a strong password to protect your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <Field label="New password" id="password" error={errors.password} touched={touched.password}>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
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
              <PasswordStrength password={form.password} />
            </div>

            <Field
              label="Confirm new password"
              id="confirmPassword"
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
            >
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onBlur={() => touch("confirmPassword")}
                className={cls("confirmPassword")}
              />
            </Field>

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
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        </>
      ) : (
        /* ── Success state ──────────────────────────────────────── */
        <div className="text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Password updated</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            Your password has been changed successfully.
            <br />
            You can now sign in with your new credentials.
          </p>

          <Link
            href="/login"
            className="mt-8 flex items-center justify-center w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            Continue to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
