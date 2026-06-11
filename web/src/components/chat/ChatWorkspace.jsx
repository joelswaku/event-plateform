"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, X, MessageCircle, Loader2, ArrowLeft,
  Megaphone, CheckCheck, ShieldCheck, LifeBuoy,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { chatApi, connectChatStream } from "@/lib/chat-api";

const ACCENT = "#6366f1";
const GOLD   = "#c9a96e";

/* ── time helpers ─────────────────────────────────────────────────────────── */
function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)    return "now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function clockTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?";
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */
function Avatar({ name, url, size = 40, support }) {
  if (support) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg,${ACCENT},#7c3aed)`, color: "#fff",
      }}>
        <LifeBuoy size={size * 0.5} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: url ? `center/cover url(${url})` : `linear-gradient(135deg,${ACCENT},#8b5cf6)`,
      color: "#fff", fontSize: size * 0.36, fontWeight: 800,
    }}>
      {!url && initials(name)}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Broadcast modal (super admin)
   ═══════════════════════════════════════════════════════════════════════════ */
function BroadcastModal({ onClose, onSent }) {
  const [body, setBody]       = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const r = await chatApi.broadcast({ body: body.trim(), audience: "all" });
      setResult(r);
      onSent?.();
    } catch { setResult({ error: true }); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: "#0d0d18", borderColor: `${GOLD}33` }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg,${GOLD},#fbbf24)` }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Megaphone size={16} style={{ color: GOLD }} />
            <h3 className="text-sm font-black text-white">Broadcast to all users</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {result ? (
            <div className="text-center py-6">
              {result.error
                ? <p className="text-rose-400 font-semibold">Broadcast failed. Try again.</p>
                : <>
                    <CheckCheck size={32} style={{ color: GOLD }} className="mx-auto mb-3" />
                    <p className="text-white font-bold">Delivered to {result.reached} of {result.total} users</p>
                  </>}
              <button onClick={onClose} className="mt-5 rounded-xl px-5 py-2 text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg,${GOLD},#d4a853)` }}>Done</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/40">Sends a message from support to every user. Replies thread back into their support channel.</p>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} autoFocus
                placeholder="Write your announcement…"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none focus:border-white/20" />
              <button onClick={send} disabled={sending || !body.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg,${GOLD},#d4a853)` }}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
                {sending ? "Sending…" : "Send broadcast"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Message thread
   ═══════════════════════════════════════════════════════════════════════════ */
function Thread({ conversation, meId, registerIncoming, onBack, typingUser, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const scrollRef = useRef(null);
  const typingThrottle = useRef(0);

  const isSupport = conversation.type === "support";
  const userIsRequester = isSupport && !isAdmin;

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setHasMore(true);
    chatApi.messages(conversation.id).then(d => {
      if (!active) return;
      setMessages(d); setLoading(false);
      setHasMore(d.length >= 30);
      requestAnimationFrame(() => scrollToBottom());
    }).catch(() => active && setLoading(false));
    chatApi.markRead(conversation.id).catch(() => {});
    return () => { active = false; };
  }, [conversation.id, scrollToBottom]);

  useEffect(() => {
    return registerIncoming(conversation.id, (msg) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      requestAnimationFrame(() => scrollToBottom(true));
      chatApi.markRead(conversation.id).catch(() => {});
    });
  }, [conversation.id, registerIncoming, scrollToBottom]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const older = await chatApi.messages(conversation.id, messages[0].created_at);
      setMessages(prev => [...older, ...prev]);
      setHasMore(older.length >= 30);
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
    } finally { setLoadingMore(false); }
  };

  const onScroll = (e) => { if (e.target.scrollTop < 60) loadMore(); };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText(""); setSending(true);
    const temp = { id: `temp-${Date.now()}`, sender_id: meId, body, created_at: new Date().toISOString(), optimistic: true, kind: "text" };
    setMessages(prev => [...prev, temp]);
    requestAnimationFrame(() => scrollToBottom(true));
    try {
      const real = await chatApi.send(conversation.id, { body });
      setMessages(prev => prev.map(m => m.id === temp.id ? real : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== temp.id));
      setText(body);
    } finally { setSending(false); }
  };

  const onType = () => {
    const now = Date.now();
    if (now - typingThrottle.current > 2500) { typingThrottle.current = now; chatApi.typing(conversation.id); }
  };

  const subtitle = userIsRequester
    ? (typingUser ? "typing…" : "Support team — we're here to help")
    : (typingUser ? "typing…" : (conversation.counterpart?.email || "Support request"));

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3 shrink-0">
        {onBack && <button onClick={onBack} className="md:hidden text-white/50 hover:text-white"><ArrowLeft size={20} /></button>}
        <Avatar name={conversation.title} url={conversation.counterpart?.avatar_url} size={38} support={userIsRequester} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white truncate flex items-center gap-1.5">
            {userIsRequester ? "Support" : conversation.title}
          </p>
          <p className="text-xs truncate" style={{ color: typingUser ? ACCENT : "rgba(255,255,255,0.4)" }}>{subtitle}</p>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loadingMore && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-white/30" /></div>}
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white/30" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-white/30">
            <LifeBuoy size={36} className="mb-3" style={{ color: ACCENT }} />
            <p className="text-sm font-semibold text-white/50">
              {userIsRequester ? "Ask us anything" : "No messages yet"}
            </p>
            {userIsRequester && <p className="text-xs mt-1">Send a message and our team will get back to you.</p>}
          </div>
        ) : messages.map((m) => {
          const mine = m.sender_id === meId;
          const fromAdmin = userIsRequester && !mine; // support replies
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-md" : "rounded-bl-md"}`}
                style={{
                  background: mine ? `linear-gradient(135deg,${ACCENT},#7c3aed)` : "rgba(255,255,255,0.07)",
                  opacity: m.optimistic ? 0.6 : 1,
                }}>
                {fromAdmin && <p className="text-[10px] font-bold mb-0.5 flex items-center gap-1" style={{ color: GOLD }}><ShieldCheck size={11} /> Support</p>}
                {!userIsRequester && !mine && <p className="text-[10px] font-bold mb-0.5" style={{ color: GOLD }}>{m.sender_name}</p>}
                {m.deleted
                  ? <p className="text-sm italic text-white/40">Message deleted</p>
                  : <p className="text-sm text-white whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
                <div className={`flex items-center gap-1 mt-0.5 ${mine ? "justify-end" : ""}`}>
                  <span className="text-[10px] text-white/40">{clockTime(m.created_at)}</span>
                  {mine && !m.optimistic && <CheckCheck size={12} className="text-white/40" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* composer */}
      <div className="border-t border-white/8 p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={text} rows={1}
            onChange={e => { setText(e.target.value); onType(); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={userIsRequester ? "Describe your question…" : "Type a reply…"}
            className="flex-1 max-h-32 resize-none rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
            style={{ minHeight: 42 }}
          />
          <button onClick={send} disabled={!text.trim() || sending}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 transition"
            style={{ background: `linear-gradient(135deg,${ACCENT},#7c3aed)` }}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Workspace
   variant="support" → end-user: a single support thread, no sidebar.
   variant="inbox"   → super admin: list of all support threads + broadcast.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ChatWorkspace({ variant = "support" }) {
  const user        = useAuthStore(s => s.user);
  const accessToken = useAuthStore(s => s.accessToken);
  const meId        = user?.id;
  const isAdmin     = variant === "inbox";

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch]     = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [typingMap, setTypingMap] = useState({});

  const incomingHandlers = useRef(new Map());
  const streamRef = useRef(null);
  const activeIdRef = useRef(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const active = conversations.find(c => c.id === activeId) || null;

  const loadConversations = useCallback(async () => {
    try { setConversations(await chatApi.conversations()); }
    finally { setLoading(false); }
  }, []);

  /* initial load: admins get the inbox; users get their single support thread */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (isAdmin) {
          const list = await chatApi.conversations();
          if (active) setConversations(list);
        } else {
          const conv = await chatApi.openSupport();
          if (active && conv) { setConversations([conv]); setActiveId(conv.id); }
        }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [isAdmin]);

  /* realtime */
  useEffect(() => {
    if (!meId) return;
    streamRef.current = connectChatStream({
      token: accessToken,
      onMessage: ({ conversation_id, message }) => {
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === conversation_id);
          if (idx === -1) { loadConversations(); return prev; }
          const updated = { ...prev[idx],
            last_message_at: message.created_at,
            last_message_preview: message.body ?? "📎 Attachment",
            last_message_sender: message.sender_id,
            unread_count: (conversation_id === activeIdRef.current || message.sender_id === meId)
              ? 0 : (prev[idx].unread_count || 0) + 1,
          };
          return [updated, ...prev.filter((_, i) => i !== idx)];
        });
        const handler = incomingHandlers.current.get(conversation_id);
        if (handler) handler(message);
      },
      onTyping: ({ conversation_id, user_id }) => {
        if (user_id === meId) return;
        setTypingMap(prev => ({ ...prev, [conversation_id]: Date.now() }));
        setTimeout(() => {
          setTypingMap(prev => {
            if (Date.now() - (prev[conversation_id] || 0) >= 3000) {
              const { [conversation_id]: _, ...rest } = prev; return rest;
            }
            return prev;
          });
        }, 3200);
      },
    });
    return () => streamRef.current?.close();
  }, [meId, accessToken, loadConversations]);

  const registerIncoming = useCallback((convId, fn) => {
    incomingHandlers.current.set(convId, fn);
    return () => incomingHandlers.current.delete(convId);
  }, []);

  const openConversation = (id) => {
    setActiveId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
  };

  /* ── End-user support view: just the thread ── */
  if (!isAdmin) {
    return (
      <div className="flex h-full overflow-hidden rounded-2xl border border-white/8" style={{ background: "#0a0a12" }}>
        {loading || !active ? (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="flex w-full flex-col">
            <Thread
              conversation={active} meId={meId} registerIncoming={registerIncoming}
              typingUser={!!typingMap[active.id]} isAdmin={false}
            />
          </div>
        )}
      </div>
    );
  }

  /* ── Super-admin support inbox ── */
  const filtered = search
    ? conversations.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-white/8" style={{ background: "#0a0a12" }}>
      {/* sidebar */}
      <div className={`${active ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 flex-col border-r border-white/8`}>
        <div className="p-4 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <LifeBuoy size={18} style={{ color: ACCENT }} /> Support inbox
            </h2>
            <button onClick={() => setShowBroadcast(true)} title="Broadcast to all users"
              className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 transition text-xs font-bold"
              style={{ borderColor: `${GOLD}40`, background: `${GOLD}1a`, color: GOLD }}>
              <Megaphone size={14} /> Broadcast
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <Search size={14} className="text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/30" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 px-6 text-center">
              <LifeBuoy size={32} className="mb-3" />
              <p className="text-sm font-semibold">No support requests yet</p>
              <p className="text-xs mt-1">User questions will appear here.</p>
            </div>
          ) : filtered.map(c => {
            const isActive = c.id === activeId;
            const fromMe = c.last_message_sender === meId;
            return (
              <button key={c.id} onClick={() => openConversation(c.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition border-l-2 ${isActive ? "bg-white/5" : "hover:bg-white/[0.03] border-transparent"}`}
                style={{ borderLeftColor: isActive ? ACCENT : "transparent" }}>
                <Avatar name={c.title} url={c.counterpart?.avatar_url} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white truncate">{c.title}</p>
                    <span className="text-[10px] text-white/30 shrink-0">{relTime(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-white/45 truncate">
                      {fromMe && <span className="text-white/30">You: </span>}
                      {c.last_message_preview || "No messages yet"}
                    </p>
                    {c.unread_count > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white"
                        style={{ background: ACCENT }}>
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* thread pane */}
      <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {active ? (
          <Thread
            key={active.id} conversation={active} meId={meId}
            registerIncoming={registerIncoming} onBack={() => setActiveId(null)}
            typingUser={!!typingMap[active.id]} isAdmin
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/30">
            <div className="rounded-3xl p-6 mb-4" style={{ background: "rgba(99,102,241,0.08)" }}>
              <LifeBuoy size={44} style={{ color: ACCENT }} />
            </div>
            <p className="text-base font-bold text-white/60">Support inbox</p>
            <p className="text-sm mt-1">Select a request to reply.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} onSent={loadConversations} />}
      </AnimatePresence>
    </div>
  );
}
