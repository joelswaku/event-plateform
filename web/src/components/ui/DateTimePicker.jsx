"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, X } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAYS         = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HOURS_12     = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES      = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function daysInMonth(y, m)      { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m)  { return new Date(y, m, 1).getDay(); }
function pad(n)                  { return String(n).padStart(2, "0"); }

function parse(value) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d)) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
}

function compose({ year, month, day, hour, minute }) {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function formatLabel(value) {
  const p = parse(value);
  if (!p) return null;
  const ampm = p.hour >= 12 ? "PM" : "AM";
  const h    = p.hour % 12 || 12;
  return {
    date:    `${MONTHS_SHORT[p.month]} ${p.day}, ${p.year}`,
    time:    `${h}:${pad(p.minute)} ${ampm}`,
    weekday: new Date(p.year, p.month, p.day).toLocaleDateString("en-US", { weekday: "short" }),
  };
}

// ── CalendarPopover ───────────────────────────────────────────────────────────
function CalendarPopover({ value, onChange, minValue, onClose }) {
  const parsed   = parse(value);
  const today    = new Date();
  const minP     = parse(minValue);

  const [view, setView] = useState({
    year:  parsed?.year  ?? today.getFullYear(),
    month: parsed?.month ?? today.getMonth(),
  });

  const [sel, setSel] = useState(parsed ?? {
    year:   today.getFullYear(),
    month:  today.getMonth(),
    day:    today.getDate(),
    hour:   12,
    minute: 0,
  });

  const [tab, setTab] = useState("date");

  // 12-hour + ampm state derived from sel.hour
  const isPM    = sel.hour >= 12;
  const hour12  = sel.hour % 12 || 12;

  const setHour12 = (h12, pm) => {
    const hour24 = pm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    setSel((s) => ({ ...s, hour: hour24 }));
  };

  const prevMonth = () => setView((v) => {
    if (v.month === 0) return { year: v.year - 1, month: 11 };
    return { ...v, month: v.month - 1 };
  });
  const nextMonth = () => setView((v) => {
    if (v.month === 11) return { year: v.year + 1, month: 0 };
    return { ...v, month: v.month + 1 };
  });

  const selectDay = (day) => {
    setSel((s) => ({ ...s, year: view.year, month: view.month, day }));
    setTab("time");
  };

  const isDayDisabled = (day) => {
    if (!minP) return false;
    return new Date(view.year, view.month, day) < new Date(minP.year, minP.month, minP.day);
  };

  const isSelected = (day) => sel.year === view.year && sel.month === view.month && sel.day === day;
  const isToday    = (day) => today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;

  const apply = () => { onChange(compose(sel)); onClose(); };

  const totalDays = daysInMonth(view.year, view.month);
  const startDay  = firstDayOfMonth(view.year, view.month);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.12),0 4px 16px rgba(0,0,0,0.07)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* accent strip */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)" }} />

      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid #f3f4f6" }}>
        {[{ id: "date", Icon: Calendar, label: "Date" }, { id: "time", Icon: Clock, label: "Time" }].map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{
              color:        tab === id ? "#6366f1" : "#9ca3af",
              borderBottom: `2px solid ${tab === id ? "#6366f1" : "transparent"}`,
              background:   tab === id ? "#fafafe" : "transparent",
            }}
          >
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── DATE TAB ── */}
        {tab === "date" && (
          <motion.div key="date" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="p-4">
            {/* month nav */}
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-bold text-gray-900">{MONTHS[view.month]} {view.year}</span>
              <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* day headers */}
            <div className="mb-2 grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">{d}</div>
              ))}
            </div>

            {/* day grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                const isSel = isSelected(day);
                const isTod = isToday(day);
                const isDis = isDayDisabled(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDis}
                    onClick={() => !isDis && selectDay(day)}
                    className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-[13px] transition-all duration-150"
                    style={{
                      background: isSel ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : isTod ? "#eef2ff" : "transparent",
                      color:      isSel ? "#fff" : isDis ? "#d1d5db" : isTod ? "#6366f1" : "#374151",
                      fontWeight: isSel || isTod ? 700 : 500,
                      cursor:     isDis ? "not-allowed" : "pointer",
                      boxShadow:  isSel ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                    }}
                    onMouseEnter={(e) => { if (!isSel && !isDis) e.currentTarget.style.background = "#f5f3ff"; }}
                    onMouseLeave={(e) => { if (!isSel && !isDis) e.currentTarget.style.background = isTod ? "#eef2ff" : "transparent"; }}
                  >
                    {day}
                    {isTod && !isSel && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── TIME TAB ── */}
        {tab === "time" && (
          <motion.div key="time" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="p-4">

            {/* selected date chip */}
            {sel.day && (
              <div
                className="mb-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold text-indigo-700"
                style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}
              >
                <Calendar size={11} />
                {MONTHS[sel.month]} {sel.day}, {sel.year}
              </div>
            )}

            {/* AM / PM toggle */}
            <div className="mb-3 flex overflow-hidden rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
              {["AM", "PM"].map((period) => {
                const active = period === (isPM ? "PM" : "AM");
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setHour12(hour12, period === "PM")}
                    className="flex-1 py-2 text-[12px] font-bold transition-all"
                    style={{
                      background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f9fafb",
                      color:      active ? "#fff" : "#9ca3af",
                      boxShadow:  active ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                    }}
                  >
                    {period}
                  </button>
                );
              })}
            </div>

            {/* Hour grid (1-12) */}
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hour</p>
            <div className="mb-3 grid grid-cols-6 gap-1.5">
              {HOURS_12.map((h) => {
                const active = hour12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour12(h, isPM)}
                    className="flex h-9 items-center justify-center rounded-xl text-[13px] font-bold transition-all"
                    style={{
                      background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f9fafb",
                      color:      active ? "#fff" : "#6b7280",
                      border:     `1px solid ${active ? "#6366f1" : "#f3f4f6"}`,
                      boxShadow:  active ? "0 4px 10px rgba(99,102,241,0.3)" : "none",
                    }}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minute grid */}
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Minute</p>
            <div className="grid grid-cols-6 gap-1.5">
              {MINUTES.map((m) => {
                const active = sel.minute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSel((s) => ({ ...s, minute: m }))}
                    className="flex h-9 items-center justify-center rounded-xl text-[13px] font-bold transition-all"
                    style={{
                      background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f9fafb",
                      color:      active ? "#fff" : "#6b7280",
                      border:     `1px solid ${active ? "#6366f1" : "#f3f4f6"}`,
                      boxShadow:  active ? "0 4px 10px rgba(99,102,241,0.3)" : "none",
                    }}
                  >
                    {pad(m)}
                  </button>
                );
              })}
            </div>

            {/* live preview */}
            <div
              className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5"
              style={{ background: "linear-gradient(135deg,#6366f112,#8b5cf608)", border: "1px solid #6366f120" }}
            >
              <Clock size={13} style={{ color: "#6366f1" }} />
              <span className="text-sm font-black text-indigo-700">
                {hour12}:{pad(sel.minute)} {isPM ? "PM" : "AM"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #f3f4f6" }}>
        <button type="button" onClick={onClose} className="rounded-xl px-3 py-1.5 text-[12px] font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!sel?.day}
          className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[12px] font-bold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
        >
          <Check size={12} /> Confirm
        </button>
      </div>
    </motion.div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export default function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  minValue,
  error,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref   = useRef(null);
  const label = formatLabel(value);

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
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none"
        style={{
          background:  disabled ? "#f9fafb" : open ? "#fafafe" : "#ffffff",
          border:      `1.5px solid ${error ? "#f87171" : open ? "#6366f1" : "#e5e7eb"}`,
          boxShadow:   open && !error ? "0 0 0 3px rgba(99,102,241,0.1),0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
          cursor:      disabled ? "not-allowed" : "pointer",
        }}
      >
        {/* icon */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{
            background: open ? "#eef2ff" : error ? "#fef2f2" : "#f9fafb",
            border:     `1px solid ${open ? "#c7d2fe" : error ? "#fecaca" : "#f3f4f6"}`,
          }}
        >
          <Calendar size={13} style={{ color: open ? "#6366f1" : error ? "#f87171" : "#9ca3af" }} />
        </div>

        {/* label */}
        {label ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[13px] font-bold text-gray-900">{label.date}</span>
            <span className="shrink-0 text-[11px] font-semibold text-gray-400">{label.weekday}</span>
            <span
              className="ml-auto shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold"
              style={{ background: "#eef2ff", color: "#6366f1" }}
            >
              {label.time}
            </span>
          </div>
        ) : (
          <span className="flex-1 text-left text-[13px] text-gray-400">{placeholder}</span>
        )}

        {/* clear / clock */}
        {value && !disabled ? (
          <div
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && clear(e)}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-400"
          >
            <X size={11} />
          </div>
        ) : (
          !label && <Clock size={13} className="shrink-0 text-gray-300" />
        )}
      </button>

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

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
