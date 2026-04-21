"use client";

import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useBuilderStore } from "@/store/builder.store";
import { useRouter } from "next/navigation";

const DEVICES = [
  { id: "desktop", Icon: ComputerDesktopIcon,    label: "Desktop" },
  { id: "tablet",  Icon: DeviceTabletIcon,        label: "Tablet"  },
  { id: "mobile",  Icon: DevicePhoneMobileIcon,   label: "Mobile"  },
];

export default function BuilderTopbar({ eventId, device, onDeviceChange }) {
  const router       = useRouter();
  const saveStatus   = useBuilderStore((s) => s.saveStatus);
  const publishPage  = useBuilderStore((s) => s.publishPage);
  const undo         = useBuilderStore((s) => s.undo);
  const redo         = useBuilderStore((s) => s.redo);
  const canUndo      = useBuilderStore((s) => s._historyIndex > 0);
  const canRedo      = useBuilderStore((s) => s._historyIndex < s._history.length - 1);
  const event        = useBuilderStore((s) => s.builder?.event);

  return (
    <div
      className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 lg:px-4"
      style={{ background: "#16181c", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* ── Left ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">

        {/* Back button — mobile/tablet only */}
        <button
          onClick={() => router.push(`/events/${eventId}`)}
          className="flex lg:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "#8b8f9a" }}
          title="Back to event"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>

        {/* Event name — mobile/tablet only */}
        <span
          className="flex lg:hidden min-w-0 truncate text-sm font-semibold text-white/80"
          style={{ maxWidth: 140 }}
        >
          {event?.title || "Page Builder"}
        </span>

        {/* Device switcher — hidden on small phones, visible sm+ */}
        <div
          className="hidden sm:flex items-center rounded-lg overflow-hidden"
          style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {DEVICES.map(({ id, Icon, label }) => {
            const active = device === id;
            return (
              <button
                key={id}
                onClick={() => onDeviceChange(id)}
                title={label}
                className="flex h-9 items-center gap-1.5 px-3 transition-colors"
                style={{
                  background: active ? "#252830" : "transparent",
                  color: active ? "#f0f1f3" : "#8b8f9a",
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  borderRadius: 0,
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Undo / Redo — desktop only (mobile has them in bottom bar) */}
        <div
          className="hidden lg:flex items-center rounded-lg overflow-hidden"
          style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="flex h-9 w-9 items-center justify-center transition-colors"
            style={{ background: "transparent", color: canUndo ? "#8b8f9a" : "#3a3d46" }}
          >
            <UndoIcon />
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)" }} />
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="flex h-9 w-9 items-center justify-center transition-colors"
            style={{ background: "transparent", color: canRedo ? "#8b8f9a" : "#3a3d46" }}
          >
            <RedoIcon />
          </button>
        </div>
      </div>

      {/* ── Right ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <SaveStatusBadge status={saveStatus} />
        <button
          onClick={() => publishPage(eventId)}
          className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: "#6c6fee", color: "#fff" }}
        >
          <span className="hidden xs:inline">Publish</span>
          <PublishIcon />
        </button>
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }) {
  const map = {
    saving: { label: "Saving…", color: "#8b8f9a" },
    saved:  { label: "Saved ✓", color: "#3ecf8e" },
    error:  { label: "Error",   color: "#f87171" },
  };
  const v = map[status];
  if (!v) return null;
  return (
    <span
      className="hidden sm:inline text-[11px] font-medium transition-colors duration-200"
      style={{ color: v.color }}
    >
      {v.label}
    </span>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
  );
}
