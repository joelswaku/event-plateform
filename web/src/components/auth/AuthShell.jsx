"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const AVATARS = [
  { initials: "JD", color: "bg-indigo-600" },
  { initials: "AM", color: "bg-violet-600" },
  { initials: "SR", color: "bg-pink-600" },
  { initials: "KL", color: "bg-amber-600" },
];

export default function AuthShell({ children, headline, subline }) {
  return (
    <div className="min-h-screen flex bg-[#09090E]">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <Image
          src="/images/event.jpg"
          alt=""
          fill
          priority
          sizes="52vw"
          className="object-cover"
        />
        {/* Depth layers */}
        <div className="absolute inset-0 bg-linear-to-t from-[#09090E] via-[#09090E]/60 to-[#09090E]/10" />
        <div className="absolute inset-0 bg-linear-to-r from-transparent to-[#09090E]/40" />

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">MeetCraft</span>
          </Link>

          {/* Quote + social proof */}
          <div>
            <h2 className="text-[2.4rem] font-bold text-white leading-tight tracking-tight max-w-[340px]">
              {headline}
            </h2>
            <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-[300px]">
              {subline}
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {AVATARS.map(({ initials, color }, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 border-[#09090E] flex items-center justify-center text-white text-[9px] font-bold ${color}`}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs">
                Trusted by{" "}
                <span className="text-gray-200 font-semibold">2,400+</span>{" "}
                organizers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile brand */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden self-start">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">MeetCraft</span>
        </Link>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
