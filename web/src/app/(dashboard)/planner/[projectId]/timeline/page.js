"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  Plus, Trash2, Clock, MapPin, Star, Loader2, X,
  ChevronLeft, ChevronRight, Sparkles, Calendar,
  List, LayoutGrid, Flag, Zap, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const VIEWS = [
  { id: "List",     label: "Timeline", icon: List       },
  { id: "Calendar", label: "Calendar", icon: Calendar   },
  { id: "Day-of",   label: "Day-of",   icon: Clock      },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CATS = ["ceremony","reception","catering","entertainment","logistics","other"];

const CAT_COLORS = {
  ceremony:      { bg: "bg-violet-500/20", text: "text-violet-300", dot: "#8b5cf6" },
  reception:     { bg: "bg-rose-500/20",   text: "text-rose-300",   dot: "#f43f5e" },
  catering:      { bg: "bg-amber-500/20",  text: "text-amber-300",  dot: "#f59e0b" },
  entertainment: { bg: "bg-cyan-500/20",   text: "text-cyan-300",   dot: "#06b6d4" },
  logistics:     { bg: "bg-indigo-500/20", text: "text-indigo-300", dot: "#6366f1" },
  other:         { bg: "bg-gray-500/20",   text: "text-gray-300",   dot: "#6b7280" },
};

function TimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-px flex-1 bg-white/5 mt-1" />
          </div>
          <div className="flex-1 bg-white/5 rounded-xl h-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyTimeline({ onAdd, onAIGenerate, loading }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
        <Clock className="w-7 h-7 text-violet-400" />
      </div>
      <p className="text-white font-bold text-base mb-1">No timeline yet</p>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Build a complete day-of schedule with AI — ceremony timing, vendor arrivals, guest activities, and more.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAIGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white text-sm font-bold transition-all disabled:opacity-60 active:scale-[0.97]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate AI Schedule
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 hover:bg-white/10 text-white text-sm font-semibold transition-all border border-white/10 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Add Manually
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ projectId, onClose }) {
  const { createTimelineItem } = usePlannerStore();
  const [form, setForm] = useState({
    title: "", category: "logistics", item_time: "",
    duration_minutes: "", description: "", location: "", is_milestone: false,
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await createTimelineItem(projectId, form);
    setSaving(false);
    if (res.success) { toast.success("Item added"); onClose(); }
    else toast.error(res.error || "Failed to add item");
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Add Timeline Item</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <input className={inp} placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} type="time" value={form.item_time} onChange={e => setForm(p => ({ ...p, item_time: e.target.value }))} />
          <input className={inp} type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
        </div>
        <input className={inp} placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        <select className={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
          {CATS.map(c => <option key={c} value={c} className="bg-[#111127]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <textarea className={`${inp} h-20 resize-none`} placeholder="Description…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
          <input type="checkbox" checked={form.is_milestone} onChange={e => setForm(p => ({ ...p, is_milestone: e.target.checked }))} className="accent-amber-500" />
          <Flag className="w-3.5 h-3.5 text-amber-400" />
          Mark as Key Milestone
        </label>
        <button
          onClick={submit}
          disabled={saving || !form.title.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add Item"}
        </button>
      </div>
    </div>
  );
}

function TimelineItem({ item, projectId, isLast }) {
  const { deleteTimelineItem } = usePlannerStore();
  const [deleting, setDeleting] = useState(false);
  const cat = CAT_COLORS[item.category] ?? CAT_COLORS.other;

  async function del() {
    setDeleting(true);
    const res = await deleteTimelineItem(projectId, item.id);
    if (!res.success) { toast.error("Failed to delete"); setDeleting(false); }
  }

  return (
    <div className="group relative flex gap-4">
      {/* Connector */}
      <div className="flex flex-col items-center shrink-0">
        {item.is_milestone ? (
          <div className="relative mt-1">
            <div className="w-4 h-4 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center">
              <Flag className="w-2 h-2 text-amber-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
          </div>
        ) : (
          <div
            className="w-3 h-3 rounded-full border-2 mt-1.5 shrink-0"
            style={{ backgroundColor: cat.dot + "40", borderColor: cat.dot }}
          />
        )}
        {!isLast && <div className="w-px flex-1 bg-white/6 mt-1.5" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border transition-all duration-200 overflow-hidden
        ${item.is_milestone
          ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/35"
          : "bg-[#111127] border-white/8 hover:border-white/14"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {item.is_milestone && (
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/15 px-2 py-0.5 rounded-full">
                    MILESTONE
                  </span>
                )}
                <p className="text-sm font-semibold text-white leading-tight">{item.title}</p>
              </div>
              {item.description && (
                <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {item.item_time && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    {item.item_time}
                    {item.duration_minutes && <span className="text-gray-600">· {item.duration_minutes}min</span>}
                  </span>
                )}
                {item.location && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="w-3 h-3" />{item.location}
                  </span>
                )}
                {item.category && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cat.bg} ${cat.text}`}>
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={del}
              disabled={deleting}
              className="sm:opacity-0 sm:group-hover:opacity-100 opacity-60 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all shrink-0"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Duration bar */}
        {item.duration_minutes > 0 && (
          <div className="px-4 pb-3">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full opacity-60"
                style={{
                  width: `${Math.min(100, (item.duration_minutes / 120) * 100)}%`,
                  backgroundColor: cat.dot,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListView({ items, projectId, onAdd, onAIGenerate, loading }) {
  const sorted = [...items].sort((a, b) => {
    if (a.item_time && b.item_time) return a.item_time.localeCompare(b.item_time);
    if (a.item_time) return -1;
    if (b.item_time) return 1;
    return (a.position_order ?? 0) - (b.position_order ?? 0);
  });

  const milestones = sorted.filter(i => i.is_milestone);
  const regular = sorted.filter(i => !i.is_milestone);

  if (items.length === 0) {
    return <EmptyTimeline onAdd={onAdd} onAIGenerate={onAIGenerate} loading={loading} />;
  }

  return (
    <div className="space-y-8">
      {milestones.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Key Milestones</p>
            <span className="text-[10px] text-gray-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{milestones.length}</span>
          </div>
          <div>
            {milestones.map((item, idx) => (
              <TimelineItem key={item.id} item={item} projectId={projectId} isLast={idx === milestones.length - 1} />
            ))}
          </div>
        </div>
      )}

      <div>
        {milestones.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Schedule</p>
            <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{regular.length}</span>
          </div>
        )}
        {regular.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>No schedule items yet.</p>
            <button onClick={onAdd} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              + Add first item
            </button>
          </div>
        ) : (
          <div>
            {regular.map((item, idx) => (
              <TimelineItem key={item.id} item={item} projectId={projectId} isLast={idx === regular.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarView({ items, currentProject }) {
  const [calMonth, setCalMonth] = useState(() => {
    if (currentProject?.event_date) {
      const d = new Date(currentProject.event_date);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const eventDate = currentProject?.event_date ? new Date(currentProject.event_date) : null;
  const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const today = new Date();

  const itemsByDate = {};
  for (const item of items) {
    if (item.event_date) {
      const k = item.event_date.slice(0, 10);
      if (!itemsByDate[k]) itemsByDate[k] = [];
      itemsByDate[k].push(item);
    }
  }

  function prevMonth() {
    setCalMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  }
  function nextMonth() {
    setCalMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day) =>
    today.getFullYear() === calMonth.year &&
    today.getMonth() === calMonth.month &&
    today.getDate() === day;

  const isEventDay = (day) =>
    eventDate &&
    eventDate.getFullYear() === calMonth.year &&
    eventDate.getMonth() === calMonth.month &&
    eventDate.getDate() === day;

  return (
    <div className="bg-[#111127] border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/2">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-white">{MONTHS[calMonth.month]} {calMonth.year}</p>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-gray-600 uppercase border-b border-white/5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-20 border-b border-r border-white/4" />;
          const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayItems = itemsByDate[dateStr] || [];
          const event = isEventDay(day);
          const now = isToday(day);

          return (
            <div
              key={day}
              className={`h-20 border-b border-r border-white/4 p-1.5 transition-colors
                ${event ? "bg-indigo-500/12" : now ? "bg-white/3" : "hover:bg-white/2"}`}
            >
              <div className={`text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full
                ${event ? "bg-indigo-500 text-white" : now ? "bg-white/20 text-white" : "text-gray-500"}`}>
                {day}
              </div>
              {event && <span className="text-[8px] text-indigo-300 font-black uppercase tracking-wide">EVENT</span>}
              {dayItems.slice(0, 2).map(item => {
                const cat = CAT_COLORS[item.category] ?? CAT_COLORS.other;
                return (
                  <div key={item.id} className={`text-[9px] truncate px-1 rounded mb-0.5 ${cat.bg} ${cat.text}`}>
                    {item.title}
                  </div>
                );
              })}
              {dayItems.length > 2 && <p className="text-[8px] text-gray-600">+{dayItems.length - 2} more</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayOfView({ items, onAdd, onAIGenerate, loading }) {
  const hourItems = [...items].filter(i => i.item_time).sort((a, b) => a.item_time.localeCompare(b.item_time));
  const noTime = items.filter(i => !i.item_time);
  const hours = Array.from({ length: 20 }, (_, i) => i + 5); // 5am–midnight

  if (items.length === 0) {
    return <EmptyTimeline onAdd={onAdd} onAIGenerate={onAIGenerate} loading={loading} />;
  }

  return (
    <div className="space-y-4">
      {noTime.length > 0 && (
        <div className="bg-[#111127] border border-white/8 rounded-xl p-4">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">All Day / No Time</p>
          <div className="space-y-1.5">
            {noTime.map(item => {
              const cat = CAT_COLORS[item.category] ?? CAT_COLORS.other;
              return (
                <div key={item.id} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${cat.bg}`}>
                  {item.is_milestone && <Flag className="w-3 h-3 text-amber-400 shrink-0" />}
                  <p className={`text-xs font-semibold ${cat.text}`}>{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#111127] border border-white/8 rounded-xl overflow-hidden">
        {hours.map(h => {
          const timeStr = `${String(h).padStart(2, "0")}:`;
          const matched = hourItems.filter(i => i.item_time?.startsWith(timeStr));
          const label = h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`;
          const isPeakHour = h >= 9 && h <= 21;

          return (
            <div key={h} className={`flex border-b border-white/5 last:border-0 ${matched.length > 0 ? "bg-white/2" : ""}`}>
              <div className={`w-16 shrink-0 p-2.5 text-[11px] font-mono ${isPeakHour ? "text-gray-500" : "text-gray-700"} border-r border-white/5 flex items-start pt-2.5`}>
                {label}
              </div>
              <div className="flex-1 p-2 min-h-11 space-y-1">
                {matched.map(item => {
                  const cat = CAT_COLORS[item.category] ?? CAT_COLORS.other;
                  return (
                    <div key={item.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${cat.bg}`}>
                      {item.is_milestone && <Flag className="w-3 h-3 text-amber-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold tabular-nums ${cat.text}`}>{item.item_time}</span>
                          {item.duration_minutes && (
                            <span className="text-[10px] text-gray-500">{item.duration_minutes}min</span>
                          )}
                          <span className="text-xs text-white font-medium truncate">{item.title}</span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-gray-600" />
                            <span className="text-[10px] text-gray-500">{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const { projectId } = useParams();
  const { timeline, currentProject, aiGenerating, generateAITimeline } = usePlannerStore();
  const [view, setView] = useState("List");
  const [showAdd, setShowAdd] = useState(false);

  async function handleAIGenerate() {
    const res = await generateAITimeline(projectId);
    if (res?.success) toast.success(`Generated ${res.data?.length || 0} timeline items`);
    else toast.error(res?.error || "Failed to generate timeline");
  }

  const milestoneCount = timeline.filter(i => i.is_milestone).length;

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* View tabs */}
          <div className="flex gap-0.5 bg-white/5 rounded-xl p-1 border border-white/6">
            {VIEWS.map(v => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                    view === v.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Stats chips */}
          {timeline.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/6">
                {timeline.length} items
              </span>
              {milestoneCount > 0 && (
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> {milestoneCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAIGenerate}
            disabled={aiGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold border border-violet-500/20 transition-all disabled:opacity-60 active:scale-[0.97]"
          >
            {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Generate
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Views */}
      {view === "List" && (
        <ListView
          items={timeline}
          projectId={projectId}
          onAdd={() => setShowAdd(true)}
          onAIGenerate={handleAIGenerate}
          loading={aiGenerating}
        />
      )}
      {view === "Calendar" && (
        <CalendarView items={timeline} currentProject={currentProject} />
      )}
      {view === "Day-of" && (
        <DayOfView
          items={timeline}
          onAdd={() => setShowAdd(true)}
          onAIGenerate={handleAIGenerate}
          loading={aiGenerating}
        />
      )}

      {showAdd && <AddItemModal projectId={projectId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
