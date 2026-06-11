"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Lock, Scale, BookOpen, Plus, Save, Trash2,
  Eye, Edit3, X, Loader2, CheckCircle2, ExternalLink, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

const GOLD = "#C9A96E";

const PAGE_ICONS = {
  "terms":           { Icon: FileText, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Terms of Service"  },
  "privacy-policy":  { Icon: Lock,     color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Privacy Policy"   },
  "cookies-policy":  { Icon: Scale,    color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Cookies Policy"   },
  "acceptable-use":  { Icon: BookOpen, color: "#a78bfa", bg: "rgba(167,139,250,0.12)",label: "Acceptable Use"   },
};
function getIcon(slug) { return PAGE_ICONS[slug] ?? { Icon: FileText, color: GOLD, bg: "rgba(201,169,110,0.12)", label: slug }; }

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Editor modal ────────────────────────────────────────────────── */
function EditorModal({ page, onClose, onSaved }) {
  const isNew  = !page?.slug;
  const [form, setForm] = useState({
    slug:           page?.slug           ?? "",
    title:          page?.title          ?? "",
    content:        page?.content        ?? "",
    version:        page?.version        ?? "1.0",
    effective_date: page?.effective_date ? page.effective_date.slice(0,10) : new Date().toISOString().slice(0,10),
    is_published:   page?.is_published   ?? true,
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [preview, setPreview] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.slug.trim())    return setError("Slug is required.");
    if (!form.title.trim())   return setError("Title is required.");
    if (!form.content.trim()) return setError("Content is required.");
    setSaving(true); setError("");
    try {
      const res = await api.put(`/super-admin/legal/${form.slug.trim()}`, form);
      onSaved(res.data?.data);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-3xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "#0d0d1a" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Legal Pages</p>
            <h2 className="text-base font-black text-white">{isNew ? "New Legal Page" : `Edit — ${form.title}`}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${preview ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/5 text-white/50 border border-white/8"}`}>
              <Eye size={13} /> Preview
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white transition">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: slug + title */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Slug <span className="text-rose-400">*</span></label>
              <input value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g,"-"))}
                placeholder="e.g. terms" className={inputCls} disabled={!isNew} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Title <span className="text-rose-400">*</span></label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="Terms of Service" className={inputCls} />
            </div>
          </div>

          {/* Row 2: version + effective date + published */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Version</label>
              <input value={form.version} onChange={e => set("version", e.target.value)} placeholder="1.0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Effective Date</label>
              <input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)}
                className={`${inputCls} dark:[color-scheme:dark]`} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Status</label>
              <button onClick={() => set("is_published", !form.is_published)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border transition w-full ${form.is_published ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                <div className={`w-2 h-2 rounded-full ${form.is_published ? "bg-emerald-400" : "bg-white/20"}`} />
                {form.is_published ? "Published" : "Draft"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Content (Markdown) <span className="text-rose-400">*</span></label>
              <span className="text-[10px] text-white/20"># H1 &nbsp; ## H2 &nbsp; **bold** &nbsp; - list</span>
            </div>

            {preview ? (
              <div className="min-h-64 rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-sm text-white/70 leading-relaxed overflow-auto"
                style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {form.content || <span className="text-white/20 italic">Nothing to preview…</span>}
              </div>
            ) : (
              <textarea
                value={form.content}
                onChange={e => set("content", e.target.value)}
                placeholder={"# Title\n\nYour legal content here in Markdown…\n\n## Section\n\nParagraph text…"}
                rows={16}
                className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
              />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave} disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50 transition"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save Page"}
            </motion.button>
            {!isNew && (
              <a href={`/${form.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/50 hover:text-white transition">
                <ExternalLink size={13} /> Preview
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function LegalPagesAdmin() {
  const [pages,     setPages]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(null);   // null | page obj | "new"
  const [loadingEdit, setLoadingEdit] = useState(null); // slug being fetched
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/legal");
      setPages(res.data?.data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.slug === saved.slug);
      return idx >= 0 ? prev.map((p, i) => i === idx ? saved : p) : [...prev, saved];
    });
    setEditing(null);
  };

  const handleEdit = async (page) => {
    setLoadingEdit(page.slug);
    try {
      const res = await api.get(`/super-admin/legal/${page.slug}`);
      setEditing(res.data?.data ?? page);
    } catch {
      setEditing(page); // fallback — content may be empty but modal still opens
    } finally {
      setLoadingEdit(null);
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    setDeleting(slug);
    try { await api.delete(`/super-admin/legal/${slug}`); setPages(prev => prev.filter(p => p.slug !== slug)); }
    catch { /* silent */ }
    finally { setDeleting(null); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Super Admin</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Legal Pages</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginTop: 2 }}>Manage Terms, Privacy Policy, and all legal documents — content served dynamically from the database.</p>
        </div>
        <button onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white transition"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
          <Plus size={15} /> New Page
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl" style={{ background: "#0d0d1a" }} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map(page => {
            const { Icon, color, bg } = getIcon(page.slug);
            return (
              <motion.div key={page.slug}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5 flex flex-col gap-4"
                style={{ background: "#0d0d1a", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                      style={{ background: bg, borderColor: color + "30" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{page.title}</p>
                      <p className="text-[10px] font-mono text-white/30 mt-0.5">/{page.slug}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${page.is_published ? "bg-emerald-500/12 text-emerald-400" : "bg-white/6 text-white/30"}`}>
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/30">
                  <span>v{page.version}</span>
                  <span>Updated {fmtDate(page.updated_at)}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(page)} disabled={loadingEdit === page.slug}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/8 transition disabled:opacity-50">
                    {loadingEdit === page.slug ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                    {loadingEdit === page.slug ? "Loading…" : "Edit"}
                  </button>
                  <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/40 hover:text-white transition">
                    <ExternalLink size={12} />
                  </a>
                  <button onClick={() => handleDelete(page.slug)} disabled={deleting === page.slug}
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400/60 hover:text-red-400 transition disabled:opacity-50">
                    {deleting === page.slug ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {pages.length === 0 && !loading && (
            <div className="col-span-2 rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <FileText size={28} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.40)", fontWeight: 700 }}>No legal pages yet</p>
              <p style={{ color: "rgba(255,255,255,0.20)", fontSize: 12, marginTop: 4 }}>Click "+ New Page" to create your first legal document.</p>
            </div>
          )}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <EditorModal
            page={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
