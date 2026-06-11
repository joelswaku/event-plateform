"use client";

import { useEffect, useState, useRef } from "react";
import { X, FileText, Lock, Scale, BookOpen, ExternalLink } from "lucide-react";
import axios from "axios";

const _api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: false,
  timeout: 10_000,
});

/* ── Simple markdown → styled JSX (no external deps) ──────────────────────── */
function MarkdownBody({ content }) {
  if (!content) return null;
  const lines   = content.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw  = lines[i];
    const line = raw.trimEnd();

    if (/^### /.test(line)) {
      elements.push(<h3 key={i} className="text-[13px] font-bold text-white/80 mt-5 mb-1.5">{line.slice(4)}</h3>);
    } else if (/^## /.test(line)) {
      elements.push(<h2 key={i} className="text-[15px] font-black text-white mt-6 mb-2">{line.slice(3)}</h2>);
    } else if (/^# /.test(line)) {
      elements.push(<h1 key={i} className="text-xl font-black text-white mt-6 mb-3">{line.slice(2)}</h1>);
    } else if (/^[-*] /.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 pl-1">
          <span className="text-white/30 mt-[3px] shrink-0 text-xs">•</span>
          <span className="text-[13px] text-white/55 leading-relaxed">{inline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\*\*\*|^---/.test(line)) {
      elements.push(<hr key={i} className="border-white/8 my-4" />);
    } else if (line === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-[13px] text-white/55 leading-relaxed my-0.5">{inline(line)}</p>
      );
    }
    i++;
  }

  return <div>{elements}</div>;
}

function inline(text) {
  const parts = [];
  const re    = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    if (m[1]) parts.push(<strong key={k++} className="text-white/85 font-semibold">{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={k++}>{m[2]}</em>);
    else if (m[3]) parts.push(<code key={k++} className="text-indigo-400 text-[12px] font-mono bg-indigo-500/10 px-1 rounded">{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts.length ? parts : text;
}

/* ── Icon helper ────────────────────────────────────────────────────────────── */
const SLUG_META = {
  "terms":          { Icon: FileText, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "privacy-policy": { Icon: Lock,     color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  "cookies-policy": { Icon: Scale,    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "acceptable-use": { Icon: BookOpen, color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};
function getSlugMeta(slug) {
  return SLUG_META[slug] ?? { Icon: FileText, color: "#6366f1", bg: "rgba(99,102,241,0.12)" };
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */
export default function LegalModal({ slug, onClose }) {
  const [page,    setPage]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);
  const scrollRef = useRef(null);

  const open = !!slug;

  useEffect(() => {
    if (!slug) { setPage(null); setError(false); return; }
    setLoading(true);
    setError(false);
    setPage(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    _api
      .get(`/public/legal/${slug}`)
      .then(r  => setPage(r.data?.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  /* lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const { Icon, color, bg } = getSlugMeta(slug);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-2xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-px w-full shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
            style={{ background: bg, borderColor: color + "30" }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: color + "cc" }}>Legal</p>
            <p className="text-sm font-black text-white truncate">
              {loading ? "Loading…" : (page?.title ?? "—")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {page && (
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/35 hover:text-white transition"
                title="Open full page"
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/35 hover:text-white transition"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm text-white/30">Loading content…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6">
              <FileText size={32} className="text-white/15" />
              <p className="text-sm font-semibold text-white/40">Could not load this page</p>
              <p className="text-xs text-white/25 text-center">Please try again later or visit liteevent.com</p>
            </div>
          ) : page ? (
            <div className="px-5 py-5">
              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {page.effective_date && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: bg, color, border: `1px solid ${color}30` }}>
                    Effective {fmtDate(page.effective_date)}
                  </span>
                )}
                {page.version && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/35 border border-white/8">
                    v{page.version}
                  </span>
                )}
              </div>

              <MarkdownBody content={page.content} />

              <div className="mt-8 pt-4 border-t border-white/8">
                <p className="text-[11px] text-white/25 text-center">
                  LiteEvent LLC · 17200 E Iliff Ave Ste A12 PMB 1011, Aurora, CO 80013
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
