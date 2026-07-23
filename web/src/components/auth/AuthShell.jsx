"use client";

import Link from "next/link";
import { Zap, CalendarCheck, Ticket, Users } from "lucide-react";

const STATS = [
  { icon: CalendarCheck, label: "Events created",    value: "12,400+" },
  { icon: Ticket,        label: "Tickets sold",      value: "890K+"   },
  { icon: Users,         label: "Active organizers", value: "2,400+" },
];

const AVATARS = [
  { initials: "JD", color: "bg-indigo-500" },
  { initials: "AM", color: "bg-violet-500" },
  { initials: "SR", color: "bg-pink-500"   },
  { initials: "KL", color: "bg-amber-500"  },
];

export default function AuthShell({ children, headline, subline }) {
  return (
    <div className="min-h-screen flex bg-[#09090E]">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-shrink-0">

        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1040] to-[#24243e]" />

        {/* Accent layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 via-transparent to-violet-950/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-pink-600/5" />

        {/* Decorative glows */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Floating decorative cards */}
        <div className="absolute top-[18%] right-[8%] w-52 rotate-6 opacity-70">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-white/70 text-xs font-medium">New booking</span>
            </div>
            <p className="text-white text-sm font-semibold">Summer Music Fest</p>
            <p className="text-gray-400 text-xs mt-0.5">VIP × 2 — $240</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[78%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">78% sold · 44 left</p>
          </div>
        </div>

        <div className="absolute bottom-[22%] right-[10%] w-44 -rotate-3 opacity-60">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Revenue today</p>
            <p className="text-white text-xl font-bold">$8,420</p>
            <p className="text-emerald-400 text-xs font-medium mt-1">↑ 24% vs yesterday</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-10 h-10 rounded-2xl bg-[#6366f1] flex items-center justify-center shadow-lg shadow-[#6366f1]/50 group-hover:bg-[#818cf8] transition-colors">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">LiteEvent</span>
          </Link>

          {/* Main copy */}
          <div className="space-y-8">
            <div>
              <h2 className="text-[2.6rem] font-extrabold text-white leading-[1.15] tracking-tight max-w-[360px]">
                {headline}
              </h2>
              <p className="text-gray-400 mt-4 text-[15px] leading-relaxed max-w-[320px]">
                {subline}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 space-y-2">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <p className="text-white font-bold text-lg leading-none">{value}</p>
                  <p className="text-gray-500 text-[11px] leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {AVATARS.map(({ initials, color }, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-[#09090E] flex items-center justify-center text-white text-[10px] font-bold ${color}`}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-400 text-xs">
                  Loved by <span className="text-gray-200 font-semibold">2,400+</span> organizers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14 overflow-y-auto relative">

        {/* Gradient background - same as mobile app */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1040] to-[#24243e]" />

        {/* Glow orbs - same as mobile app */}
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-[#4f46e5]/18 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-56 h-56 bg-[#7c3aed]/18 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-[#db2777]/18 rounded-full blur-3xl" />

        {/* Grid overlay - same as mobile app */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Mobile brand */}
        <Link href="/" className="relative z-10 flex items-center gap-2 mb-10 lg:hidden self-start">
          <div className="w-10 h-10 rounded-2xl bg-[#6366f1] flex items-center justify-center shadow-lg shadow-[#6366f1]/50">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-white font-black text-base tracking-tight">LiteEvent</span>
        </Link>

        <div className="relative z-10 w-full max-w-100">{children}</div>
      </div>
    </div>
  );
}
