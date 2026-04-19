"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ShareEventCard({ slug, customDomain }) {
  const [copied, setCopied] = useState(false);

  // const publicUrl = customDomain
  //   ? `https://${customDomain}`
  //   : `${window.location.origin}/events/${slug}`;

  const publicUrl = customDomain
  ? `https://${customDomain}`
  : `${typeof window !== "undefined" ? window.location.origin : ""}/e/${slug}`;


  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
      <h2 className="text-lg font-semibold">Share event</h2>
      <p className="mt-2 text-sm text-gray-500">
        Share your public event link with guests.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          readOnly
          value={publicUrl}
          className="w-full rounded-2xl border px-4 py-3 text-sm"
        />
        <button
          onClick={copyLink}
          className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>

   <Link href={publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white">open</Link >
      
      </div>
    </div>
  );
}