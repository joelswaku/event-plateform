"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell } from "lucide-react";

const GROUPS = [
  {
    label: "Events",
    items: [
      { id: "event_reminders",  label: "Event reminders",   desc: "Get reminded before your events go live", default: true },
      { id: "guest_activity",   label: "Guest activity",    desc: "RSVP confirmations and guest updates",     default: true },
      { id: "ticket_updates",   label: "Ticket updates",    desc: "Ticket purchases and check-in activity",   default: true },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "marketing",       label: "Tips & updates",    desc: "Product news, tips, and feature announcements", default: false },
      { id: "security_alerts", label: "Security alerts",   desc: "Sign-in activity and security notices",          default: true, locked: true },
    ],
  },
];

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: on ? "#6366f1" : "rgba(255,255,255,0.12)" }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(20px)" : "translateX(4px)" }}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  const initial = {};
  GROUPS.forEach((g) => g.items.forEach((i) => { initial[i.id] = i.default; }));
  const [prefs, setPrefs] = useState(initial);

  function toggle(id) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-(--bg-surface) transition hover:bg-(--bg-elevated)"
        >
          <ChevronLeft className="h-4 w-4 text-(--text-muted)" />
        </button>
        <div>
          <h1 className="text-lg font-black text-(--text-primary)">Notifications</h1>
          <p className="text-xs text-(--text-muted)">Control which emails and alerts you receive</p>
        </div>
      </div>

      {/* Icon hero */}
      <div className="flex flex-col items-center gap-2 py-2">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          <Bell className="h-8 w-8" style={{ color: "#6366f1" }} />
        </div>
      </div>

      {/* Groups */}
      {GROUPS.map((group) => (
        <div key={group.label} className="rounded-3xl border border-border bg-(--bg-surface) overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">
            {group.label}
          </p>
          {group.items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-(--text-primary)">{item.label}</p>
                <p className="mt-0.5 text-xs text-(--text-muted)">{item.desc}</p>
                {item.locked && (
                  <p className="mt-0.5 text-[10px] text-indigo-400">Always enabled for your security</p>
                )}
              </div>
              <Toggle on={prefs[item.id]} onChange={() => toggle(item.id)} disabled={item.locked} />
            </div>
          ))}
        </div>
      ))}

      <p className="text-center text-xs text-(--text-muted)">
        Preference changes take effect immediately. We'll never spam you.
      </p>
    </div>
  );
}
