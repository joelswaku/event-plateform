"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutDashboard, Activity, CalendarDays, Building2, Users,
  DollarSign, TrendingUp, ShieldAlert, Sparkles, Heart, ToggleRight,
  ClipboardList, ArrowRight, Zap, X,
} from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const QUICK = [
  { href: "/super-admin",               label: "Dashboard",      Icon: LayoutDashboard, tag: "page" },
  { href: "/super-admin/activity",      label: "Live Activity",  Icon: Activity,        tag: "page" },
  { href: "/super-admin/events",        label: "All Events",     Icon: CalendarDays,    tag: "page" },
  { href: "/super-admin/organizations", label: "Organizations",  Icon: Building2,       tag: "page" },
  { href: "/super-admin/users",         label: "Users",          Icon: Users,           tag: "page" },
  { href: "/super-admin/revenue",       label: "Revenue",        Icon: DollarSign,      tag: "page" },
  { href: "/super-admin/financial",     label: "Financial",      Icon: TrendingUp,      tag: "page" },
  { href: "/super-admin/moderation",    label: "Moderation",     Icon: ShieldAlert,     tag: "page" },
  { href: "/super-admin/ai",            label: "AI Insights",    Icon: Sparkles,        tag: "page" },
  { href: "/super-admin/health",        label: "System Health",  Icon: Heart,           tag: "page" },
  { href: "/super-admin/flags",         label: "Feature Flags",  Icon: ToggleRight,     tag: "page" },
  { href: "/super-admin/audit",         label: "Audit Logs",     Icon: ClipboardList,   tag: "page" },
];

const TAG_COLORS = {
  page: "rgba(201,169,110,0.20)",
  user: "rgba(99,102,241,0.25)",
  event: "rgba(16,185,129,0.20)",
  org: "rgba(167,139,250,0.20)",
};

export default function CommandPalette({ open, onClose }) {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [cursor, setCursor]   = useState(0);
  const { searchResults, searchLoading, search } = useSuperAdminStore();
  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const debounce  = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery(""); setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (query.length >= 2) {
      debounce.current = setTimeout(() => search(query), 280);
    }
  }, [query, search]);

  const navItems = QUICK.filter(l =>
    query.length < 2 || l.label.toLowerCase().includes(query.toLowerCase())
  );

  const resultItems = [];
  if (query.length >= 2 && searchResults) {
    (searchResults.users ?? []).forEach(u => resultItems.push({
      href: "/super-admin/users", label: u.full_name || u.email,
      sub: u.email, Icon: Users, tag: "user",
    }));
    (searchResults.events ?? []).forEach(e => resultItems.push({
      href: "/super-admin/events", label: e.title,
      sub: e.org_name, Icon: CalendarDays, tag: "event",
    }));
    (searchResults.orgs ?? []).forEach(o => resultItems.push({
      href: "/super-admin/organizations", label: o.name,
      sub: o.owner_email, Icon: Building2, tag: "org",
    }));
  }

  const items = [...navItems, ...resultItems];

  function go(href) { router.push(href); onClose(); }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && items[cursor]) go(items[cursor].href);
    if (e.key === "Escape") onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center" style={{ paddingTop: "14vh" }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-[580px] rounded-2xl overflow-hidden"
            style={{
              background: "#0e0e1c",
              border: "1px solid rgba(201,169,110,0.22)",
              boxShadow: "0 32px 100px rgba(0,0,0,0.80), 0 0 0 1px rgba(201,169,110,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
            onKeyDown={onKey}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Search size={16} style={{ color: "rgba(201,169,110,0.65)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                placeholder="Search pages, users, events, organizations…"
                className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.22)]"
              />
              {searchLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border border-[#c9a96e] border-t-transparent" />
              )}
              {query && (
                <button onClick={() => setQuery("")} className="shrink-0">
                  <X size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
              )}
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 360 }}>
              {items.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}

              {query.length < 2 && navItems.length > 0 && (
                <p className="px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.50)" }}>
                  Quick Navigation
                </p>
              )}
              {query.length >= 2 && resultItems.length > 0 && (
                <p className="px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.50)" }}>
                  Search Results
                </p>
              )}

              {items.map((item, i) => {
                const Icon    = item.Icon;
                const active  = i === cursor;
                const tagBg   = TAG_COLORS[item.tag] ?? "rgba(255,255,255,0.08)";
                return (
                  <button
                    key={i}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setCursor(i)}
                    className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors"
                    style={{
                      background:  active ? "rgba(201,169,110,0.09)" : "transparent",
                      borderLeft:  active ? "2px solid #c9a96e" : "2px solid transparent",
                    }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: active ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)" }}
                    >
                      <Icon size={13} style={{ color: active ? "#c9a96e" : "rgba(255,255,255,0.45)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: active ? "#fff" : "rgba(255,255,255,0.80)" }}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.30)" }}>{item.sub}</p>
                      )}
                    </div>
                    {item.tag && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: tagBg, color: "rgba(255,255,255,0.50)" }}>
                        {item.tag}
                      </span>
                    )}
                    <ArrowRight size={11} style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>

            {/* Footer hints */}
            <div
              className="flex items-center gap-4 px-5 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.20)" }}
            >
              {[["↑↓", "navigate"], ["↵", "open"], ["ESC", "close"]].map(([key, hint]) => (
                <span key={key} className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <kbd className="font-mono px-1.5 py-0.5 rounded text-[9px]" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>{key}</kbd>
                  {hint}
                </span>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <Zap size={9} fill="#c9a96e" style={{ color: "#c9a96e" }} />
                <span className="text-[10px] font-black" style={{ color: "rgba(201,169,110,0.60)" }}>CMD+K</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
