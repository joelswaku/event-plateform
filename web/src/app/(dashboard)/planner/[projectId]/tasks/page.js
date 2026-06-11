"use client";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  Plus, Trash2, GripVertical, X, Calendar, Loader2,
  Sparkles, CheckCircle2, LayoutGrid, List, Search, Check, ChevronDown,
  Flag, DollarSign, Tag, AlignLeft, User, Edit3, AlertTriangle, ChevronRight,
} from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Constants ──────────────────────────────────────────────────────────────

const COLS = [
  { id: "TODO",        label: "To Do",       dot: "#6b7280", accent: "border-gray-500/30",   bg: "bg-gray-500/5",   head: "text-gray-400"   },
  { id: "IN_PROGRESS", label: "In Progress",  dot: "#6366f1", accent: "border-indigo-500/30", bg: "bg-indigo-500/5", head: "text-indigo-400" },
  { id: "DONE",        label: "Done",         dot: "#10b981", accent: "border-emerald-500/30",bg: "bg-emerald-500/5",head: "text-emerald-400"},
  { id: "BLOCKED",     label: "Blocked",      dot: "#ef4444", accent: "border-red-500/30",    bg: "bg-red-500/5",    head: "text-red-400"    },
];

const COL_MAP = Object.fromEntries(COLS.map(c => [c.id, c]));

const PRIORITY = {
  HIGH:   { label: "High",   color: "#ef4444", cls: "text-red-400",   bg: "bg-red-500/15",   border: "border-l-red-500"    },
  MEDIUM: { label: "Medium", color: "#f59e0b", cls: "text-amber-400", bg: "bg-amber-500/15", border: "border-l-amber-500"  },
  LOW:    { label: "Low",    color: "#6b7280", cls: "text-gray-400",  bg: "bg-gray-500/15",  border: "border-l-gray-500"   },
};

const PHASES = [
  {
    id: "planning",
    label: "Planning & Admin",
    color: "#6366f1",
    keywords: ["plan","venue","budget","timeline","permit","licens","insur","admin","book","confirm","contract","negotiat","schedule","coordinat","organiz"],
  },
  {
    id: "vendors",
    label: "Vendors & Bookings",
    color: "#8b5cf6",
    keywords: ["cater","photo","video","music","band","dj","florist","flower","transport","hotel","accomm","vendor","hire","service","suppli","provider"],
  },
  {
    id: "design",
    label: "Design & Styling",
    color: "#ec4899",
    keywords: ["design","style","decor","invit","stationary","stationery","theme","color","dress","suit","attire","gown","jewel","ring","floral","table","linen","seating"],
  },
  {
    id: "guests",
    label: "Guests & Experience",
    color: "#f59e0b",
    keywords: ["guest","rsvp","seat","menu","food","drink","cake","gift","favor","program","speech","toast","entertainment","reception","welcome","wedding"],
  },
  {
    id: "logistics",
    label: "Day-of Logistics",
    color: "#10b981",
    keywords: ["setup","rehearsal","ceremony","arrival","depart","parking","security","tech","av","sound","light","signage","staff","final","run","checklist","morning"],
  },
];

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

function dueFmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(task) {
  return task.due_date && new Date(task.due_date) < new Date() && task.status !== "DONE";
}

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function assignPhase(task) {
  const text = `${task.title} ${task.category || ""}`.toLowerCase();
  for (const phase of PHASES) {
    if (phase.keywords.some(kw => text.includes(kw))) return phase;
  }
  return { id: "other", label: "Other Tasks", color: "#6b7280" };
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse p-5 gap-5">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/4" />)}
      </div>
      <div className="flex gap-4 overflow-hidden flex-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 min-w-52 space-y-2">
            <div className="h-10 rounded-xl bg-white/4" />
            {[...Array(5)].map((_, j) => <div key={j} className="h-7 rounded-lg bg-white/3" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty board ────────────────────────────────────────────────────────────

function EmptyBoard({ onAI, onAdd, loading }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Start building your task board</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
        Let AI generate a complete checklist tailored to your event type and timeline, or create tasks manually.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAI} disabled={loading}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-indigo-500/25"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate with AI
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-gray-300 hover:text-white hover:bg-white/6 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Manually
        </button>
      </div>
    </div>
  );
}

