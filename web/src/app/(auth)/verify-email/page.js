"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const INPUT_CLASS = "w-16 h-16 text-center text-2xl font-bold rounded-xl bg-[#0a0a14] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 text-white outline-none transition-all";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Redirect if no token
  if (!token) {
    router.replace("/register");
    return null;
  }

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

  // Auto-verify when all 6 digits are filled
  useEffect(() => {
    const verificationCode = code.join("");
    if (verificationCode.length === 6 && !isLoading && !success) {
      handleSubmit({ preventDefault: () => {} });
    }
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, code: verificationCode }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Verification failed");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError("Something went wrong");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      setResendMessage(data.message);
    } catch (err) {
      setError("Failed to resend code");
    }
    setResendLoading(false);
  };

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
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
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
