"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const _api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: false,
  timeout: 10_000,
});

/* ── Simple markdown → HTML renderer (no external deps) ───────────
   Handles: # headings, **bold**, bullet lists, blank-line paragraphs */
function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.split("\n");
  const html  = [];
  let inList   = false;

  const closeList = () => { if (inList) { html.push("</ul>"); inList = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^######\s/.test(line)) { closeList(); html.push(`<h6>${esc(line.slice(7))}</h6>`); continue; }
    if (/^#####\s/.test(line))  { closeList(); html.push(`<h5>${esc(line.slice(6))}</h5>`); continue; }
    if (/^####\s/.test(line))   { closeList(); html.push(`<h4>${esc(line.slice(5))}</h4>`); continue; }
    if (/^###\s/.test(line))    { closeList(); html.push(`<h3>${esc(line.slice(4))}</h3>`); continue; }
    if (/^##\s/.test(line))     { closeList(); html.push(`<h2>${esc(line.slice(3))}</h2>`); continue; }
    if (/^#\s/.test(line))      { closeList(); html.push(`<h1>${esc(line.slice(2))}</h1>`); continue; }

    if (/^[-*]\s/.test(line)) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    if (line === "") { html.push("<br/>"); continue; }
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       "<code>$1</code>");
}

/* ── Component ─────────────────────────────────────────────────── */
export default function LegalPageViewer({ slug }) {
  const [page,    setPage]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    _api.get(`/public/legal/${slug}`)
      .then(r  => setPage(r.data?.data ?? null))
      .catch(() => setError("Could not load page content."))
      .finally(() => setLoading(false));
  }, [slug]);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-white/8 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-gray-900 dark:text-white">LiteEvent</Link>
          <Link href={slug === "terms" ? "/privacy-policy" : "/terms"}
            className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            {slug === "terms" ? "Privacy Policy →" : "Terms of Service →"}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-14 pb-20">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/8" />
            <div className="h-10 w-2/3 rounded-xl bg-gray-100 dark:bg-white/8" />
            <div className="h-4 w-48 rounded bg-gray-100 dark:bg-white/8" />
            {[1,2,3,4,5].map(i => <div key={i} className="h-4 rounded bg-gray-100 dark:bg-white/8" style={{ width: `${70+i*5}%` }} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-6 py-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
            <p className="text-sm text-red-400 mt-2">Please try again later or contact legal@liteevent.com</p>
          </div>
        ) : page ? (
          <>
            {/* Meta */}
            <div className="mb-10">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">Legal</p>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">{page.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 dark:text-white/40">
                {page.effective_date && <span><strong className="text-gray-600 dark:text-white/60">Effective:</strong> {fmtDate(page.effective_date)}</span>}
                {page.version        && <span><strong className="text-gray-600 dark:text-white/60">Version:</strong> {page.version}</span>}
                {page.updated_at     && <span><strong className="text-gray-600 dark:text-white/60">Last updated:</strong> {fmtDate(page.updated_at)}</span>}
              </div>
            </div>

            {/* Content */}
            <div
              className="prose prose-gray dark:prose-invert max-w-none
                prose-h1:text-2xl prose-h1:font-black prose-h1:mt-10 prose-h1:mb-4
                prose-h2:text-xl prose-h2:font-black prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-base prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-gray-600 dark:prose-p:text-white/60 prose-p:leading-relaxed prose-p:my-2
                prose-strong:text-gray-800 dark:prose-strong:text-white/90
                prose-ul:my-3 prose-li:text-gray-600 dark:prose-li:text-white/60
                prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
            />

            {/* Footer nav */}
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-white/8 flex flex-wrap gap-4">
              <Link href="/terms"           className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</Link>
              <Link href="/privacy-policy"  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>
              <Link href="/cookies-policy"  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Cookies Policy</Link>
              <Link href="/acceptable-use"  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Acceptable Use</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white/60">← Back to Home</Link>
            </div>
          </>
        ) : (
          <p className="text-gray-400">Page not found.</p>
        )}
      </main>
    </div>
  );
}
