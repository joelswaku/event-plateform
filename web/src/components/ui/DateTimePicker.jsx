"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, X, ChevronDown } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const DAYS         = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HOURS_12     = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES      = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// Design tokens — dark theme matching app
const BG       = "#0d0d1c";
const BG_CARD  = "#111127";
const BG_EL    = "#16162a";
const BORDER   = "rgba(255,255,255,0.08)";
const BORDER_A = "rgba(99,102,241,0.45)";
const T_WHITE  = "#ffffff";
const T_MUTED  = "rgba(255,255,255,0.42)";
const T_HINT   = "rgba(255,255,255,0.22)";
const INDIGO   = "#6366f1";
const VIOLET   = "#8b5cf6";
const GRAD     = `linear-gradient(135deg, ${INDIGO}, ${VIOLET})`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysInMonth(y, m)     { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }
function pad(n)                 { return String(n).padStart(2, "0"); }

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

// ── Year picker ───────────────────────────────────────────────────────────────
function YearPicker({ currentYear, onSelect }) {
  const startYear = currentYear - 5;
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);
  return (
    <motion.div
      key="year"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="grid grid-cols-3 gap-1.5 p-4"
    >
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onSelect(y)}
          className="flex h-9 items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-150"
          style={{
            background: y === currentYear ? GRAD : BG_EL,
            color:      y === currentYear ? "#fff" : T_MUTED,
            border:     `1px solid ${y === currentYear ? BORDER_A : BORDER}`,
            boxShadow:  y === currentYear ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
          }}
        >
          {y}
        </button>
      ))}
    </motion.div>
  );
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
  const [tab,      setTab]      = useState("date");
  const [showYear, setShowYear] = useState(false);
  const [dir,      setDir]      = useState(1); // animation direction

  const isPM   = sel.hour >= 12;
  const hour12 = sel.hour % 12 || 12;

  const setHour12 = (h12, pm) => {
    const hour24 = pm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    setSel((s) => ({ ...s, hour: hour24 }));
  };

  const prevMonth = () => {
    setDir(-1);
    setShowYear(false);
    setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  };
  const nextMonth = () => {
    setDir(1);
    setShowYear(false);
    setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  };

  const selectDay = (day) => {
    setSel((s) => ({ ...s, year: view.year, month: view.month, day }));
    setTimeout(() => setTab("time"), 180);
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
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 top-full z-50 mt-2 w-78 overflow-hidden rounded-2xl"
      style={{
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top accent */}
      <div className="h-0.5 w-full" style={{ background: GRAD }} />

      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {[{ id: "date", Icon: Calendar, label: "Date" }, { id: "time", Icon: Clock, label: "Time" }].map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
            style={{
              color:       tab === id ? INDIGO : T_MUTED,
              borderBottom: `2px solid ${tab === id ? INDIGO : "transparent"}`,
              background:  tab === id ? "rgba(99,102,241,0.06)" : "transparent",
            }}
          >
            <Icon size={11} strokeWidth={2.5} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>

        {/* ── DATE TAB ── */}
        {tab === "date" && (
          <motion.div key="date" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>

            {/* Month / Year nav */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-white/8"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <ChevronLeft size={14} style={{ color: T_MUTED }} />
              </button>

              {/* Clickable month/year label → opens year picker */}
              <button
                type="button"
                onClick={() => setShowYear((v) => !v)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-[14px] font-bold transition-all hover:bg-white/5"
                style={{ color: T_WHITE }}
              >
                {MONTHS[view.month]} {view.year}
                <ChevronDown
                  size={13}
                  style={{
                    color:    T_MUTED,
                    transform: showYear ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-white/8"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <ChevronRight size={14} style={{ color: T_MUTED }} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {showYear ? (
                <YearPicker
                  key="year-picker"
                  currentYear={view.year}
                  onSelect={(y) => { setView((v) => ({ ...v, year: y })); setShowYear(false); }}
                />
              ) : (
                <motion.div
                  key={`${view.year}-${view.month}`}
                  initial={{ opacity: 0, x: dir * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -20 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 pb-4"
                >
                  {/* Day headers */}
                  <div className="mb-1.5 grid grid-cols-7">
                    {DAYS.map((d) => (
                      <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide" style={{ color: T_HINT }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-y-0.5">
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
                          className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-semibold transition-all duration-150"
                          style={{
                            background: isSel ? GRAD : isTod ? "rgba(99,102,241,0.12)" : "transparent",
                            color:      isSel ? "#fff" : isDis ? T_HINT : isTod ? INDIGO : T_WHITE,
                            fontWeight: isSel || isTod ? 800 : 500,
                            cursor:     isDis ? "not-allowed" : "pointer",
                            boxShadow:  isSel ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                            border:     isTod && !isSel ? `1px solid ${BORDER_A}` : "1px solid transparent",
                            opacity:    isDis ? 0.35 : 1,
                          }}
                          onMouseEnter={(e) => { if (!isSel && !isDis) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={(e) => {
                            if (!isSel && !isDis) e.currentTarget.style.background = isTod ? "rgba(99,102,241,0.12)" : "transparent";
                          }}
                        >
                          {day}
                          {isTod && !isSel && (
                            <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: INDIGO }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── TIME TAB ── */}
        {tab === "time" && (
          <motion.div key="time" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="p-4 space-y-3">

            {/* Selected date chip */}
            {sel.day && (
              <div
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold"
                style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${BORDER_A}`, color: "#a5b4fc" }}
              >
                <Calendar size={11} strokeWidth={2.5} />
                {MONTHS[sel.month]} {sel.day}, {sel.year}
              </div>
            )}

            {/* AM / PM */}
            <div className="flex overflow-hidden rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              {["AM", "PM"].map((period) => {
                const active = period === (isPM ? "PM" : "AM");
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setHour12(hour12, period === "PM")}
                    className="flex-1 py-2 text-[12px] font-bold transition-all duration-200"
                    style={{
                      background: active ? GRAD : BG_EL,
                      color:      active ? "#fff" : T_MUTED,
                      boxShadow:  active ? "0 2px 10px rgba(99,102,241,0.35)" : "none",
                    }}
                  >
                    {period}
                  </button>
                );
              })}
            </div>

            {/* Hour grid */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: T_HINT }}>Hour</p>
              <div className="grid grid-cols-6 gap-1">
                {HOURS_12.map((h) => {
                  const active = hour12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour12(h, isPM)}
                      className="flex h-9 items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-150"
                      style={{
                        background: active ? GRAD : BG_EL,
                        color:      active ? "#fff" : T_MUTED,
                        border:     `1px solid ${active ? BORDER_A : BORDER}`,
                        boxShadow:  active ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = BG_EL; }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute grid */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: T_HINT }}>Minute</p>
              <div className="grid grid-cols-6 gap-1">
                {MINUTES.map((m) => {
                  const active = sel.minute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSel((s) => ({ ...s, minute: m }))}
                      className="flex h-9 items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-150"
                      style={{
                        background: active ? GRAD : BG_EL,
                        color:      active ? "#fff" : T_MUTED,
                        border:     `1px solid ${active ? BORDER_A : BORDER}`,
                        boxShadow:  active ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = BG_EL; }}
                    >
                      {pad(m)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview */}
            <div
              className="flex items-center justify-center gap-2 rounded-xl py-2.5"
              style={{ background: "rgba(99,102,241,0.08)", border: `1px solid rgba(99,102,241,0.2)` }}
            >
              <Clock size={13} style={{ color: INDIGO }} strokeWidth={2.5} />
              <span className="text-sm font-black" style={{ color: "#a5b4fc" }}>
                {hour12}:{pad(sel.minute)} {isPM ? "PM" : "AM"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-[12px] font-semibold transition-all hover:bg-white/6"
          style={{ color: T_MUTED, border: `1px solid ${BORDER}` }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!sel?.day}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold text-white transition-all disabled:opacity-40"
          style={{ background: GRAD, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
        >
          <Check size={13} strokeWidth={3} />
          Confirm
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

      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none bg-white dark:bg-transparent"
        style={{
          border:      `2px solid ${error ? "#f87171" : open ? INDIGO : "rgb(209, 213, 219)"}`,
          boxShadow:   open && !error ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
          cursor:      disabled ? "not-allowed" : "pointer",
          opacity:     disabled ? 0.5 : 1,
        }}
      >
        {/* Calendar icon */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          style={open ? {
            background: "rgba(99,102,241,0.1)",
            borderColor: BORDER_A,
          } : {}}
        >
          <Calendar size={13} className={`${open ? 'text-indigo-600 dark:text-indigo-400' : error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} strokeWidth={2} />
        </div>

        {/* Value or placeholder */}
        {label ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">{label.date}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{label.weekday}</p>
            </div>
            <div
              className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-black bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
            >
              {label.time}
            </div>
          </div>
        ) : (
          <span className="flex-1 text-left text-[13px] text-gray-400 dark:text-gray-500">{placeholder}</span>
        )}

        {/* Clear / chevron */}
        {value && !disabled ? (
          <div
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && clear(e)}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all hover:bg-red-500/15 text-gray-400 dark:text-gray-500"
          >
            <X size={11} strokeWidth={2.5} />
          </div>
        ) : (
          <ChevronDown
            size={14}
            className="text-gray-400 dark:text-gray-500"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        )}
      </button>

      {/* ── Popover ── */}
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

      {/* Error */}
      {error && (
        <p className="mt-1.5 text-[11px] font-medium" style={{ color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}
