"use client";

import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { useBuilderStore } from "@/store/builder.store";

const btn =
  "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-40";

const DEVICES = [
  { id: "desktop", Icon: ComputerDesktopIcon, label: "Desktop" },
  { id: "tablet",  Icon: DeviceTabletIcon,    label: "Tablet"  },
  { id: "mobile",  Icon: DevicePhoneMobileIcon, label: "Mobile" },
];

export default function BuilderTopbar({ eventId, device, onDeviceChange }) {
  const saveStatus    = useBuilderStore((s) => s.saveStatus);
  const publishPage   = useBuilderStore((s) => s.publishPage);
  const undo          = useBuilderStore((s) => s.undo);
  const redo          = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s._historyIndex > 0);
  const canRedo = useBuilderStore((s) => s._historyIndex < s._history.length - 1);

  return (
    <div
      className="flex h-14 shrink-0 items-center justify-between px-4 gap-4"
      style={{
        background: "#16181c",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left: device switcher + undo/redo */}
      <div className="flex items-center gap-2">
        {/* Device switcher */}
        <div
          className="flex items-center rounded-md overflow-hidden"
          style={{
            background: "#1e2026",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {DEVICES.map(({ id, Icon, label }) => {
            const active = device === id;
            return (
              <button
                key={id}
                onClick={() => onDeviceChange(id)}
                title={label}
                className={`${btn} h-8 gap-1.5 px-3`}
                style={{
                  background: active ? "#252830" : "transparent",
                  color: active ? "#f0f1f3" : "#8b8f9a",
                  fontSize: 11,
                  borderRadius: 0,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Undo / Redo */}
        <div
          className="flex items-center rounded-md overflow-hidden"
          style={{
            background: "#1e2026",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`${btn} h-8 w-8`}
            style={{
              background: "transparent",
              color: canUndo ? "#8b8f9a" : "#3a3d46",
              borderRadius: 0,
            }}
          >
            <UndoIcon />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`${btn} h-8 w-8`}
            style={{
              background: "transparent",
              color: canRedo ? "#8b8f9a" : "#3a3d46",
              borderRadius: 0,
            }}
          >
            <RedoIcon />
          </button>
        </div>
      </div>

      {/* Right: save status + publish */}
      <div className="flex items-center gap-3">
        <SaveStatusBadge status={saveStatus} />

        <button
          onClick={() => publishPage(eventId)}
          className={`${btn} h-8 px-4`}
          style={{
            background: "#6c6fee",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Publish
        </button>
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }) {
  const variants = {
    saving: { label: "Saving…", color: "#8b8f9a" },
    saved:  { label: "Saved ✓", color: "#3ecf8e" },
    error:  { label: "Error",   color: "#f87171" },
  };

  const v = variants[status];
  if (!v) return null;

  return (
    <span style={{ fontSize: 11, color: v.color, transition: "color 0.2s" }}>
      {v.label}
    </span>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}