// ── Compact card — single-line sortable row for backlog ───────────────────

function CompactCard({ task, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  const pm      = PRIORITY[task.priority?.toUpperCase()] ?? PRIORITY.MEDIUM;
  const overdue = isOverdue(task);

  return (
    <div
      ref={setNodeRef} style={style}
      onClick={() => onClick(task)}
      className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/4 cursor-pointer transition-colors"
    >
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-500 transition-colors"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: pm.color, boxShadow: `0 0 5px ${pm.color}50` }}
      />
      <p className={`flex-1 text-[12px] font-medium leading-tight truncate min-w-0 ${overdue ? "text-red-300" : "text-gray-300"}`}>
        {task.title}
      </p>
      {task.due_date && (
        <span className={`text-[10px] tabular-nums shrink-0 font-semibold ${overdue ? "text-red-400" : "text-gray-600"}`}>
          {dueFmt(task.due_date)}
        </span>
      )}
      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-700 hover:text-red-400 transition-all"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ── Sortable card — full comfortable card ──────────────────────────────────

function SortableCard({ task, onDelete, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  const pm      = PRIORITY[task.priority?.toUpperCase()] ?? PRIORITY.MEDIUM;
  const overdue = isOverdue(task);
  const days    = daysUntil(task.due_date);

  return (
    <div
      ref={setNodeRef} style={style}
      onClick={() => onClick(task)}
      className={`group relative bg-[#0e0e1f] border border-white/8 hover:border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-lg hover:shadow-black/30 border-l-2 ${pm.border}`}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2 mb-2.5">
          <div
            {...attributes} {...listeners}
            onClick={e => e.stopPropagation()}
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-400 transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <p className="flex-1 text-sm font-semibold text-white leading-snug line-clamp-2 min-w-0">
            {task.title}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {task.description && (
          <p className="text-[11px] text-gray-500 line-clamp-1 mb-2.5 ml-5 leading-relaxed">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap ml-5">
          {task.category && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/12 text-indigo-400 border border-indigo-500/15 uppercase tracking-wide">
              {task.category}
            </span>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${pm.bg} ${pm.cls} border-transparent`}>
            {pm.label}
          </span>
          {task.due_date && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
              overdue ? "text-red-400" : days !== null && days <= 3 ? "text-amber-400" : "text-gray-500"
            }`}>
              <Calendar className="w-2.5 h-2.5" />
              {dueFmt(task.due_date)}
              {overdue && " · overdue"}
            </span>
          )}
          {task.estimated_cost > 0 && (
            <span className="text-[10px] text-gray-600 font-semibold">
              ${Number(task.estimated_cost).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      {task.progress > 0 && (
        <div className="h-0.5 bg-white/6">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${task.progress}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Phase accordion group ──────────────────────────────────────────────────

function PhaseGroup({ phase, tasks, density, onCardClick, onDelete }) {
  const [open,  setOpen]  = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  if (tasks.length === 0) return null;

  const visible   = tasks.slice(0, shown);
  const remaining = tasks.length - shown;

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ backgroundColor: `${phase.color}04` }}>
      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/3 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
        <span className="flex-1 text-[10px] font-black text-left uppercase tracking-widest text-gray-500">
          {phase.label}
        </span>
        <span
          className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0"
          style={{ backgroundColor: `${phase.color}18`, color: phase.color }}
        >
          {tasks.length}
        </span>
        <ChevronDown
          className="w-3 h-3 text-gray-700 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>

      {/* Tasks */}
      {open && (
        <div className={density === "compact" ? "px-1 pb-1" : "px-2 pb-2 space-y-1.5"}>
          {density === "compact"
            ? visible.map(t => (
                <CompactCard key={t.id} task={t} onClick={onCardClick} onDelete={onDelete} />
              ))
            : visible.map(t => (
                <SortableCard key={t.id} task={t} onClick={onCardClick} onDelete={onDelete} />
              ))
          }
          {remaining > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setShown(s => s + PAGE_SIZE); }}
              className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-300 transition-colors"
            >
              <span>Show {Math.min(remaining, PAGE_SIZE)} more</span>
              <span className="text-gray-700">·</span>
              <span className="tabular-nums">{remaining} remaining</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Smart Backlog Column (TODO) ────────────────────────────────────────────

function SmartBacklogColumn({ tasks, onDelete, onCardClick, addingCol, setAddingCol, newTitle, setNewTitle, onAdd }) {
  const col = COLS[0];

  const [colSearch, setColSearch] = useState("");
  const [density,   setDensity]   = useState("compact");
  const [groupBy,   setGroupBy]   = useState("phase");
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    if (!colSearch.trim()) return tasks;
    const q = colSearch.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.category || "").toLowerCase().includes(q)
    );
  }, [tasks, colSearch]);

  const groups = useMemo(() => {
    if (groupBy === "phase") {
      const map = new Map();
      for (const task of filtered) {
        const phase = assignPhase(task);
        if (!map.has(phase.id)) map.set(phase.id, { phase, tasks: [] });
        map.get(phase.id).tasks.push(task);
      }
      const phaseOrder = [...PHASES.map(p => p.id), "other"];
      return phaseOrder.map(id => map.get(id)).filter(Boolean);
    }
    if (groupBy === "priority") {
      return ["HIGH", "MEDIUM", "LOW"]
        .map(p => ({
          phase: { id: p, label: PRIORITY[p].label + " Priority", color: PRIORITY[p].color },
          tasks: filtered.filter(t => (t.priority?.toUpperCase() || "MEDIUM") === p),
        }))
        .filter(g => g.tasks.length > 0);
    }
    return [{ phase: { id: "all", label: "All Tasks", color: "#6b7280" }, tasks: filtered }];
  }, [filtered, groupBy]);

  const isAdding = addingCol === col.id;

  return (
    <div className="w-72 shrink-0 flex flex-col min-h-0 gap-2">
      {/* Column header card */}
      <div className={`shrink-0 rounded-xl border ${col.accent} ${col.bg} overflow-hidden`}>
        {/* Title row */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
            <span className={`text-xs font-bold uppercase tracking-wider ${col.head}`}>{col.label}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Muted count badge */}
            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-white/5 text-gray-600 mr-1">
              {tasks.length}
            </span>
            {/* Density toggle */}
            <button
              onClick={() => setDensity(d => d === "compact" ? "comfortable" : "compact")}
              title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
              className="p-1 rounded-md text-gray-600 hover:text-gray-200 hover:bg-white/8 transition-colors"
            >
              {density === "compact" ? <LayoutGrid className="w-3 h-3" /> : <List className="w-3 h-3" />}
            </button>
            {/* Collapse/expand */}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-1 rounded-md text-gray-600 hover:text-gray-200 hover:bg-white/8 transition-colors"
            >
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
              />
            </button>
            {/* Add */}
            <button
              onClick={() => { setCollapsed(false); setAddingCol(col.id); }}
              className={`p-1 rounded-md ${col.head} hover:bg-white/10 transition-colors`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* In-column controls */}
        {!collapsed && (
          <div className="px-2.5 pb-2.5 border-t border-white/5 pt-2.5 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
              <input
                value={colSearch}
                onChange={e => setColSearch(e.target.value)}
                placeholder="Filter backlog…"
                className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-black/30 border border-white/6 text-[11px] text-white placeholder:text-gray-700 outline-none focus:border-gray-500/40 transition-colors"
              />
              {colSearch && (
                <button
                  onClick={() => setColSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            {/* Group by pills */}
            <div className="flex gap-px p-0.5 rounded-lg bg-black/20 border border-white/5">
              {[["phase", "Phase"], ["priority", "Priority"], ["none", "Flat"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setGroupBy(v)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                    groupBy === v
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed pill */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="shrink-0 px-3 py-2 rounded-xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors"
        >
          <p className="text-[10px] text-gray-600 text-center">
            {tasks.length} tasks — click to expand
          </p>
        </button>
      )}

      {/* Phase groups — independently scrollable */}
      {!collapsed && (
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}
          >
            {groups.map(({ phase, tasks: phaseTasks }) => (
              <PhaseGroup
                key={phase.id}
                phase={phase}
                tasks={phaseTasks}
                density={density}
                onCardClick={onCardClick}
                onDelete={onDelete}
              />
            ))}
            {filtered.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-[11px] text-gray-600">
                  {colSearch ? "No tasks match your filter" : "No tasks yet"}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      )}

      {/* Quick add — pinned below scroll */}
      <div className="shrink-0">
        {isAdding ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus rows={2}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAdd(col.id); }
                if (e.key === "Escape") setAddingCol(null);
              }}
              placeholder="Task name… (Enter to add)"
              className="w-full bg-[#0e0e1f] border border-gray-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none resize-none leading-snug"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => onAdd(col.id)}
                className="flex-1 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold transition-colors"
              >
                Add task
              </button>
              <button
                onClick={() => { setAddingCol(null); setNewTitle(""); }}
                className="px-3 py-1.5 rounded-lg bg-white/6 text-gray-400 text-xs hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setCollapsed(false); setAddingCol(col.id); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/4 text-xs font-medium transition-colors w-full"
          >
            <Plus className="w-3.5 h-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

// ── Standard Kanban Column (IN_PROGRESS, DONE, BLOCKED) ───────────────────

function KanbanCol({ col, tasks, onDelete, onCardClick, addingCol, setAddingCol, newTitle, setNewTitle, onAdd }) {
  const isAdding = addingCol === col.id;
  const isEmpty  = tasks.length === 0 && !isAdding;

  return (
    <div className="w-72 shrink-0 flex flex-col min-h-0 gap-2">
      {/* Column header */}
      <div className={`shrink-0 flex items-center justify-between px-3 py-2.5 rounded-xl border ${col.accent} ${col.bg}`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
          <span className={`text-xs font-bold uppercase tracking-wider ${col.head}`}>{col.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {tasks.length > 0 && (
            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500">
              {tasks.length}
            </span>
          )}
          <button
            onClick={() => setAddingCol(col.id)}
            className={`p-0.5 rounded-md ${col.head} hover:bg-white/10 transition-colors`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards — independently scrollable */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
        >
          {tasks.map(t => (
            <SortableCard key={t.id} task={t} onDelete={onDelete} onClick={onCardClick} />
          ))}

          {/* Glassmorphism empty drop zone */}
          {isEmpty && (
            <div
              className="flex flex-col items-center justify-center min-h-48 rounded-2xl border-2 border-dashed transition-all"
              style={{
                borderColor: `${col.dot}22`,
                background: `radial-gradient(ellipse at 50% 55%, ${col.dot}07 0%, transparent 68%)`,
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 border"
                style={{
                  borderColor: `${col.dot}20`,
                  backgroundColor: `${col.dot}0a`,
                  boxShadow: `0 0 24px ${col.dot}0f`,
                }}
              >
                <Plus className="w-4 h-4" style={{ color: col.dot, opacity: 0.35 }} />
              </div>
              <p className="text-[11px] font-semibold" style={{ color: col.dot, opacity: 0.3 }}>
                Drag tasks here
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: col.dot, opacity: 0.18 }}>
                or click + above
              </p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Quick add — pinned below scroll */}
      <div className="shrink-0">
        {isAdding ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus rows={2}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAdd(col.id); }
                if (e.key === "Escape") setAddingCol(null);
              }}
              placeholder="Task name… (Enter to add)"
              className="w-full bg-[#0e0e1f] border border-indigo-500/40 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none resize-none leading-snug"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => onAdd(col.id)}
                className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Add task
              </button>
              <button
                onClick={() => { setAddingCol(null); setNewTitle(""); }}
                className="px-3 py-1.5 rounded-lg bg-white/6 text-gray-400 text-xs hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCol(col.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/4 text-xs font-medium transition-colors w-full"
          >
            <Plus className="w-3.5 h-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

// ── List Row ───────────────────────────────────────────────────────────────

function ListRow({ task, onDelete, onClick, onToggleDone }) {
  const pm      = PRIORITY[task.priority?.toUpperCase()] ?? PRIORITY.MEDIUM;
  const col     = COL_MAP[task.status] ?? COL_MAP.TODO;
  const overdue = isOverdue(task);
  const done    = task.status === "DONE";

  return (
    <>
      {/* Mobile card — shown below sm */}
      <div
        onClick={() => onClick(task)}
        className={`sm:hidden flex items-start gap-3 px-3 py-3 border-b border-white/5 last:border-0 cursor-pointer active:bg-white/4 transition-colors ${done ? "opacity-60" : ""}`}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(task); }}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
            done ? "bg-emerald-500 border-emerald-500" : "border-white/25 hover:border-emerald-500/60"
          }`}
        >
          {done && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${done ? "line-through text-gray-500" : "text-white"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${col.dot}20`, color: col.dot }}
            >
              {col.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pm.bg} ${pm.cls}`}>
              {pm.label}
            </span>
            {task.due_date && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${overdue ? "text-red-400" : "text-gray-500"}`}>
                {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
                {dueFmt(task.due_date)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />
      </div>

      {/* Desktop table row — hidden below sm */}
      <div
        onClick={() => onClick(task)}
        className="hidden sm:flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 cursor-pointer group transition-colors"
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(task); }}
          className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
            done ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-emerald-500/60"
          }`}
        >
          {done && <Check className="w-2.5 h-2.5 text-white" />}
        </button>
        <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: pm.color }} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${done ? "line-through text-gray-500" : "text-white"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[11px] text-gray-600 truncate mt-0.5">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.category && (
            <span className="hidden lg:block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/12 text-indigo-400 border border-indigo-500/15 uppercase">
              {task.category}
            </span>
          )}
          <span className={`hidden md:flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${pm.bg} ${pm.cls}`}>
            {pm.label}
          </span>
          <span
            className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${col.dot}20`, color: col.dot }}
          >
            {col.label}
          </span>
          {task.due_date && (
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${overdue ? "text-red-400" : "text-gray-500"}`}>
              {overdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {dueFmt(task.due_date)}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Task Detail Panel ──────────────────────────────────────────────────────

const FIELD_CLS = "w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors";

function DetailPanel({ task, projectId, onClose, onDelete }) {
  const { updateTask } = usePlannerStore();

  const [form, setForm] = useState({
    title:          task.title         || "",
    description:    task.description   || "",
    status:         task.status        || "TODO",
    priority:       task.priority?.toUpperCase() || "MEDIUM",
    due_date:       task.due_date      ? task.due_date.slice(0, 10) : "",
    category:       task.category      || "",
    estimated_cost: task.estimated_cost ?? "",
    assignee_name:  task.assignee_name  || "",
  });
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const f = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setSaved(false); };

  async function save() {
    setSaving(true);
    const res = await updateTask(projectId, task.id, { ...form, estimated_cost: form.estimated_cost || null });
    setSaving(false);
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else toast.error(res.error || "Failed to save");
  }

  async function doDelete() {
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
  }

  const overdue = isOverdue(task);

  return (
    <div className="fixed inset-0 z-50 sm:relative sm:inset-auto sm:z-auto w-full sm:w-80 shrink-0 border-0 sm:border-l border-white/8 bg-[#0b0b18] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-gray-500" />
          <p className="text-sm font-bold text-white">Task Details</p>
        </div>
        <div className="flex items-center gap-1">
          {overdue && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              Overdue
            </span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
          <textarea className={`${FIELD_CLS} resize-none leading-snug`} rows={2} value={form.title} onChange={f("title")} placeholder="Task title" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Description</span>
          </label>
          <textarea className={`${FIELD_CLS} resize-none`} rows={3} value={form.description} onChange={f("description")} placeholder="Add a description…" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <select className={FIELD_CLS} value={form.status} onChange={f("status")}>
              {COLS.map(c => <option key={c.id} value={c.id} className="bg-[#0b0b18]">{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> Priority</span>
            </label>
            <select className={FIELD_CLS} value={form.priority} onChange={f("priority")}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k} className="bg-[#0b0b18]">{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Date</span>
            </label>
            <input type="date" className={FIELD_CLS} value={form.due_date} onChange={f("due_date")} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Assignee</span>
            </label>
            <input className={FIELD_CLS} value={form.assignee_name} onChange={f("assignee_name")} placeholder="Name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Category</span>
            </label>
            <input className={FIELD_CLS} value={form.category} onChange={f("category")} placeholder="e.g. Venue" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Est. Cost</span>
            </label>
            <input type="number" className={FIELD_CLS} value={form.estimated_cost} onChange={f("estimated_cost")} placeholder="0.00" />
          </div>
        </div>
        {task.ai_generated && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/8 border border-violet-500/15">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[11px] text-violet-400 font-semibold">AI generated task</span>
          </div>
        )}
        <div className="pt-1 space-y-1 border-t border-white/6">
          <p className="text-[10px] text-gray-600">
            Created {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {task.completed_at && (
            <p className="text-[10px] text-emerald-600">
              Completed {new Date(task.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/8 space-y-2">
        <button
          onClick={save} disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4 text-emerald-300" /> Saved</>
          ) : (
            "Save Changes"
          )}
        </button>
        {confirmDel ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold active:opacity-60 transition-opacity">
              Cancel
            </button>
            <button onClick={doDelete} disabled={deleting}
              className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold border border-red-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-1">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" /> Delete</>}
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="w-full py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/8 text-xs font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete task
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { projectId } = useParams();
  const { tasks, loading, aiGenerating, createTask, deleteTask, updateTask, reorderTasks, generateAITasks } = usePlannerStore();

  const [view,         setView]         = useState("kanban");

  // Default to list view on mobile (kanban requires wide horizontal scroll)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setView("list");
    }
  }, []);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeId,     setActiveId]     = useState(null);
  const [addingCol,    setAddingCol]    = useState(null);
  const [newTitle,     setNewTitle]     = useState("");
  const [searchQ,      setSearchQ]      = useState("");
  const [filterPri,    setFilterPri]    = useState("all");
  const [sortBy,       setSortBy]       = useState("default");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const allTasks   = useMemo(() => Object.values(tasks).flat(), [tasks]);
  const totalTasks = allTasks.length;
  const donePct    = totalTasks > 0 ? Math.round(((tasks.DONE?.length ?? 0) / totalTasks) * 100) : 0;
  const overdue    = useMemo(() => allTasks.filter(isOverdue).length, [allTasks]);

  function filterList(list) {
    if (filterPri !== "all") list = list.filter(t => (t.priority?.toUpperCase() || "MEDIUM") === filterPri);
    if (searchQ.trim()) list = list.filter(t =>
      t.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchQ.toLowerCase())
    );
    return list;
  }

  const sortedAll = useMemo(() => {
    let list = filterList([...allTasks]);
    if (sortBy === "priority") {
      const ord = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      list.sort((a, b) => (ord[a.priority?.toUpperCase()] ?? 1) - (ord[b.priority?.toUpperCase()] ?? 1));
    } else if (sortBy === "due") {
      list.sort((a, b) => new Date(a.due_date || "9999-12-31") - new Date(b.due_date || "9999-12-31"));
    } else if (sortBy === "status") {
      const ord = { TODO: 0, IN_PROGRESS: 1, BLOCKED: 2, DONE: 3 };
      list.sort((a, b) => (ord[a.status] ?? 0) - (ord[b.status] ?? 0));
    }
    return list;
  }, [allTasks, sortBy, searchQ, filterPri]);

  function findTaskCol(id) {
    for (const col of COLS) {
      const t = (tasks[col.id] || []).find(t => t.id === id);
      if (t) return { task: t, colId: col.id };
    }
    return null;
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = findTaskCol(active.id);
    const to   = findTaskCol(over.id);
    if (!from || !to) return;
    if (from.colId === to.colId) {
      const col = [...(tasks[from.colId] || [])];
      const oi  = col.findIndex(t => t.id === active.id);
      const ni  = col.findIndex(t => t.id === over.id);
      if (oi !== -1 && ni !== -1) {
        await reorderTasks(projectId, from.colId, arrayMove(col, oi, ni).map(t => t.id));
      }
    } else {
      await updateTask(projectId, active.id, { status: to.colId });
    }
  }

  async function handleAddSubmit(status) {
    if (!newTitle.trim()) return;
    const res = await createTask(projectId, { title: newTitle.trim(), status });
    if (res.success) { setNewTitle(""); setAddingCol(null); }
    else toast.error("Failed to add task");
  }

  async function handleDelete(taskId) {
    const res = await deleteTask(projectId, taskId);
    if (!res.success) toast.error("Failed to delete");
    if (selectedTask?.id === taskId) setSelectedTask(null);
  }

  async function handleToggleDone(task) {
    await updateTask(projectId, task.id, { status: task.status === "DONE" ? "TODO" : "DONE" });
  }

  async function handleAI() {
    const res = await generateAITasks(projectId);
    if (res.success) toast.success(`Generated ${res.data?.length || 0} tasks`);
    else toast.error(res.error || "Generation failed");
  }

  const draggedTask = activeId ? findTaskCol(activeId)?.task : null;

  if (loading && totalTasks === 0) return <PageSkeleton />;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* ── Stats strip ── */}
        <div className="px-3 sm:px-5 pt-3 sm:pt-5 pb-0 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="col-span-2 md:col-span-1 bg-white/3 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black text-white leading-none">{donePct}%</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-semibold">Complete</p>
              </div>
              <div className="relative w-10 h-10 shrink-0">
                <svg className="-rotate-90 w-10 h-10">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <circle cx="20" cy="20" r="15" fill="none" stroke="#6366f1" strokeWidth="4"
                    strokeDasharray={`${(donePct / 100) * 94.2} 94.2`} strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.7s ease" }} />
                </svg>
              </div>
            </div>
            {[
              { label: "Total Tasks",  value: totalTasks,                     color: "text-white"       },
              { label: "In Progress",  value: tasks.IN_PROGRESS?.length ?? 0, color: "text-indigo-400"  },
              { label: "Overdue",      value: overdue,                        color: overdue > 0 ? "text-red-400" : "text-gray-600" },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
                <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {totalTasks > 0 && (
            <div className="mb-4">
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-2 bg-white/5">
                {COLS.map(col => {
                  const count = tasks[col.id]?.length ?? 0;
                  const pct   = Math.round((count / totalTasks) * 100);
                  return pct > 0 ? (
                    <div key={col.id} className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: col.dot }} />
                  ) : null;
                })}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {COLS.map(col => {
                  const count = tasks[col.id]?.length ?? 0;
                  if (!count) return null;
                  return (
                    <div key={col.id} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                      <span className="text-[10px] text-gray-500 font-semibold">{col.label}</span>
                      <span className="text-[10px] text-white font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="px-3 sm:px-5 mb-3 sm:mb-4 flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative flex-1 min-w-36 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors"
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex gap-0.5 bg-white/5 rounded-xl p-1 border border-white/6">
            {[["kanban", LayoutGrid, "Board"], ["list", List, "List"]].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                  view === id ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {["all", "HIGH", "MEDIUM", "LOW"].map(p => (
              <button key={p} onClick={() => setFilterPri(prev => prev === p ? "all" : p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                  filterPri === p ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white hover:bg-white/6"
                }`}
              >
                {p === "all" ? "All" : PRIORITY[p].label}
              </button>
            ))}
          </div>
          {view === "list" && (
            <select
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-white/5 border border-white/8 rounded-lg px-2.5 py-2 text-gray-400 outline-none focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="default"  className="bg-[#0b0b18]">Default</option>
              <option value="priority" className="bg-[#0b0b18]">Priority</option>
              <option value="due"      className="bg-[#0b0b18]">Due date</option>
              <option value="status"   className="bg-[#0b0b18]">Status</option>
            </select>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleAI} disabled={aiGenerating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/25 transition-all disabled:opacity-60 active:scale-[0.97]"
            >
              {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:block">AI Generate</span>
            </button>
            <button
              onClick={() => setAddingCol("TODO")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Add Task</span>
            </button>
          </div>
        </div>

        {/* ── Empty board ── */}
        {totalTasks === 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
            <EmptyBoard onAI={handleAI} onAdd={() => setAddingCol("TODO")} loading={aiGenerating} />
          </div>
        )}

        {/* ── Kanban board ── */}
        {view === "kanban" && totalTasks > 0 && (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-3 sm:px-5 pb-5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={({ active }) => setActiveId(active.id)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <div className="flex gap-4 h-full">
                {/* Smart backlog column for TODO */}
                <SmartBacklogColumn
                  tasks={filterList([...(tasks.TODO || [])])}
                  onDelete={handleDelete}
                  onCardClick={t => setSelectedTask(prev => prev?.id === t.id ? null : t)}
                  addingCol={addingCol}
                  setAddingCol={setAddingCol}
                  newTitle={newTitle}
                  setNewTitle={setNewTitle}
                  onAdd={handleAddSubmit}
                />
                {/* Standard columns for everything else */}
                {COLS.slice(1).map(col => (
                  <KanbanCol
                    key={col.id}
                    col={col}
                    tasks={filterList([...(tasks[col.id] || [])])}
                    onDelete={handleDelete}
                    onCardClick={t => setSelectedTask(prev => prev?.id === t.id ? null : t)}
                    addingCol={addingCol}
                    setAddingCol={setAddingCol}
                    newTitle={newTitle}
                    setNewTitle={setNewTitle}
                    onAdd={handleAddSubmit}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
                {draggedTask && (
                  <div className="bg-[#1a1a38] border border-indigo-500/50 rounded-xl p-3.5 shadow-2xl shadow-indigo-500/30 rotate-1 opacity-95 w-64">
                    <p className="text-sm text-white font-semibold line-clamp-2">{draggedTask.title}</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* ── List view ── */}
        {view === "list" && totalTasks > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-5 pb-5">
            <div className="bg-white/2 border border-white/8 rounded-2xl sm:rounded-2xl overflow-hidden">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-white/8 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <span className="w-4 shrink-0" />
                <span className="w-1 shrink-0" />
                <span className="flex-1">Task</span>
                <span className="hidden lg:block w-24 text-right">Category</span>
                <span className="hidden md:block w-16 text-right">Priority</span>
                <span className="w-20 text-right">Status</span>
                <span className="w-20 text-right">Due</span>
                <span className="w-6" />
              </div>
              {sortedAll.length > 0 ? (
                sortedAll.map(t => (
                  <ListRow
                    key={t.id}
                    task={t}
                    onDelete={handleDelete}
                    onClick={t => setSelectedTask(prev => prev?.id === t.id ? null : t)}
                    onToggleDone={handleToggleDone}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-gray-600 text-sm">No tasks match your filters</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedTask && (() => {
        const live = allTasks.find(t => t.id === selectedTask.id);
        if (!live) return null;
        return (
          <DetailPanel
            key={live.id}
            task={live}
            projectId={projectId}
            onClose={() => setSelectedTask(null)}
            onDelete={handleDelete}
          />
        );
      })()}
    </div>
  );
}
