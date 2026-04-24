"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, Check } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function pad(n) {
  return String(n).padStart(2, "0");
}

/** Parse "YYYY-MM-DDTHH:mm" or Date → { year, month, day, hour, minute } */
function parse(value) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d)) return null;
  return {
    year:   d.getFullYear(),
    month:  d.getMonth(),
    day:    d.getDate(),
    hour:   d.getHours(),
    minute: d.getMinutes(),
  };
}

/** Compose { year, month, day, hour, minute } → "YYYY-MM-DDTHH:mm" */
function compose({ year, month, day, hour, minute }) {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** Human-readable label */
function formatLabel(value) {
  if (!value) return null;
  const p = parse(value);
  if (!p) return null;
  const d = new Date(p.year, p.month, p.day);
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const ampm = p.hour >= 12 ? "PM" : "AM";
  const h = p.hour % 12 || 12;
  return `${dateStr} · ${h}:${pad(p.minute)} ${ampm}`;
}

// ── Hours / minutes arrays ────────────────────────────────────────────────────
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// ── Calendar popover ──────────────────────────────────────────────────────────
function CalendarPopover({ value, onChange, minValue, onClose }) {
  const parsed   = parse(value);
  const today    = new Date();
  const minParsed = parse(minValue);

  const [view, setView] = useState({
    year:  parsed?.year  ?? today.getFullYear(),
    month: parsed?.month ?? today.getMonth(),
  });
  const [selected, setSelected] = useState(parsed ?? {
    year:  today.getFullYear(),
    month: today.getMonth(),
    day:   today.getDate(),
    hour:  12,
    minute: 0,
  });
  const [tab, setTab] = useState("date"); // "date" | "time"

  const prevMonth = () => setView((v) => {
    const m = v.month === 0 ? 11 : v.month - 1;
    const y = v.month === 0 ? v.year - 1 : v.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setView((v) => {
    const m = v.month === 11 ? 0 : v.month + 1;
    const y = v.month === 11 ? v.year + 1 : v.year;
    return { year: y, month: m };
  });

  const selectDay = (day) => {
    const next = { ...selected, year: view.year, month: view.month, day };
    setSelected(next);
    setTab("time");
  };

  const isDayDisabled = (day) => {
    if (!minParsed) return false;
    const d = new Date(view.year, view.month, day);
    const m = new Date(minParsed.year, minParsed.month, minParsed.day);
    return d < m;
  };

  const isSelected = (day) =>
    selected &&
    selected.year === view.year &&
    selected.month === view.month &&
    selected.day === day;

  const isToday = (day) =>
    today.getFullYear() === view.year &&
    today.getMonth()    === view.month &&
    today.getDate()     === day;

  const apply = () => {
    onChange(compose(selected));
    onClose();
  };

  const totalDays  = daysInMonth(view.year, view.month);
  const startDay   = firstDayOfMonth(view.year, view.month);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 top-full z-50 mt-2 w-[300px] overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: "#fff", border: "1px solid #e5e7eb" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {["date", "time"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              color: tab === t ? "#4F46E5" : "#9CA3AF",
              borderBottom: tab === t ? "2px solid #4F46E5" : "2px solid transparent",
            }}
          >
            {t === "date" ? <Calendar size={12} /> : <Clock size={12} />}
            {t}
          </button>
        ))}
      </div>

      {/* Date view */}
      {tab === "date" && (
        <div className="p-4">
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-semibold text-gray-900">
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const sel      = isSelected(day);
              const tod      = isToday(day);
              const disabled = isDayDisabled(day);
              return (
                <button
                  key={day}
                  onClick={() => !disabled && selectDay(day)}
                  disabled={disabled}
                  className="relative flex h-8 w-8 mx-auto items-center justify-center rounded-full text-[12px] font-medium transition"
                  style={{
                    background:  sel ? "#4F46E5" : "transparent",
                    color:       sel ? "#fff" : disabled ? "#D1D5DB" : tod ? "#4F46E5" : "#374151",
                    fontWeight:  tod && !sel ? 700 : undefined,
                    cursor:      disabled ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!sel && !disabled) e.currentTarget.style.background = "#EEF2FF";
                  }}
                  onMouseLeave={(e) => {
                    if (!sel) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {day}
                  {tod && !sel && (
                    <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time view */}
      {tab === "time" && (
        <div className="p-4">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {selected.day
              ? `${MONTHS[selected.month]} ${selected.day}, ${selected.year}`
              : "Select a date first"}
          </p>

          <div className="flex items-center justify-center gap-3">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Hour</span>
              <div
                className="h-44 overflow-y-auto rounded-xl"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", scrollSnapType: "y mandatory" }}
              >
                {HOURS.map((h) => {
                  const ampm = h >= 12 ? "PM" : "AM";
                  const h12  = h % 12 || 12;
                  const isSel = selected.hour === h;
                  return (
                    <button
                      key={h}
                      onClick={() => setSelected((s) => ({ ...s, hour: h }))}
                      className="flex w-16 items-center justify-center gap-1 py-2 text-[12px] transition"
                      style={{
                        scrollSnapAlign: "start",
                        background: isSel ? "#4F46E5" : "transparent",
                        color:      isSel ? "#fff"    : "#374151",
                        fontWeight: isSel ? 700 : 400,
                      }}
                    >
                      {h12}
                      <span className="text-[9px] opacity-60">{ampm}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="mt-4 text-xl font-bold text-gray-300">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Min</span>
              <div
                className="h-44 overflow-y-auto rounded-xl"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", scrollSnapType: "y mandatory" }}
              >
                {MINUTES.map((m) => {
                  const isSel = selected.minute === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelected((s) => ({ ...s, minute: m }))}
                      className="flex w-16 items-center justify-center py-2 text-[12px] transition"
                      style={{
                        scrollSnapAlign: "start",
                        background: isSel ? "#4F46E5" : "transparent",
                        color:      isSel ? "#fff"    : "#374151",
                        fontWeight: isSel ? 700 : 400,
                      }}
                    >
                      {pad(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-3 rounded-xl py-2 text-center text-[12px] font-semibold text-indigo-700"
            style={{ background: "#EEF2FF" }}>
            {(() => {
              const h    = selected.hour % 12 || 12;
              const ampm = selected.hour >= 12 ? "PM" : "AM";
              return `${h}:${pad(selected.minute)} ${ampm}`;
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <button
          onClick={onClose}
          className="text-[12px] text-gray-400 hover:text-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={apply}
          disabled={!selected.day}
          className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[12px] font-bold text-white transition disabled:opacity-40"
          style={{ background: "#4F46E5" }}
        >
          <Check size={12} />
          Confirm
        </button>
      </div>
    </motion.div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
/**
 * DateTimePicker
 *
 * Props:
 *   value     — ISO datetime string "YYYY-MM-DDTHH:mm" or ""
 *   onChange  — (value: string) => void
 *   placeholder — string
 *   minValue  — ISO datetime string (optional, disables earlier dates)
 *   error     — string | null
 *   disabled  — bool
 */
export default function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  minValue,
  error,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const label = formatLabel(value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const clear = useCallback((e) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none"
        style={{
          background:   disabled ? "#F9FAFB" : "#fff",
          borderColor:  error  ? "#F87171"
                      : open   ? "#6366F1"
                      : "#E5E7EB",
          boxShadow:   open && !error ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
          color:        label ? "#111827" : "#9CA3AF",
          cursor:       disabled ? "not-allowed" : "pointer",
        }}
      >
        <Calendar
          size={15}
          className="shrink-0 transition-colors"
          style={{ color: open ? "#6366F1" : error ? "#F87171" : "#9CA3AF" }}
        />
        <span className="flex-1 text-left truncate text-[13px]">
          {label || placeholder}
        </span>
        {value && !disabled && (
          <span
            onClick={clear}
            className="ml-auto shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition text-[10px] font-bold leading-none"
          >
            ✕
          </span>
        )}
        {!value && (
          <Clock size={13} className="shrink-0 text-gray-300" />
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <CalendarPopover
            value={value}
            onChange={onChange}
            minValue={minValue}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}
