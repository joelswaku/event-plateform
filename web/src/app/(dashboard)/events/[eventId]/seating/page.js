"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Edit3, Zap, RotateCcw, ChevronRight,
  X, Check, Search, Circle, Square, Hexagon, LayoutGrid,
  List, AlertCircle, Loader2, Crown, UserCheck, ArrowRight,
  Eye, EyeOff, Users, ArrowUpRight,
} from "lucide-react";

import { useSeatingStore } from "@/store/seating.store";
import { useGuestStore }   from "@/store/guest.store";
import { useEventStore }   from "@/store/event.store";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHAPES = [
  { value: "round",     label: "Round",     Icon: Circle  },
  { value: "rectangle", label: "Rectangle", Icon: Square  },
  { value: "custom",    label: "Custom",    Icon: Hexagon },
];

const AUTO_OPTIONS = [
  { key: "prioritize_vip",       label: "Prioritise VIP guests",         desc: "VIP guests get first pick of seats"             },
  { key: "keep_groups_together", label: "Keep groups together",           desc: "Guests in same group sit at same table"         },
  { key: "assign_seat_numbers",  label: "Assign seat numbers",            desc: "Auto-number seats within each table"            },
  { key: "overwrite_existing",   label: "Overwrite existing assignments", desc: "Clear current assignments before running"       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

function avatarBg(name) {
  const p = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981","#3b82f6","#f43f5e"];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (name || "").charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function applyFilter(guests, excludeIds, q) {
  return guests
    .filter((g) => !excludeIds.has(g.id))
    .filter((g) => !q ||
      (g.full_name || "").toLowerCase().includes(q.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1;
      if (!a.is_vip && b.is_vip) return 1;
      return (a.full_name || "").localeCompare(b.full_name || "");
    });
}

function deriveStats(locs, assigns) {
  const cap  = locs.reduce((s, l) => s + (l.capacity || 0), 0);
  const asgn = assigns.length;
  return {
    cap, asgn,
    free:   Math.max(0, cap - asgn),
    rate:   cap > 0 ? Math.round((asgn / cap) * 100) : 0,
    tables: locs.length,
  };
}

// ─── GuestAvatar ──────────────────────────────────────────────────────────────

function GuestAvatar({ name, size = 32, vip }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, background: avatarBg(name), fontSize: size * 0.36 }}>
      {getInitials(name)}
      {vip && <Crown className="absolute -top-1 -right-1 text-amber-400 drop-shadow" size={10} />}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.04] px-5 py-4 backdrop-blur-sm">
      <span className="text-2xl font-black" style={{ color: accent }}>{value}</span>
      <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">{label}</span>
      {sub && <span className="text-[11px] text-foreground/25 mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── TableCard ────────────────────────────────────────────────────────────────

function TableCard({ loc, assigns, guests, onEdit, onDelete, onAssign, onRemove, onClick }) {
  const [expanded, setExpanded] = useState(false);

  const filled  = assigns.length;
  const cap     = loc.capacity || 0;
  const pct     = cap > 0 ? Math.round((filled / cap) * 100) : 0;
  const isFull  = filled >= cap;
  const accent  = pct >= 90 ? "#f43f5e" : pct >= 60 ? "#f59e0b" : "#10b981";

  const enriched = assigns.map((a) => ({ ...a, g: guests.find((x) => x.id === a.guest_id) }));

  return (
    <div className="group relative flex flex-col rounded-2xl border border-foreground/[0.07] bg-foreground/[0.035] backdrop-blur-sm overflow-hidden transition-all hover:border-foreground/[0.14] hover:bg-foreground/[0.055]">
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => onClick(loc)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}20` }}>
            {loc.shape === "rectangle" ? <Square size={15} style={{ color: accent }} />
              : loc.shape === "custom"  ? <Hexagon size={15} style={{ color: accent }} />
              : <Circle size={15} style={{ color: accent }} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground/90 truncate group-hover:text-foreground transition">{loc.location_name}</p>
            <p className="text-[11px] text-foreground/35">{filled}/{cap} seats · {pct}% full</p>
          </div>
          <ArrowUpRight size={13} className="shrink-0 text-foreground/20 group-hover:text-foreground/50 transition ml-auto" />
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onEdit(loc)} className="rounded-lg p-1.5 text-foreground/25 hover:bg-foreground/10 hover:text-foreground/70 transition"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(loc.id)} className="rounded-lg p-1.5 text-foreground/25 hover:bg-red-500/20 hover:text-red-400 transition"><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="mx-4 mb-3 h-1 rounded-full bg-foreground/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
      </div>

      {enriched.length > 0 && (
        <div className="px-4 pb-3">
          <button
            className="flex w-full items-center justify-between rounded-xl bg-foreground/[0.05] border border-foreground/[0.06] px-3 py-2 hover:bg-foreground/[0.09] transition"
            onClick={() => setExpanded((v) => !v)}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {enriched.slice(0, 5).map(({ g, guest_id }) => (
                  <GuestAvatar key={guest_id} name={g?.full_name ?? "?"} vip={g?.is_vip} size={20} />
                ))}
                {enriched.length > 5 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/15 text-[9px] font-bold text-foreground/60">+{enriched.length - 5}</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-foreground/50">{enriched.length} guest{enriched.length !== 1 ? "s" : ""}</span>
            </div>
            <ChevronRight size={11} className={`text-foreground/30 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>

          {expanded && (
            <div className="mt-1.5 space-y-0.5 max-h-44 overflow-y-auto rounded-xl bg-foreground/[0.05] border border-foreground/[0.05] p-1.5">
              {enriched.map(({ id: assignment_id, guest_id, seat_number, g }) => (
                <div key={assignment_id ?? guest_id} className="flex items-center justify-between rounded-lg px-2 py-1.5 group/r hover:bg-foreground/[0.05]">
                  <div className="flex items-center gap-2 min-w-0">
                    <GuestAvatar name={g?.full_name ?? "?"} vip={g?.is_vip} size={22} />
                    <span className="text-[11px] font-medium text-foreground/70 truncate">{g?.full_name ?? "Unknown"}</span>
                    {seat_number && <span className="rounded px-1 py-px text-[9px] font-mono bg-foreground/10 text-foreground/40">#{seat_number}</span>}
                  </div>
                  <button onClick={() => onRemove(assignment_id)} className="invisible group-hover/r:visible p-1 rounded text-foreground/20 hover:text-red-400 transition"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isFull ? (
        <div className="px-4 pb-4">
          <button onClick={() => onAssign(loc)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-[11px] font-semibold transition hover:bg-foreground/[0.06]"
            style={{ borderColor: `${accent}50`, color: accent }}>
            <Plus size={11} /> Add Guest
          </button>
        </div>
      ) : (
        <div className="mx-4 mb-4 flex items-center justify-center gap-1 rounded-xl bg-foreground/[0.04] py-2">
          <UserCheck size={11} className="text-foreground/25" />
          <span className="text-[11px] font-medium text-foreground/30">Full</span>
        </div>
      )}
    </div>
  );
}

// ─── LocationModal ────────────────────────────────────────────────────────────

function LocationModal({ open, onClose, onSave, initial, saving }) {
  const [name,     setName]     = useState("");
  const [capacity, setCapacity] = useState(8);
  const [shape,    setShape]    = useState("round");

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setName(initial ? initial.location_name || "" : "");
      setCapacity(initial ? initial.capacity || 8 : 8);
      setShape(initial ? initial.shape || "round" : "round");
    }, 0);
    return () => clearTimeout(id);
  }, [open, initial]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Table name required"); return; }
    if (capacity < 1) { toast.error("Capacity must be ≥ 1"); return; }
    onSave({ table_name: name.trim(), capacity: Number(capacity), shape });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-foreground/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-5">
          <h2 className="text-base font-bold text-foreground">{initial ? "Edit Table" : "Add Table / Zone"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-foreground/10 transition"><X size={15} className="text-foreground/50" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-foreground/40 mb-2 uppercase tracking-widest">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Table 1, VIP Stage…"
              className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.05] px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-foreground/40 mb-2 uppercase tracking-widest">Capacity</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.05] text-foreground/60 hover:bg-foreground/10 transition text-lg font-bold">−</button>
              <input type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-20 rounded-xl border border-foreground/10 bg-foreground/[0.05] px-3 py-2.5 text-center text-sm font-bold text-foreground focus:border-indigo-500/60 focus:outline-none transition" />
              <button type="button" onClick={() => setCapacity((c) => Math.min(500, c + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.05] text-foreground/60 hover:bg-foreground/10 transition text-lg font-bold">+</button>
              <span className="text-xs text-foreground/25">max 500</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-foreground/40 mb-2 uppercase tracking-widest">Shape</label>
            <div className="flex gap-2">
              {SHAPES.map(({ value, label, Icon }) => (
                <button key={value} type="button" onClick={() => setShape(value)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                    shape === value ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300" : "border-foreground/10 text-foreground/40 hover:bg-foreground/[0.05]"}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-foreground/10 py-3 text-sm font-semibold text-foreground/50 hover:bg-foreground/[0.05] transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AssignModal ──────────────────────────────────────────────────────────────

function AssignModal({ open, onClose, target, guests, assignments, onAssign, saving }) {
  const [q,       setQ]       = useState("");
  const [seatNum, setSeatNum] = useState("");
  const [picked,  setPicked]  = useState(null);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => { setQ(""); setSeatNum(""); setPicked(null); }, 0);
    return () => clearTimeout(id);
  }, [open, target]);

  if (!open) return null;

  const assignedIds = new Set(assignments.map((a) => a.guest_id));
  const atTable     = assignments.filter((a) => a.seating_table_id === target?.id).length;
  const spots       = (target?.capacity ?? 0) - atTable;
  const list        = applyFilter(guests, assignedIds, q);
  const totalFree   = guests.filter((g) => !assignedIds.has(g.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex h-[600px] w-full max-w-md flex-col rounded-3xl border border-foreground/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Assign Guest</h2>
            <p className="text-[11px] text-foreground/35 mt-0.5">
              → <span className="text-foreground/60 font-semibold">{target?.location_name}</span> · {spots} spot{spots !== 1 ? "s" : ""} left
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-foreground/10 transition"><X size={15} className="text-foreground/50" /></button>
        </div>

        <div className="px-6 py-3 border-b border-foreground/[0.04] shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2.5">
            <Search size={13} className="text-foreground/30" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search unassigned guests…"
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-foreground/25" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="rounded-2xl bg-foreground/[0.05] p-4"><Users size={22} className="text-foreground/25" /></div>
              <p className="text-sm text-foreground/30">{totalFree === 0 ? "All guests are assigned" : "No guests match search"}</p>
            </div>
          ) : list.map((g) => (
            <button key={g.id} onClick={() => setPicked((p) => p?.id === g.id ? null : g)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                picked?.id === g.id ? "bg-indigo-500/15 border border-indigo-500/30" : "hover:bg-foreground/[0.05] border border-transparent"}`}>
              <GuestAvatar name={g.full_name} vip={g.is_vip} size={34} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground/80 truncate flex items-center gap-1.5">
                  {g.full_name}{g.is_vip && <Crown size={11} className="text-amber-400" />}
                </p>
                {g.email && <p className="text-[11px] text-foreground/35 truncate">{g.email}</p>}
              </div>
              {picked?.id === g.id && <Check size={13} className="text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>

        <div className="border-t border-foreground/[0.06] px-6 py-4 space-y-3 shrink-0">
          {picked && (
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-semibold text-foreground/35 whitespace-nowrap">Seat # (opt.)</label>
              <input value={seatNum} onChange={(e) => setSeatNum(e.target.value)} placeholder="A1, 12…"
                className="flex-1 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 rounded-xl border border-foreground/10 py-3 text-sm font-semibold text-foreground/40 hover:bg-foreground/[0.05] transition">Cancel</button>
            <button
              onClick={() => { if (picked && target) onAssign({ guest_id: picked.id, seating_table_id: target.id, seat_number: seatNum.trim() || undefined }); }}
              disabled={!picked || saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-40">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />} Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AutoModal ────────────────────────────────────────────────────────────────

function AutoModal({ open, onClose, onRun, saving }) {
  const [vip,   setVip]   = useState(true);
  const [grp,   setGrp]   = useState(true);
  const [seats, setSeats] = useState(true);
  const [over,  setOver]  = useState(false);

  if (!open) return null;

  const vals = { prioritize_vip: vip, keep_groups_together: grp, assign_seat_numbers: seats, overwrite_existing: over };
  const togglers = {
    prioritize_vip:       () => setVip((v) => !v),
    keep_groups_together: () => setGrp((v) => !v),
    assign_seat_numbers:  () => setSeats((v) => !v),
    overwrite_existing:   () => setOver((v) => !v),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-foreground/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15"><Zap size={15} className="text-indigo-400" /></div>
            <div>
              <h2 className="text-base font-bold text-foreground">Auto-Assign Seats</h2>
              <p className="text-[11px] text-foreground/35">Smart seating optimization</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-foreground/10 transition"><X size={15} className="text-foreground/50" /></button>
        </div>
        <div className="p-6 space-y-2">
          {AUTO_OPTIONS.map(({ key, label, desc }) => (
            <button key={key} onClick={togglers[key]}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                vals[key] ? "border-indigo-500/30 bg-indigo-500/10" : "border-foreground/[0.06] hover:bg-foreground/[0.04]"}`}>
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                vals[key] ? "border-indigo-500 bg-indigo-500" : "border-foreground/20"}`}>
                {vals[key] && <Check size={10} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/80">{label}</p>
                <p className="text-[11px] text-foreground/35 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
          {over && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-300/80">All existing assignments will be cleared before re-assigning.</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-foreground/[0.06] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-foreground/10 py-3 text-sm font-semibold text-foreground/40 hover:bg-foreground/[0.05] transition">Cancel</button>
          <button onClick={() => onRun(vals)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />} Run
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UnassignedPanel ──────────────────────────────────────────────────────────

function UnassignedPanel({ guests, assignments, locations, onSeat }) {
  const [q, setQ] = useState("");
  const ids    = new Set(assignments.map((a) => a.guest_id));
  const list   = applyFilter(guests, ids, q);
  const total  = guests.filter((g) => !ids.has(g.id)).length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] overflow-hidden">
      <div className="border-b border-foreground/[0.06] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">Unassigned</span>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold text-foreground/40">{total}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2">
          <Search size={12} className="text-foreground/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-foreground/20" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <UserCheck size={20} className="text-green-500/60" />
            <p className="text-[11px] text-foreground/25 text-center">{total === 0 ? "All guests seated 🎉" : "No match"}</p>
          </div>
        ) : list.map((g) => (
          <div key={g.id} className="group flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-foreground/[0.05] transition">
            <GuestAvatar name={g.full_name} vip={g.is_vip} size={26} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground/65 truncate flex items-center gap-1">
                {g.full_name}{g.is_vip && <Crown size={9} className="text-amber-400" />}
              </p>
              {g.email && <p className="text-[10px] text-foreground/25 truncate">{g.email}</p>}
            </div>
            {locations.length > 0 && (
              <button onClick={() => onSeat(g)}
                className="invisible group-hover:visible rounded-lg bg-indigo-500/20 px-2 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/30 transition shrink-0">
                Seat
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({ open, onClose, onConfirm, saving, count }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-foreground/10 bg-card shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15"><AlertCircle size={17} className="text-red-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Clear all assignments?</h3>
            <p className="text-[11px] text-foreground/35">Removes {count} assignment{count !== 1 ? "s" : ""}.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-foreground/10 py-2.5 text-sm font-semibold text-foreground/40 hover:bg-foreground/[0.05] transition">Cancel</button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeatingPage() {
  const { eventId } = useParams();
  const router      = useRouter();

  const {
    locations, assignments, saving,
    fetchLocations, fetchAssignments,
    createLocation, updateLocation, deleteLocation,
    assignGuest, removeAssignment,
    autoAssign, clearAllAssignments,
    getAssignmentsForLocation,
  } = useSeatingStore();

  const { guests, getGuests }   = useGuestStore();
  const { events, fetchEvents } = useEventStore();
  const event = events.find((e) => e.id === eventId);

  const [initializing, setInitializing] = useState(true);
  const [view,    setView]    = useState("grid");
  const [locMod,  setLocMod]  = useState(false);
  const [editLoc, setEditLoc] = useState(null);
  const [asgMod,  setAsgMod]  = useState(false);
  const [asgTgt,  setAsgTgt]  = useState(null);
  const [autoMod, setAutoMod] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [panel,   setPanel]   = useState(true);

  useEffect(() => {
    if (!eventId) return;
    const run = async () => {
      setInitializing(true);
      await Promise.all([
        fetchLocations(eventId),
        fetchAssignments(eventId),
        getGuests(eventId),
      ]);
      setInitializing(false);
      if (!event) fetchEvents();
    };
    const id = setTimeout(run, 0);
    return () => clearTimeout(id);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = deriveStats(locations, assignments);

  async function saveLocation(payload) {
    if (editLoc) {
      const r = await updateLocation(eventId, editLoc.id, payload);
      if (r.success) { setLocMod(false); setEditLoc(null); }
    } else {
      const r = await createLocation(eventId, payload);
      if (r.success) setLocMod(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this table and all its seat assignments?")) return;
    await deleteLocation(eventId, id);
  }

  async function handleAssign(payload) {
    if (!asgTgt) { toast.error("No table selected"); return; }
    const r = await assignGuest(eventId, { ...payload, seating_table_id: asgTgt.id });
    if (r.success) { setAsgMod(false); setAsgTgt(null); }
  }

  async function handleAutoAssign(opts) {
    const r = await autoAssign(eventId, opts);
    if (r.success) { setAutoMod(false); await fetchAssignments(eventId); }
  }

  async function handleClearAll() {
    const r = await clearAllAssignments(eventId);
    if (r.success) setConfirm(false);
  }

  return (
    <div className="flex h-full flex-col gap-5 min-h-screen bg-background text-foreground pb-10">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-foreground">Seating Chart</h1>
          <p className="text-sm text-foreground/35 mt-0.5">{event?.title ?? "Event"} · Click a table to open the seat map</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-foreground/10 bg-foreground/[0.04] p-1">
            <button onClick={() => setView("grid")} className={`rounded-lg p-2 transition ${view === "grid" ? "bg-foreground/15 text-foreground" : "text-foreground/30 hover:text-foreground/60"}`}><LayoutGrid size={13} /></button>
            <button onClick={() => setView("list")} className={`rounded-lg p-2 transition ${view === "list" ? "bg-foreground/15 text-foreground" : "text-foreground/30 hover:text-foreground/60"}`}><List size={13} /></button>
          </div>
          <button onClick={() => setPanel((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-[11px] font-semibold text-foreground/40 hover:bg-foreground/[0.08] transition">
            {panel ? <EyeOff size={12} /> : <Eye size={12} />} {panel ? "Hide" : "Show"} Panel
          </button>
          {assignments.length > 0 && (
            <button onClick={() => setConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition">
              <RotateCcw size={12} /> Clear All
            </button>
          )}
          <button onClick={() => setAutoMod(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-3 py-2 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/25 transition">
            <Zap size={12} /> Auto-Assign
          </button>
          <button onClick={() => { setEditLoc(null); setLocMod(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[11px] font-bold text-background hover:bg-foreground/90 transition">
            <Plus size={12} /> Add Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Capacity" value={stats.cap}  accent="#6366f1" sub={`${stats.tables} table${stats.tables !== 1 ? "s" : ""}`} />
        <StatCard label="Assigned"       value={stats.asgn} accent="#10b981" sub={`${stats.rate}% fill rate`} />
        <StatCard label="Available"      value={stats.free} accent={stats.free > 0 ? "#f59e0b" : "#10b981"} sub={stats.free === 0 ? "All seated!" : "seats remaining"} />
        <StatCard label="Fill Rate"      value={`${stats.rate}%`}
          accent={stats.rate >= 80 ? "#f43f5e" : stats.rate >= 50 ? "#f59e0b" : "#10b981"}
          sub={stats.rate >= 90 ? "Almost full" : stats.rate >= 50 ? "Filling up" : "Plenty of space"} />
      </div>

      {/* Content */}
      {initializing ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={26} className="animate-spin text-foreground/20" />
            <p className="text-sm text-foreground/30">Loading seating chart…</p>
          </div>
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-foreground/[0.07] bg-foreground/[0.025] p-12 text-center max-w-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/[0.05]"><LayoutGrid size={26} className="text-foreground/25" /></div>
            <div>
              <h3 className="text-base font-bold text-foreground/80">No tables yet</h3>
              <p className="text-sm text-foreground/35 mt-1 leading-relaxed">Create your first table to start building the seating chart.</p>
            </div>
            <button onClick={() => { setEditLoc(null); setLocMod(true); }}
              className="flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-background hover:bg-foreground/90 transition">
              <Plus size={14} /> Add First Table
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <div className={view === "grid"
              ? "grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "flex flex-col gap-2.5"}>
              {locations.map((loc) => (
                <TableCard key={loc.id} loc={loc}
                  assigns={getAssignmentsForLocation(loc.id)}
                  guests={guests}
                  onEdit={(l) => { setEditLoc(l); setLocMod(true); }}
                  onDelete={handleDelete}
                  onAssign={(l) => { setAsgTgt(l); setAsgMod(true); }}
                  onRemove={(id) => removeAssignment(eventId, id)}
                  onClick={(l) => router.push(`/events/${eventId}/seating/${l.id}`)}
                />
              ))}
              <button onClick={() => { setEditLoc(null); setLocMod(true); }}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/10 p-8 text-foreground/20 hover:border-foreground/20 hover:bg-foreground/[0.02] hover:text-foreground/40 transition min-h-[120px]">
                <Plus size={18} /><span className="text-[11px] font-semibold">Add Table</span>
              </button>
            </div>
          </div>

          {panel && guests.length > 0 && (
            <div className="w-60 shrink-0 hidden lg:flex flex-col" style={{ maxHeight: "calc(100vh - 260px)" }}>
              <UnassignedPanel guests={guests} assignments={assignments} locations={locations}
                onSeat={() => { setAsgTgt(locations.length === 1 ? locations[0] : null); setAsgMod(true); }} />
            </div>
          )}
        </div>
      )}

      <LocationModal open={locMod} onClose={() => { setLocMod(false); setEditLoc(null); }} onSave={saveLocation} initial={editLoc} saving={saving} />
      <AssignModal   open={asgMod} onClose={() => { setAsgMod(false); setAsgTgt(null); }} target={asgTgt} guests={guests} assignments={assignments} onAssign={handleAssign} saving={saving} />
      <AutoModal     open={autoMod} onClose={() => setAutoMod(false)} onRun={handleAutoAssign} saving={saving} />
      <ConfirmModal  open={confirm} onClose={() => setConfirm(false)} onConfirm={handleClearAll} saving={saving} count={assignments.length} />
    </div>
  );
}
