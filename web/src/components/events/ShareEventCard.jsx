"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ShareEventCard({ slug, customDomain }) {
  const [copied, setCopied] = useState(false);

  const publicUrl = customDomain
    ? `https://${customDomain}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/e/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Gradient header strip */}
      <div className="bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-white/90" />
            <p className="text-sm font-semibold text-white">Share event</p>
          </div>
          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-white/80">Live</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Share this link so guests can view and RSVP to your event.
        </p>

        <div className="flex gap-2">
          {/* URL display */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <span className="truncate font-mono text-xs text-gray-600 dark:text-gray-300">
              {publicUrl || "—"}
            </span>
          </div>

          {/* Copy */}
          <button
            onClick={copyLink}
            title="Copy link"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-medium transition active:scale-95 ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {/* Open */}
          <Link
            href={publicUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Open event page"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
