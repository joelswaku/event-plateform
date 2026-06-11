"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Badge({ text, color, bg }) {
  return (
    <span
      className="rounded-full px-2 py-0.5"
      style={{ fontSize: 10, fontWeight: 700, background: bg ?? "rgba(255,255,255,0.08)", color: color ?? "rgba(255,255,255,0.50)", letterSpacing: "0.05em" }}
    >
      {text}
    </span>
  );
}

function planBadge(plan) {
  if (!plan) return <Badge text="FREE" />;
  if (plan === "pro") return <Badge text="PRO" bg="rgba(201,169,110,0.15)" color="#c9a96e" />;
  if (plan === "enterprise") return <Badge text="ENTERPRISE" bg="rgba(99,102,241,0.15)" color="#6366f1" />;
  return <Badge text={plan.toUpperCase()} />;
}

function statusBadge(status) {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "ACTIVE") return <Badge text="ACTIVE" bg="rgba(16,185,129,0.15)" color="#10b981" />;
  if (s === "SUSPENDED") return <Badge text="SUSPENDED" bg="rgba(239,68,68,0.15)" color="#ef4444" />;
  if (s === "PUBLISHED") return <Badge text="PUBLISHED" bg="rgba(16,185,129,0.15)" color="#10b981" />;
  if (s === "DRAFT") return <Badge text="DRAFT" bg="rgba(245,158,11,0.15)" color="#f59e0b" />;
  return <Badge text={s} />;
}

function InitialsAvatar({ name }) {
  const initials = (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full text-[11px] font-black"
      style={{ width: 32, height: 32, background: "linear-gradient(135deg,#c9a96e,#f59e0b)", color: "#000" }}
    >
      {initials}
    </div>
  );
}

function Section({ title, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full mb-2"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </p>
        <span
          className="rounded-full px-2 py-0.5"
          style={{ fontSize: 10, fontWeight: 700, background: "rgba(201,169,110,0.12)", color: "#c9a96e" }}
        >
          {count}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const { searchResults, searchLoading, search } = useSuperAdminStore();
  const [query, setQuery] = useState("");
  const timerRef = useRef(null);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const users = searchResults?.users ?? [];
  const events = searchResults?.events ?? [];
  const orgs = searchResults?.orgs ?? [];
  const hasResults = users.length + events.length + orgs.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Super Admin
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
          Global Search
        </h1>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {searchLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c9a96e] border-t-transparent" />
          ) : (
            <Search size={16} style={{ color: "rgba(255,255,255,0.35)" }} />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search users, events, or organizations…"
          style={{
            width: "100%", padding: "16px 16px 16px 44px",
            background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.20)",
            borderRadius: 14, fontSize: 15, color: "#fff",
            outline: "none", boxSizing: "border-box",
          }}
          autoFocus
        />
      </div>

      {/* Empty state */}
      {!query && (
        <div className="py-16 text-center">
          <Search size={32} style={{ color: "rgba(255,255,255,0.12)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>
            Search for users, events, or organizations
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>
            Try: "john", "concert", "acme"
          </p>
        </div>
      )}

      {/* No results */}
      {query && query.length >= 2 && !searchLoading && !hasResults && (
        <div className="py-16 text-center">
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.30)" }}>No results for "{query}"</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Users */}
          {users.length > 0 && (
            <Section title="Users" count={users.length}>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {users.map((u, i) => (
                  <div key={u.id ?? i} className="flex items-center gap-3 px-5 py-3">
                    <InitialsAvatar name={u.full_name} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{u.full_name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {planBadge(u.plan)}
                      {statusBadge(u.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Events */}
          {events.length > 0 && (
            <Section title="Events" count={events.length}>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {events.map((e, i) => (
                  <div key={e.id ?? i} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width: 32, height: 32, background: "rgba(201,169,110,0.10)" }}
                    >
                      <span style={{ fontSize: 14 }}>📅</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{e.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{e.org_name} · {fmtDate(e.starts_at_local)}</p>
                    </div>
                    {statusBadge(e.status)}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Organizations */}
          {orgs.length > 0 && (
            <Section title="Organizations" count={orgs.length}>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {orgs.map((o, i) => (
                  <div key={o.id ?? i} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width: 32, height: 32, background: "rgba(99,102,241,0.12)" }}
                    >
                      <span style={{ fontSize: 14 }}>🏢</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{o.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{o.owner_email} · {o.event_count} events</p>
                    </div>
                    {planBadge(o.plan)}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </motion.div>
      )}
    </div>
  );
}
