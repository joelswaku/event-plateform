"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #07070f 0%, #0f0c29 50%, #07070f 100%)" }}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-100 rounded-full blur-3xl"
          style={{ background: "rgba(99,102,241,0.08)" }} />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{ background: "rgba(167,139,250,0.06)" }} />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12 group">
          <Image
            src="/lite.png"
            alt="LiteEvent"
            width={36}
            height={36}
            className="rounded-xl shadow-lg group-hover:opacity-80 transition-opacity"
          />
          <span className="text-white font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity">
            LiteEvent
          </span>
        </Link>

        {/* 404 Display */}
        <div className="relative mb-8 select-none">
          <p
            className="text-[9rem] sm:text-[11rem] font-black leading-none tracking-tighter"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(99,102,241,0.25)",
            }}
          >
            404
          </p>
          {/* Floating icon over the 404 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.22)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.18)",
              }}
            >
              <span className="text-4xl" role="img" aria-label="lost">🔍</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-3"
          style={{ color: "#fff", letterSpacing: -0.5 }}
        >
          Page not found
        </h1>
        <p
          className="text-base mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          The page you're looking for doesn't exist or has been moved.
          <br className="hidden sm:block" />
          Let's get you back on track.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              boxShadow: "0 4px 24px rgba(99,102,241,0.38)",
            }}
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { href: "/",        label: "Home"     },
            { href: "/login",   label: "Sign In"  },
            { href: "/events",  label: "My Events"},
            { href: "/settings",label: "Settings" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
