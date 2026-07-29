



"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft, Crown, UserMinus, UserPlus,
  Loader2, X, Search, Check, ChevronDown,
} from "lucide-react";

import { useSeatingStore } from "@/store/seating.store";
import { useGuestStore }   from "@/store/guest.store";

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

/** Seat positions around an ellipse */
function ellipseSeats(count, rx, ry, cx, cy) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: cx + (rx + 44) * Math.cos(angle), y: cy + (ry + 44) * Math.sin(angle) };
  });
}

/** Seat positions on rectangle perimeter */
function rectSeats(count, w, h, cx, cy) {
  const perimeter = 2 * (w + h);
  const gap       = perimeter / count;
  return Array.from({ length: count }, (_, i) => {
    const d = gap * i;
    let x, y;
    if (d < w)              { x = cx - w / 2 + d;           y = cy - h / 2 - 44; }
    else if (d < w + h)     { x = cx + w / 2 + 44;          y = cy - h / 2 + (d - w); }
    else if (d < 2 * w + h) { x = cx + w / 2 - (d - w - h); y = cy + h / 2 + 44; }
    else                    { x = cx - w / 2 - 44;          y = cy + h / 2 - (d - 2 * w - h); }
    return { x, y };
  });
}

// ─── Seat SVG Element ─────────────────────────────────────────────────────────

