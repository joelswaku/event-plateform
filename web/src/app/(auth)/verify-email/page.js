"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const INPUT_CLASS = "w-16 h-16 text-center text-2xl font-bold rounded-xl bg-[#0a0a14] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 text-white outline-none transition-all";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";
  const verifyEmail = useAuthStore((state) => state.verifyEmail);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [token] = useState(() => {
    if (typeof window === "undefined") return urlToken;
    if (urlToken) {
      window.sessionStorage.setItem("verify_token", urlToken);
      return urlToken;
    }
    return window.sessionStorage.getItem("verify_token") || "";
  });

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const lastAutoSubmittedCode = useRef("");

  // Return safely to registration only if neither the URL nor this browser tab
  // has the verification token.
  useEffect(() => {
    if (token) return;
    const redirectTimer = window.setTimeout(() => router.replace("/register"), 0);
    return () => window.clearTimeout(redirectTimer);
  }, [router, token]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(newCode);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await verifyEmail({ token, code: verificationCode });

      if (!result.success) {
        setError(result.message || "Verification failed");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      // Clear token from sessionStorage after successful verification
      sessionStorage.removeItem("verify_token");

      // Single reliable redirect after showing success message
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      setError("Something went wrong");
      setIsLoading(false);
    }
  }, [code, token, verifyEmail]);

  // Auto-verify when all 6 digits are filled.
  useEffect(() => {
    const verificationCode = code.join("");
    if (verificationCode.length < 6) {
      lastAutoSubmittedCode.current = "";
      return;
    }

    if (
      token &&
      verificationCode !== lastAutoSubmittedCode.current &&
      !isLoading &&
      !success
    ) {
      const submitTimer = window.setTimeout(() => {
        if (lastAutoSubmittedCode.current === verificationCode) return;
        lastAutoSubmittedCode.current = verificationCode;
        void handleSubmit({ preventDefault: () => {} });
      }, 0);
      return () => window.clearTimeout(submitTimer);
    }
  }, [code, handleSubmit, isLoading, success, token]);

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const res = await api.post("/auth/resend-verification-code", { token });
      setResendMessage(res.data?.message || "Verification code sent.");
    } catch (err) {
      setError("Failed to resend code");
    }
    setResendLoading(false);
  };

  if (!token) return null;

  if (success) {
    return (
      <AuthShell headline="Email verified!" subline="Your account is ready.">
        <div className="text-center py-8">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-white/45 text-sm">Redirecting to dashboard...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell headline="Verify your email" subline="Enter the code we sent to your inbox.">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Check your email</h1>
        <p className="text-white/45 text-sm mt-1">
          Enter the 6-digit code we sent to your email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 justify-center">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={INPUT_CLASS}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-[#ef4444] text-sm">{error}</p>
          </div>
        )}

        {resendMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#10b981]/20 bg-[#10b981]/10 px-4 py-3">
            <Mail className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
            <p className="text-[#10b981] text-sm">{resendMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.join("").length !== 6}
          className="w-full py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-[#6366f1]/20"
        >
          {isLoading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-[#6366f1] hover:text-[#818cf8] font-semibold disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend code"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Wrong email? <Link href="/register" className="text-[#6366f1] font-bold">Start over</Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailForm /></Suspense>;
}
