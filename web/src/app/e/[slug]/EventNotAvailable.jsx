"use client";

import Link from "next/link";

const COPY = {
  private: {
    icon: "🔒",
    title: "This event is private",
    body: "The organiser has kept this event private. If you were invited, check your email for your personal link — it contains a unique token that unlocks the page.",
  },
  not_published: {
    icon: "🚧",
    title: "This event isn't live yet",
    body: "The organiser is still setting things up. Check back soon — it should be available shortly.",
  },
  invalid_token: {
    icon: "⛔",
    title: "Invalid invitation link",
    body: "This invitation link has expired, already been used, or doesn't match this event. Check your email for the correct link or contact the organiser.",
  },
};

export default function EventNotAvailable({ reason }) {
  const copy = COPY[reason] ?? {
    icon: "🚧",
    title: "This event isn't available",
    body: "It may be private or the organizer hasn't published it yet.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon bubble */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
          {copy.icon}
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {copy.title}
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {copy.body}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Action */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