function SeatEl({ pos, idx, guest, isOver, isMobile, selectedGuest, onDragOver, onDragLeave, onDrop, onRemove, onTapEmpty }) {
  const [hovered, setHovered] = useState(false);
  const bg = guest ? avatarBg(guest.full_name) : null;
  const isSelected = selectedGuest && !guest;
  const strokeColor = isOver ? "#6366f1" : isSelected ? "#10b981" : guest ? bg : "var(--svg-stroke)";
  const fillColor = guest ? bg : isOver ? "rgba(99,102,241,0.2)" : isSelected ? "rgba(16,185,129,0.2)" : "var(--svg-fill-subtle)";
  const showTooltip = guest && hovered && !isOver && !isMobile;
  const showName = guest && isMobile;
  const displayName = guest ? (guest.full_name.length > 14 ? guest.full_name.slice(0, 12) + "…" : guest.full_name) : "";

  return (
    <g transform={`translate(${pos.x},${pos.y})`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(idx); }}
      onClick={() => {
        if (guest) {
          onRemove(idx);
        } else if (selectedGuest) {
          onTapEmpty(idx);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: guest || selectedGuest ? "pointer" : "default" }}>

      <circle r={24}
        style={{ fill: fillColor, stroke: strokeColor, strokeWidth: isOver || isSelected ? 2 : 1.5, transition: "all 0.15s" }} />

      {guest ? (
        <>
          <text textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700"
            style={{ fill: "white", pointerEvents: "none" }}>
            {getInitials(guest.full_name)}
          </text>
          {guest.is_vip && (
            <text textAnchor="middle" y={-30} fontSize="10"
              style={{ fill: "#fbbf24", pointerEvents: "none" }}>👑</text>
          )}
          <text textAnchor="middle" y={32} fontSize="9" fontWeight="500"
            style={{ fill: "var(--svg-text-secondary)", pointerEvents: "none" }}>
            #{idx + 1}
          </text>
          {/* Full name on mobile or tooltip on desktop hover */}
          {showName && (
            <text textAnchor="middle" y={48} fontSize="9" fontWeight="600"
              style={{ fill: "var(--foreground)", opacity: 0.65, pointerEvents: "none" }}>
              {displayName}
            </text>
          )}
          {showTooltip && (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={-60} y={-58} width={120} height={22} rx={6}
                style={{ fill: "var(--card)", stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
              />
              <text textAnchor="middle" y={-43} fontSize="10" fontWeight="600"
                style={{ fill: "var(--foreground)", opacity: 0.85 }}>
                {guest.full_name.length > 16 ? guest.full_name.slice(0, 14) + "…" : guest.full_name}
              </text>
            </g>
          )}
          {/* X button - always show for clarity */}
          <g style={{ pointerEvents: "none" }}>
            <circle r={8} cx={18} cy={-18}
              style={{ fill: "#ef4444", stroke: "var(--card)", strokeWidth: 1.5 }} />
            <text textAnchor="middle" x={18} y={-14} fontSize="11" fontWeight="700"
              style={{ fill: "white" }}>×</text>
          </g>
        </>
      ) : (
        <>
          <text textAnchor="middle" dominantBaseline="central" fontSize="16"
            style={{ fill: isSelected ? "#10b981" : "var(--svg-text-placeholder)", pointerEvents: "none" }}>+</text>
          <text textAnchor="middle" y={34} fontSize="9" fontWeight="600"
            style={{ fill: isOver ? "#6366f1" : isSelected ? "#10b981" : "var(--svg-text-placeholder)", pointerEvents: "none" }}>
            {isOver ? "Drop" : `#${idx + 1}`}
          </text>
        </>
      )}
    </g>
  );
}

// ─── Table Shape ──────────────────────────────────────────────────────────────

function TableShape({ shape, w, h, cx, cy }) {
  const shapeStyle = { fill: "var(--svg-fill-subtle)", stroke: "var(--svg-stroke)", strokeWidth: 2 };
  if (shape === "rectangle") {
    return <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={20} style={shapeStyle} />;
  }
  if (shape === "custom") {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + w / 2 * Math.cos(a)},${cy + w / 2 * Math.sin(a)}`;
    }).join(" ");
    return <polygon points={pts} style={shapeStyle} />;
  }
  return <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} style={shapeStyle} />;
}

// ─── Draggable Guest Row ──────────────────────────────────────────────────────

function DragRow({ guest, onDragStart, isDragging, onTapSelect, isSelected, isMobile }) {
  return (
    <div
      draggable={!isMobile}
      onDragStart={() => !isMobile && onDragStart(guest)}
      onClick={() => isMobile && onTapSelect(guest)}
      className={`flex items-center rounded-xl border px-3 transition-all select-none ${
        isMobile ? "cursor-pointer active:scale-95" : "cursor-grab active:cursor-grabbing"
      } ${
        isDragging
          ? "gap-1.5 py-1.5 border-indigo-500/30 bg-indigo-500/10 opacity-50 scale-95"
          : isSelected
          ? "gap-2.5 py-2.5 border-emerald-500/40 bg-emerald-500/15"
          : "gap-2.5 py-2.5 border-foreground/[0.06] bg-foreground/[0.04] hover:bg-foreground/[0.08] hover:border-foreground/[0.12]"
      }`}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white transition-all"
        style={{
          width:      isDragging ? 20 : 28,
          height:     isDragging ? 20 : 28,
          background: avatarBg(guest.full_name),
          fontSize:   isDragging ? "9px" : "11px",
        }}
      >
        {getInitials(guest.full_name)}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-foreground/75 truncate flex items-center gap-1 transition-all ${isDragging ? "text-[10px]" : "text-[12px]"}`}>
          {guest.full_name}
          {guest.is_vip && <Crown size={isDragging ? 7 : 9} className="text-amber-400" />}
        </p>
        {!isDragging && guest.email && (
          <p className="text-[10px] text-foreground/30 truncate">{guest.email}</p>
        )}
      </div>
      {isSelected ? (
        <Check size={14} className="text-emerald-500 shrink-0" />
      ) : (
        <UserPlus size={isDragging ? 9 : 11} className="text-foreground/20 shrink-0 transition-all" />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TableDetailPage() {
  const { eventId, tableId } = useParams();
  const router               = useRouter();

  const {
    locations, assignments, loading, saving,
    fetchLocations, fetchAssignments,
    assignGuest, removeAssignment,
    getAssignmentsForLocation, getLocationById,
  } = useSeatingStore();

  const { guests, getGuests } = useGuestStore();

  const [dragging,   setDragging]   = useState(null);
  const [overSeat,   setOverSeat]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null); // For tap-to-assign on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [seatedExpanded, setSeatedExpanded] = useState(true); // Collapse for seated guests

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    const id = setTimeout(async () => {
      await Promise.all([
        fetchLocations(eventId),
        fetchAssignments(eventId),
        getGuests(eventId),
      ]);
    }, 0);
    return () => clearTimeout(id);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived
  const location    = getLocationById(tableId) ?? locations.find((l) => l.id === tableId);
  const tableAssign = getAssignmentsForLocation(tableId);
  const capacity    = location?.capacity || 8;
  const shape       = location?.shape || "round";

  const seatMap = {};
  tableAssign.forEach((a, idx) => {
    const si = a.seat_number ? parseInt(a.seat_number, 10) - 1 : idx;
    seatMap[si] = { assignment: a, guest: guests.find((g) => g.id === a.guest_id) };
  });

  const SW     = 620;
  const SH     = 540;
  const CX     = SW / 2;
  const CY     = SH / 2;
  const tableW = shape === "rectangle" ? Math.min(240, 50 + capacity * 16) : 160;
  const tableH = shape === "rectangle" ? 120 : 160;

  const seatPositions = shape === "rectangle"
    ? rectSeats(capacity, tableW, tableH, CX, CY)
    : ellipseSeats(capacity, tableW / 2, tableH / 2, CX, CY);

  const assignedIds   = new Set(assignments.map((a) => a.guest_id));
  const totalUnseated = guests.filter((g) => !assignedIds.has(g.id)).length;
  const unassigned    = guests
    .filter((g) => !assignedIds.has(g.id))
    .filter((g) => !search ||
      (g.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1;
      if (!a.is_vip && b.is_vip) return 1;
      return (a.full_name || "").localeCompare(b.full_name || "");
    });

  const filled      = tableAssign.length;
  const pct         = capacity > 0 ? Math.round((filled / capacity) * 100) : 0;
  const accentColor = pct >= 90 ? "#f43f5e" : pct >= 60 ? "#f59e0b" : "#10b981";

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleDrop(seatIdx) {
    setOverSeat(null);
    if (!dragging || !location) { setDragging(null); return; }
    if (seatMap[seatIdx])       { toast.error("Seat already taken"); setDragging(null); return; }
    if (filled >= capacity)     { toast.error("Table is full"); setDragging(null); return; }

    const r = await assignGuest(eventId, {
      guest_id:         dragging.id,
      seating_table_id: tableId,
      seat_number:      String(seatIdx + 1),
    });
    if (r.success) toast.success(`${dragging.full_name} → seat ${seatIdx + 1}`);
    setDragging(null);
  }

  async function handleRemoveSeat(seatIdx) {
    const entry = seatMap[seatIdx];
    if (!entry) return;
    setRemovingId(entry.assignment.id);
    await removeAssignment(eventId, entry.assignment.id);
    setRemovingId(null);
  }

  async function handleRemoveById(aId) {
    setRemovingId(aId);
    await removeAssignment(eventId, aId);
    setRemovingId(null);
  }

  async function handleTapEmpty(seatIdx) {
    if (!selectedGuest || !location) return;
    if (seatMap[seatIdx]) { toast.error("Seat already taken"); return; }
    if (filled >= capacity) { toast.error("Table is full"); return; }

    const r = await assignGuest(eventId, {
      guest_id: selectedGuest.id,
      seating_table_id: tableId,
      seat_number: String(seatIdx + 1),
    });
    if (r.success) {
      toast.success(`${selectedGuest.full_name} → seat ${seatIdx + 1}`);
      setSelectedGuest(null);
    }
  }

  function handleTapSelect(guest) {
    setSelectedGuest(selectedGuest?.id === guest.id ? null : guest);
  }

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading || !location) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-foreground/20" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-screen flex-col bg-background text-foreground pb-12">

      {/* Header */}
      <div className="flex items-center gap-4 pt-1 pb-5">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-[11px] font-semibold text-foreground/40 hover:bg-foreground/[0.08] hover:text-foreground/70 transition">
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-foreground truncate">{location.location_name}</h1>
          <p className="text-[11px] text-foreground/30 mt-0.5">
            {filled}/{capacity} seats ·&nbsp;
            <span style={{ color: accentColor }}>{capacity - filled} available</span>
            &nbsp;· {pct}% full
          </p>
        </div>
        <div className="hidden sm:flex flex-col gap-1 min-w-[130px]">
          <div className="h-1.5 rounded-full bg-foreground/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accentColor }} />
          </div>
          <span className="text-[10px] text-foreground/20 text-right">{pct}% capacity used</span>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">

        {/* ── SVG Canvas ── */}
        <div className="flex-1 relative flex flex-col items-center justify-center rounded-3xl border border-foreground/[0.07] bg-foreground/[0.02] overflow-hidden" style={{ minHeight: 480 }}>
          {/* Ambient */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${accentColor}09, transparent)` }} />

          <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" height="100%"
            style={{ maxHeight: 520 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { setOverSeat(null); setDragging(null); }}>

            <TableShape shape={shape} w={tableW} h={tableH} cx={CX} cy={CY} />

            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="13" fontWeight="700"
              style={{ fill: "var(--svg-label)" }}>
              {location.location_name}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10"
              style={{ fill: "var(--svg-text-secondary)" }}>
              {filled}/{capacity}
            </text>

            {seatPositions.map((pos, idx) => (
              <SeatEl key={idx} pos={pos} idx={idx}
                guest={seatMap[idx]?.guest ?? null}
                isOver={overSeat === idx}
                isMobile={isMobile}
                selectedGuest={selectedGuest}
                onDragOver={setOverSeat}
                onDragLeave={() => setOverSeat(null)}
                onDrop={handleDrop}
                onRemove={handleRemoveSeat}
                onTapEmpty={handleTapEmpty}
              />
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {(isMobile ? [
              { bg: "var(--svg-stroke)", label: "Empty" },
              { bg: "#10b981",           label: selectedGuest ? "Tap to assign" : "Occupied" },
            ] : [
              { bg: "var(--svg-stroke)", label: "Empty" },
              { bg: "#6366f1",           label: "Drop zone" },
              { bg: "#10b981",           label: "Occupied · click to remove" },
            ]).map(({ bg, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: bg }} />
                <span className="text-[9px] text-foreground/25 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3" style={{ maxHeight: "calc(100vh - 200px)" }}>

          {/* Seated at this table */}
          {tableAssign.length > 0 && (
            <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] overflow-hidden shrink-0">
              <button
                onClick={() => setSeatedExpanded(!seatedExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-foreground/[0.05] hover:bg-foreground/[0.04] transition">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">Seated Here</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold text-foreground/40">{tableAssign.length}</span>
                  <ChevronDown size={14} className={`text-foreground/30 transition-transform ${seatedExpanded ? "" : "-rotate-90"}`} />
                </div>
              </button>
              {seatedExpanded && (
                <div className="p-2 space-y-0.5 max-h-52 overflow-y-auto">
                  {tableAssign.map((a) => {
                    const g = guests.find((x) => x.id === a.guest_id);
                    return (
                      <div key={a.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-foreground/[0.05] group transition">
                        <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white text-[10px]"
                          style={{ width: 26, height: 26, background: avatarBg(g?.full_name || "") }}>
                          {getInitials(g?.full_name || "")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-foreground/65 truncate flex items-center gap-1">
                            {g?.full_name ?? "Unknown"}{g?.is_vip && <Crown size={9} className="text-amber-400" />}
                          </p>
                          {a.seat_number && <p className="text-[10px] text-foreground/25">Seat #{a.seat_number}</p>}
                        </div>
                        <button onClick={() => handleRemoveById(a.id)} disabled={removingId === a.id}
                          className="p-1 rounded-lg text-foreground/25 hover:bg-red-500/10 hover:text-red-400 transition">
                          {removingId === a.id ? <Loader2 size={11} className="animate-spin" /> : <X size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Unassigned — drag to seat */}
          <div className="flex-1 flex flex-col rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.05] shrink-0">
              <div>
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">
                  {isMobile ? "Tap to Select" : "Drag to Seat"}
                </span>
                <p className="text-[10px] text-foreground/25 mt-0.5">
                  {isMobile ? "Select guest, then tap empty seat" : "Drag onto an empty seat circle"}
                </p>
              </div>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold text-foreground/40">{totalUnseated}</span>
            </div>

            <div className="px-3 py-2.5 border-b border-foreground/[0.04] shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2">
                <Search size={12} className="text-foreground/25" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests…"
                  className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-foreground/20" />
                {search && (
                  <button onClick={() => setSearch("")}><X size={11} className="text-foreground/25" /></button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
              {unassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Check size={20} className="text-green-500/50" />
                  <p className="text-[11px] text-foreground/25 text-center">
                    {totalUnseated === 0 ? "All guests seated" : "No match"}
                  </p>
                </div>
              ) : (
                unassigned.map((g) => (
                  <DragRow
                    key={g.id}
                    guest={g}
                    onDragStart={setDragging}
                    isDragging={dragging?.id === g.id}
                    onTapSelect={handleTapSelect}
                    isSelected={selectedGuest?.id === g.id}
                    isMobile={isMobile}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag indicator */}
      {dragging && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-sm pointer-events-none">
          <UserPlus size={13} className="text-indigo-400" />
          <span className="text-[12px] font-semibold text-foreground/70">
            Dragging <span className="text-foreground">{dragging.full_name}</span> — drop onto a seat
          </span>
        </div>
      )}

      {/* Tap-to-assign indicator (mobile) */}
      {selectedGuest && isMobile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-sm">
          <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white text-[10px]"
            style={{ width: 24, height: 24, background: avatarBg(selectedGuest.full_name) }}>
            {getInitials(selectedGuest.full_name)}
          </span>
          <span className="text-[12px] font-semibold text-foreground/70">
            <span className="text-foreground">{selectedGuest.full_name}</span> selected — tap empty seat
          </span>
          <button onClick={() => setSelectedGuest(null)} className="p-1 rounded hover:bg-foreground/10 transition">
            <X size={12} className="text-foreground/40" />
          </button>
        </div>
      )}
    </div>
  );
}