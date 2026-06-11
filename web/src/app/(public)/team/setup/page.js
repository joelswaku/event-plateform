"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";
import { useTeamStore } from "@/store/team.store";
import { useAuthStore } from "@/store/auth.store";
import { setInMemoryToken } from "@/lib/api";

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
  { label: "Fair",   bar: "bg-orange-400",  text: "text-orange-400"  },
  { label: "Good",   bar: "bg-amber-400",   text: "text-amber-400"   },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-400" },
];

function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  const meta = STRENGTH_META[score - 1] ?? STRENGTH_META[0];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? meta.bar : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs mt-1.5 ${meta.text}`}>{meta.label} password</p>
    </div>
  );
}

function SetupForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const { getInviteInfo, setupTeamPassword } = useTeamStore();
  const loginFn = useAuthStore(s => s.login);

  const [phase,     setPhase]     = useState("loading"); // loading | signup | login_required | submitting | error | expired
  const [invite,    setInvite]    = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");

  // signup fields
  const [fullName,   setFullName]   = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [formErr,    setFormErr]    = useState({});
  const [touched,    setTouched]    = useState({});
  const [submitErr,  setSubmitErr]  = useState("");

  // login fields (for existing account path)
  const [loginPass,     setLoginPass]     = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErr,      setLoginErr]      = useState("");

  /* ── Load invite info ── */
  useEffect(() => {
    if (!token) { setPhase("error"); setErrorMsg("No invitation token found."); return; }
    (async () => {
      const res = await getInviteInfo(token);
      if (!res.success) { setPhase("error"); setErrorMsg(res.error || "Invitation not found."); return; }
      const d = res.data?.data ?? res.data;
      if (d?.status === "accepted") { setPhase("expired"); setErrorMsg("already accepted"); return; }
      if (d?.status && d.status !== "pending") { setPhase("expired"); return; }
      setInvite(d);
      if (d?.inviteeName) setFullName(d.inviteeName);
      // If user already has an account, show the login form
      setPhase(d?.userExists ? "login_required" : "signup");
    })();
  }, [token, getInviteInfo]);

  /* ── Signup validation ── */
  function validate() {
    const e = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Full name required";
    if (!password)           e.password = "Password required";
    else if (password.length < 8) e.password = "At least 8 characters";
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  }

  const touch = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const errs  = validate();
  const cls   = (f) => {
    const base = "w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border";
    return touched[f] && errs[f]
      ? `${base} border-red-500/50 focus:border-red-500/70`
      : `${base} border-white/8 focus:border-indigo-500/50 focus:bg-white/6`;
  };

  /* ── Signup submit ── */
  async function handleSignupSubmit(e) {
    e.preventDefault();
    setTouched({ fullName: true, password: true, confirm: true });
    setSubmitErr("");
    if (Object.keys(errs).length) return;

    setPhase("submitting");
    const res = await setupTeamPassword(token, fullName.trim(), password);
    if (!res.success) {
      // If account already exists, switch to login form
      if (res.error?.toLowerCase().includes("already exists")) {
        setInvite(prev => ({ ...prev, userExists: true }));
        setPhase("login_required");
        setLoginErr("An account already exists for this email. Please sign in.");
      } else {
        setPhase("signup");
        setSubmitErr(res.error || "Something went wrong.");
      }
      return;
    }

    const { accessToken, user } = res.data;
    setInMemoryToken(accessToken);
    useAuthStore.setState({ user, accessToken, isAuthenticated: true });
    router.replace(invite?.eventId ? `/events/${invite.eventId}` : "/events");
  }

  /* ── Login submit (existing account path) ── */
  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoginErr("");
    if (!loginPass) { setLoginErr("Password is required."); return; }

    setPhase("submitting");
    try {
      // Log in using the invited email + entered password
      const res = await loginFn({ email: invite.email, password: loginPass });
      if (!res || res.error) {
        setPhase("login_required");
        setLoginErr(res?.error || "Invalid password. Please try again.");
        return;
      }
      // After login the auto-link runs on the backend, linking the event_members record.
      router.replace(invite?.eventId ? `/events/${invite.eventId}` : "/events");
    } catch (err) {
      setPhase("login_required");
      setLoginErr(err?.response?.data?.message || "Login failed. Please try again.");
    }
  }

  /* ── Shared header ── */
  const eventTitle  = invite?.eventTitle  ?? invite?.event_title  ?? "an event";
  const inviterName = invite?.inviterName ?? invite?.inviter_name ?? "Someone";

  function InviteHeader({ accent = "from-indigo-600 to-purple-600" }) {
    return (
      <div className={`bg-linear-to-br ${accent} px-8 py-8 text-center`}>
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Team Invitation</p>
        <h1 className="text-xl font-black text-white tracking-tight">{eventTitle}</h1>
        <p className="text-white/60 text-sm mt-1">Invited by {inviterName}</p>
      </div>
    );
  }

  /* ── Loading ── */
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  /* ── Expired / cancelled ── */
  if (phase === "expired") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {errorMsg === "already accepted" ? "Already Accepted" : "Link Expired"}
          </h1>
          <p className="text-gray-400 text-sm">
            {errorMsg === "already accepted"
              ? "This invitation was already accepted. Sign in to access the event."
              : "This setup link has expired or been cancelled. Ask the event owner to send a new invite."}
          </p>
          <a href="/login?redirect=/dashboard" className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invitation Not Found</h1>
          <p className="text-gray-400 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  /* ── Existing account — show login form ── */
  if (phase === "login_required" || (phase === "submitting" && invite?.userExists)) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-10">
        <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full overflow-hidden">
          <InviteHeader accent="from-emerald-600 to-teal-600" />

          <div className="px-8 py-8 space-y-5">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-300 text-sm font-semibold">You already have an account</p>
                <p className="text-emerald-200/60 text-xs mt-0.5">
                  Sign in with your password for <span className="font-medium text-emerald-200">{invite?.email}</span> to join this event.
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {/* Email (read-only) */}
              <div>
                <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={invite?.email ?? ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl text-gray-400 text-sm bg-white/4 border border-white/8 cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Your password</label>
                <div className="relative">
                  <input
                    type={showLoginPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border border-white/8 focus:border-indigo-500/50 focus:bg-white/6 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {loginErr && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{loginErr}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={phase === "submitting"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {phase === "submitting"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : <><LogIn className="w-4 h-4" /> Sign in &amp; join event</>
                }
              </button>
            </form>

            <div className="text-center text-xs text-gray-600">
              <a
                href={invite?.eventId ? `/login?redirect=/events/${invite.eventId}` : "/login?redirect=/events"}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in on a different device →
              </a>
            </div>
          </div>
          <div className="px-8 pb-6 text-center text-xs text-gray-700">Powered by LiteEvent</div>
        </div>
      </div>
    );
  }

  /* ── New account — signup form ── */
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-10">
      <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full overflow-hidden">
        <InviteHeader />

        <div className="px-8 py-8 space-y-5">
          <p className="text-gray-400 text-sm text-center">
            Create your account to start managing <span className="text-indigo-400 font-semibold">{eventTitle}</span>.
          </p>

          <form onSubmit={handleSignupSubmit} className="space-y-4" noValidate>

            {/* Email (read-only from invite) */}
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={invite?.email ?? ""}
                readOnly
                className="w-full px-4 py-3 rounded-xl text-gray-400 text-sm bg-white/4 border border-white/8 cursor-not-allowed"
              />
            </div>

            {/* Full name */}
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Your full name</label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Joel Makila"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch("fullName")}
                className={cls("fullName")}
              />
              {touched.fullName && errs.fullName && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errs.fullName}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Create a password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  className={`${cls("password")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {touched.password && errs.password && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errs.password}
                </p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Confirm password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => touch("confirm")}
                className={cls("confirm")}
              />
              {touched.confirm && errs.confirm && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errs.confirm}
                </p>
              )}
            </div>

            {submitErr && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{submitErr}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={phase === "submitting"}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {phase === "submitting"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : "Create account & join event"
              }
            </button>
          </form>

          <div className="flex flex-col gap-2 text-center text-xs text-gray-600">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setPhase("login_required")}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>

        <div className="px-8 pb-6 text-center text-xs text-gray-700">Powered by LiteEvent</div>
      </div>
    </div>
  );
}

export default function TeamSetupPage() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  );
}
