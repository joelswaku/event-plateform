"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, ChevronDown } from "lucide-react";
import axios from "axios";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SUGGESTED = [
  "What is the dress code?",
  "Is parking available?",
  "What time does it start?",
  "How do I register or RSVP?",
  "Will food be provided?",
  "Is this event family-friendly?",
];

function TypingDots() {
  return (
    <div className="flex gap-1 py-0.5">
      {[0, 120, 240].map((d) => (
        <span
          key={d}
          className="w-2 h-2 rounded-full bg-indigo-400/60 animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

export default function EventChatbot({ eventId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your event assistant. I can answer questions about schedules, registration, dress code, venue details, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const sessionKey = `chatbot_session_${eventId}`;

  function getSessionToken() {
    let token = sessionStorage.getItem(sessionKey);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, token);
    }
    return token;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  async function send(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    setShowSuggestions(false);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await axios.post(`${BACKEND}/ai/public/events/${eventId}/chatbot`, {
        message: trimmed,
        sessionToken: getSessionToken(),
        eventId,
      });
      const reply = res.data.data?.reply ?? "I'm sorry, I wasn't able to retrieve that information. Please try asking in a different way.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm experiencing a brief interruption. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-28 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div
          className="w-85 sm:w-95 flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: "#0f0f1a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            maxHeight: 520,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Event Assistant</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center mt-0.5">
                    <Bot className="w-3 h-3 text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                      : "text-gray-200 rounded-2xl rounded-bl-sm"
                  }`}
                  style={m.role === "assistant" ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center mt-0.5">
                  <Bot className="w-3 h-3 text-indigo-400" />
                </div>
                <div
                  className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {showSuggestions && messages.length === 1 && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mb-1.5">Suggested questions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[11px] text-indigo-300 border border-indigo-500/25 bg-indigo-500/8 hover:bg-indigo-500/20 rounded-full px-2.5 py-1 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div
            className="flex gap-2 px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 disabled:opacity-40 transition-colors"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-2xl text-white text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? "#3730a3" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
          boxShadow: "0 8px 32px rgba(79,70,229,0.4)",
          padding: "12px 18px",
        }}
      >
        {open ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            <span>Ask a question</span>
          </>
        )}
      </button>
    </div>
  );
}
