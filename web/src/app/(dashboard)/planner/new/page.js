"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, ClipboardList, Sparkles, Send, Bot, User, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { usePlannerStore } from "@/store/planner.store";
import { useEventStore } from "@/store/event.store";
import toast from "react-hot-toast";

const QUESTIONS = [
  {
    key: "guestCount",
    ask: "How many guests are you expecting at this event?",
    hint: "e.g. 80, 150, 300+",
    parse: (v) => {
      const num = parseInt(v) || null;
      if (num && num > 1000000) {
        throw new Error("Guest count cannot exceed 1,000,000");
      }
      return { guestCount: num };
    },
  },
  {
    key: "totalBudget",
    ask: "What is your estimated total budget? Please include the currency.",
    hint: "e.g. $25,000 · €15,000 · £8,000",
    parse: (v) => {
      const num = parseFloat(v.replace(/[^0-9.]/g, "")) || null;
      const cur = v.match(/EUR|GBP|CAD|AUD/i)?.[0]?.toUpperCase() || (v.includes("€") ? "EUR" : v.includes("£") ? "GBP" : "USD");
      // PostgreSQL numeric type max safe value (prevent overflow)
      if (num && num > 999999999999.99) {
        throw new Error("Budget cannot exceed 999,999,999,999.99");
      }
      return { totalBudget: num, currency: cur };
    },
  },
  {
    key: "venue",
    ask: "Do you have a venue secured, or are you still searching?",
    hint: 'Name the venue, or type "Still searching"',
    parse: (v) => ({ venue: v }),
  },
  {
    key: "styleNotes",
    ask: "How would you describe the style or atmosphere you are going for?",
    hint: "e.g. Black-tie formal · Rustic outdoor · Modern minimalist",
    parse: (v) => ({ styleNotes: v }),
  },
  {
    key: "aiNotes",
    ask: "Any additional details you would like me to factor into your plan? If not, just press Enter to skip.",
    hint: "Optional — themes, special requests, constraints…",
    parse: (v) => ({ aiNotes: v.trim() || null }),
  },
];

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NewPlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preEventId = searchParams.get("eventId") || "";

  const { createProject, generateAITasks, projects, fetchProjects } = usePlannerStore();
  const { events, fetchEvents, loading: eventsLoading } = useEventStore();

  const [phase, setPhase] = useState("form"); // "form" | "chat" | "creating"
  const [selectedEventId, setSelectedEventId] = useState(preEventId);
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    fetchProjects();
  }, []);

  // If a planner already exists for the pre-selected event, go straight to it
  useEffect(() => {
    if (!preEventId || !projects.length) return;
    const existing = projects.find(
      (p) => (p.event_id ?? p.eventId) === preEventId
    );
    if (existing) router.replace(`/planner/${existing.id}`);
  }, [projects, preEventId]);

  useEffect(() => {
    if (preEventId && events.length > 0 && !title) {
      const ev = events.find((e) => e.id === preEventId);
      if (ev) setTitle(`${ev.title} — Planner`);
    }
  }, [events, preEventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  function pushBot(content) {
    setMessages((m) => [...m, { role: "bot", content }]);
  }

  function pushUser(content) {
    setMessages((m) => [...m, { role: "user", content }]);
  }

  function startChat() {
    setFormError("");
    if (!selectedEventId) { setFormError("Please select an event."); return; }
    if (!title.trim()) { setFormError("Please enter a planner title."); return; }

    setPhase("chat");
    const ev = events.find((e) => e.id === selectedEventId);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushBot(
        `Great — I will be your planning assistant for "${ev?.title || "your event"}". I have a few questions to build a tailored plan. Let's start.\n\n${QUESTIONS[0].ask}`
      );
      setQuestionIdx(0);
    }, 900);
  }

  async function handleAnswer() {
    const text = input.trim();
    if (!text) return;

    pushUser(text);
    setInput("");

    const q = QUESTIONS[questionIdx];
    let parsed;

    try {
      parsed = q.parse(text);
    } catch (error) {
      // Show error message and ask the question again
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBot(`⚠️ ${error.message}. Let's try again: ${q.ask}`);
        inputRef.current?.focus();
      }, 500);
      return;
    }

    const newAnswers = { ...answers, ...parsed };
    setAnswers(newAnswers);

    const next = questionIdx + 1;

    if (next < QUESTIONS.length) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setQuestionIdx(next);
        pushBot(QUESTIONS[next].ask);
        inputRef.current?.focus();
      }, 700);
    } else {
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        pushBot("Perfect — I have everything I need. Building your event plan now…");
        setPhase("creating");

        const res = await createProject({
          title: title.trim(),
          eventId: selectedEventId,
          eventType: selectedEvent?.event_type || null,
          eventDate: selectedEvent?.starts_at || null,
          guestCount: newAnswers.guestCount || null,
          totalBudget: newAnswers.totalBudget || null,
          currency: newAnswers.currency || "USD",
          venue: newAnswers.venue || null,
          styleNotes: newAnswers.styleNotes || null,
          aiNotes: newAnswers.aiNotes || null,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to create plan");
          setPhase("chat");
          return;
        }

        await generateAITasks(res.data.id);
        router.push(`/planner/${res.data.id}`);
      }, 1000);
    }
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-colors";

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <button
          onClick={() => phase === "form" ? router.push("/planner") : setPhase("form")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {phase === "form" ? "All Projects" : "Back"}
        </button>

        <div className="bg-[#111127] rounded-3xl border border-white/8 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-linear-to-br from-indigo-600 to-purple-700 px-6 py-6">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-indigo-200" />
              <span className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">New Planner</span>
            </div>
            <h1 className="text-xl font-black text-white">
              {phase === "form" ? "Select your event" : title}
            </h1>
            {phase === "chat" && selectedEvent && (
              <p className="text-indigo-200 text-xs mt-1">{selectedEvent.title} · {formatEventDate(selectedEvent.starts_at)}</p>
            )}
          </div>

          {/* ── FORM PHASE ── */}
          {phase === "form" && (
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Event *</label>
                {eventsLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading your events…
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-300">No events yet</p>
                      <p className="text-[11px] text-amber-400/60 mt-0.5">Create an event first to link this planner to it.</p>
                    </div>
                    <Link
                      href="/events/create"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Create Event
                    </Link>
                  </div>
                ) : (
                  <select
                    className={inputCls}
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const ev = events.find((x) => x.id === e.target.value);
                      if (ev && !title) setTitle(`${ev.title} — Planner`);
                    }}
                  >
                    <option value="">Select an event…</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}{ev.starts_at ? ` · ${formatEventDate(ev.starts_at)}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedEvent && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-300 truncate">{selectedEvent.title}</p>
                    <p className="text-[11px] text-indigo-400/70 capitalize">
                      {selectedEvent.event_type?.replace(/_/g, " ") || "Event"}{selectedEvent.starts_at ? ` · ${formatEventDate(selectedEvent.starts_at)}` : ""}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Planner title *</label>
                <input
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Gala 2025 — Master Plan"
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                />
              </div>

              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}

              <button
                onClick={startChat}
                disabled={!selectedEventId || !title.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Continue with AI Setup
              </button>
            </div>
          )}

          {/* ── CHAT PHASE ── */}
          {(phase === "chat" || phase === "creating") && (
            <>
              {/* Progress dots */}
              <div className="flex gap-1.5 px-6 py-3 border-b border-white/6">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                      i < questionIdx ? "bg-indigo-500" : i === questionIdx ? "bg-indigo-400/60" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Messages */}
              <div className="px-5 py-4 space-y-4 h-80 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "bot" && (
                      <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white/6 text-gray-200 rounded-bl-sm border border-white/8"
                    }`}>
                      {m.content}
                    </div>
                    {m.role === "user" && (
                      <div className="shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}

                {typing && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="bg-white/6 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {phase === "creating" && !typing && (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-indigo-300">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating your personalized plan…
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Hint */}
              {phase === "chat" && questionIdx < QUESTIONS.length && (
                <p className="px-6 pb-1 text-[11px] text-gray-600 italic">{QUESTIONS[questionIdx].hint}</p>
              )}

              {/* Input */}
              {phase === "chat" && (
                <div className="flex gap-2 px-5 pb-5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
                    placeholder="Type your answer…"
                    disabled={typing}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 disabled:opacity-40 transition-colors"
                  />
                  <button
                    onClick={handleAnswer}
                    disabled={typing || !input.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewPlannerPage() {
  return (
    <Suspense>
      <NewPlannerInner />
    </Suspense>
  );
}
