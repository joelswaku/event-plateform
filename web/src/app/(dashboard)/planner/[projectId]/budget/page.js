"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  Plus, Trash2, Loader2, X, TrendingUp, AlertTriangle,
  CheckCircle, DollarSign, Sparkles, PieChart, List,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import toast from "react-hot-toast";

const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID"];
const PAYMENT_META = {
  UNPAID:  { cls: "bg-gray-500/20 text-gray-400",     label: "Unpaid"  },
  PARTIAL: { cls: "bg-amber-500/20 text-amber-400",   label: "Partial" },
  PAID:    { cls: "bg-emerald-500/20 text-emerald-400", label: "Paid"   },
};

const CAT_PALETTE = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b",
  "#10b981","#06b6d4","#3b82f6","#a78bfa","#fb923c",
];

function DonutChart({ segments, size = 140 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 28) / 2;
  const circ = 2 * Math.PI * r;

  let cumulative = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.pct / 100) * circ;
    const offset = circ - cumulative * circ / 100;
    cumulative += seg.pct;
    return { ...seg, dash, offset };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={14}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      ))}
    </svg>
  );
}

function BudgetSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="bg-white/5 rounded-xl h-20" />)}
      </div>
      <div className="bg-white/5 rounded-2xl h-40" />
      <div className="bg-white/5 rounded-2xl h-60" />
    </div>
  );
}

function EmptyBudget({ onAdd, onAIGenerate, loading }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
        <DollarSign className="w-7 h-7 text-emerald-400" />
      </div>
      <p className="text-white font-bold text-base mb-1">No budget items yet</p>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Let AI break down your event budget by category — venue, catering, décor, photography, and more.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAIGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-indigo-600 hover:brightness-110 text-white text-sm font-bold transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Budget Breakdown
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 hover:bg-white/10 text-white text-sm font-semibold transition-all border border-white/10"
        >
          <Plus className="w-4 h-4" />
          Add Manually
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ projectId, onClose }) {
  const { createBudgetItem } = usePlannerStore();
  const [form, setForm] = useState({
    title: "", category: "", vendor_name: "",
    estimated_cost: "", actual_cost: "", paid_amount: "",
    payment_status: "UNPAID", currency: "USD", due_date: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await createBudgetItem(projectId, form);
    setSaving(false);
    if (res.success) { toast.success("Budget item added"); onClose(); }
    else toast.error(res.error || "Failed to add item");
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Add Budget Item</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <input className={inp} placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inp} placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <input className={inp} placeholder="Vendor" value={form.vendor_name} onChange={e => setForm(p => ({ ...p, vendor_name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" className={inp} placeholder="Estimated" value={form.estimated_cost} onChange={e => setForm(p => ({ ...p, estimated_cost: e.target.value }))} />
          <input type="number" className={inp} placeholder="Actual" value={form.actual_cost} onChange={e => setForm(p => ({ ...p, actual_cost: e.target.value }))} />
          <input type="number" className={inp} placeholder="Paid" value={form.paid_amount} onChange={e => setForm(p => ({ ...p, paid_amount: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className={inp} value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s} className="bg-[#111127]">{PAYMENT_META[s].label}</option>)}
          </select>
          <input type="date" className={inp} value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
        </div>
        <textarea className={`${inp} h-16 resize-none`} placeholder="Notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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

export default function BudgetPage() {
  const { projectId } = useParams();
  const { budget, currentProject, aiGenerating, fetchBudget, deleteBudgetItem, generateAIBudget } = usePlannerStore();
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [chartView, setChartView] = useState("donut"); // donut | bars

  useEffect(() => { fetchBudget(projectId); }, [projectId]);

  async function handleAIGenerate() {
    const res = await generateAIBudget(projectId);
    if (res?.success) toast.success(`Generated ${res.data?.length || 0} budget items`);
    else toast.error(res?.error || "Failed to generate budget");
  }

  async function handleDelete(itemId) {
    const res = await deleteBudgetItem(projectId, itemId);
    if (!res.success) toast.error("Failed to delete item");
  }

  const items = budget?.items || [];
  const totalBudget = Number(currentProject?.total_budget || budget?.total_budget || 0);
  const totalEstimated = items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0);
  const totalActual = items.reduce((s, i) => s + Number(i.actual_cost || 0), 0);
  const totalPaid = items.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const remaining = totalBudget - totalActual;
  const spendPct = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;
  const estimatedPct = totalBudget > 0 ? Math.min(100, Math.round((totalEstimated / totalBudget) * 100)) : 0;
  const budgetHealth = spendPct > 100 ? "over" : spendPct > 85 ? "warning" : "healthy";
  const variance = totalActual - totalEstimated;

  // Group by category with color assignment
  const byCategory = items.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const catEntries = Object.entries(byCategory).map(([cat, catItems], idx) => {
    const catActual = catItems.reduce((s, i) => s + Number(i.actual_cost || i.estimated_cost || 0), 0);
    const catEstimated = catItems.reduce((s, i) => s + Number(i.estimated_cost || 0), 0);
    const base = Math.max(totalActual, totalEstimated, 1);
    const pct = Math.round((catActual / base) * 100);
    return { cat, catItems, catActual, catEstimated, pct, color: CAT_PALETTE[idx % CAT_PALETTE.length] };
  }).sort((a, b) => b.catActual - a.catActual);

  const donutSegments = catEntries
    .filter(e => e.pct > 0)
    .map(e => ({ color: e.color, pct: e.pct, label: e.cat }));

  const categories = ["all", ...Object.keys(byCategory)];
  const displayItems = activeCategory === "all" ? items : (byCategory[activeCategory] || []);

  const kpis = [
    { label: "Total Budget", value: totalBudget, color: "text-white", sub: "allocated" },
    { label: "Estimated", value: totalEstimated, color: "text-amber-400", sub: `${estimatedPct}% of budget` },
    { label: "Actual Spend", value: totalActual, color: budgetHealth === "over" ? "text-red-400" : "text-white", sub: `${spendPct}% used` },
    { label: "Paid Out", value: totalPaid, color: "text-emerald-400", sub: `${items.filter(i => i.payment_status === "PAID").length} items paid` },
  ];

  if (!budget && items.length === 0) return (
    <div className="p-6">
      <BudgetSkeleton />
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color, sub }) => (
          <div key={label} className="bg-[#111127] border border-white/8 rounded-xl p-4 hover:border-white/12 transition-all active:scale-[0.97]">
            <p className="text-[11px] text-gray-500 mb-1.5 uppercase font-bold tracking-wide">{label}</p>
            <p className={`text-2xl font-black ${color} leading-none mb-1`}>
              ${Number(value).toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Budget health bar */}
      <div className="bg-[#111127] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {budgetHealth === "over"    && <AlertTriangle className="w-4 h-4 text-red-400" />}
            {budgetHealth === "warning" && <TrendingUp    className="w-4 h-4 text-amber-400" />}
            {budgetHealth === "healthy" && <CheckCircle   className="w-4 h-4 text-emerald-400" />}
            <span className="text-sm font-bold text-white">Budget Overview</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={`font-bold ${budgetHealth === "over" ? "text-red-400" : budgetHealth === "warning" ? "text-amber-400" : "text-emerald-400"}`}>
              {spendPct}% used
            </span>
            {variance !== 0 && (
              <span className={`flex items-center gap-0.5 ${variance > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {variance > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                ${Math.abs(variance).toLocaleString()} {variance > 0 ? "over estimate" : "under estimate"}
              </span>
            )}
          </div>
        </div>

        {/* Stacked bar */}
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>Actual spend</span>
              <span className="font-semibold text-white">${totalActual.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-white/6 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetHealth === "over" ? "bg-red-500" : budgetHealth === "warning" ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, spendPct)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>Estimated total</span>
              <span className="font-semibold text-gray-300">${totalEstimated.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/60 rounded-full transition-all duration-700"
                style={{ width: `${estimatedPct}%` }}
              />
            </div>
          </div>
        </div>

        {remaining < 0 ? (
          <p className="text-xs text-red-400 mt-3 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            ${Math.abs(remaining).toLocaleString()} over budget
          </p>
        ) : totalBudget > 0 ? (
          <p className="text-xs text-gray-500 mt-3">${remaining.toLocaleString()} remaining from budget</p>
        ) : null}
      </div>

      {/* Category breakdown */}
      {catEntries.length > 0 && (
        <div className="bg-[#111127] border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Breakdown by Category</p>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {[["donut", PieChart], ["bars", List]].map(([id, Icon]) => (
                <button
                  key={id}
                  onClick={() => setChartView(id)}
                  className={`p-1.5 rounded-md transition-all active:scale-90 ${chartView === id ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {chartView === "donut" ? (
            <div className="flex items-center gap-6 p-5">
              {/* Donut */}
              <div className="relative shrink-0">
                <DonutChart segments={donutSegments} size={140} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-black text-white">{catEntries.length}</p>
                  <p className="text-[10px] text-gray-500">categories</p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 min-w-0">
                {catEntries.map(({ cat, catActual, pct, color }) => (
                  <div key={cat} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <p className="text-xs text-gray-300 capitalize flex-1 truncate">{cat}</p>
                    <p className="text-xs font-bold text-white">${catActual.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 w-8 text-right">{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {catEntries.map(({ cat, catActual, catEstimated, pct, color }) => {
                const maxVal = Math.max(...catEntries.map(e => Math.max(e.catActual, e.catEstimated)));
                const actualWidth = maxVal > 0 ? (catActual / maxVal) * 100 : 0;
                const estimatedWidth = maxVal > 0 ? (catEstimated / maxVal) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <p className="text-xs text-gray-300 capitalize">{cat}</p>
                      </div>
                      <p className="text-xs font-bold text-white">${catActual.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${actualWidth}%`, backgroundColor: color }}
                        />
                      </div>
                      {catEstimated > 0 && catEstimated !== catActual && (
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 opacity-40"
                            style={{ width: `${estimatedWidth}%`, backgroundColor: color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-3 h-1.5 rounded-full bg-white/40 inline-block" />Actual
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-3 h-1 rounded-full bg-white/20 inline-block" />Estimated
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all active:scale-[0.97] ${
                  activeCategory === cat ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/6"
                }`}
              >
                {cat}
                {cat !== "all" && byCategory[cat] && (
                  <span className="ml-1.5 opacity-60">{byCategory[cat].length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-all disabled:opacity-60 active:scale-[0.97]"
            >
              {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Suggest
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyBudget onAdd={() => setShowAdd(true)} onAIGenerate={handleAIGenerate} loading={aiGenerating} />
        ) : displayItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No items in this category.</div>
        ) : (
          <>
            {/* Mobile card list — each item as a card */}
            <div className="sm:hidden space-y-2">
              {displayItems.map(item => {
                const pm = PAYMENT_META[item.payment_status] ?? PAYMENT_META.UNPAID;
                const over = Number(item.actual_cost || 0) > Number(item.estimated_cost || 0) && Number(item.estimated_cost || 0) > 0;
                const catColor = catEntries.find(e => e.cat === (item.category || "Uncategorized"))?.color;
                return (
                  <div key={item.id} className="bg-[#111127] border border-white/8 rounded-xl p-3.5 transition-colors active:bg-white/3"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {catColor && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />}
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                        </div>
                        {item.vendor_name && <p className="text-[11px] text-gray-500">{item.vendor_name}</p>}
                        {item.due_date && (
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            Due {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pm.cls}`}>{pm.label}</span>
                        <button onClick={() => handleDelete(item.id)} className="p-1 rounded text-gray-500 hover:text-red-400 active:scale-90 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Est.", value: item.estimated_cost, cls: "text-gray-300" },
                        { label: "Actual", value: item.actual_cost, cls: over ? "text-red-400" : "text-white" },
                        { label: "Paid", value: item.paid_amount, cls: "text-emerald-400" },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="bg-white/4 rounded-lg py-2 text-center">
                          <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                          <p className={`text-xs font-bold ${cls}`}>${Number(value || 0).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-[#111127] border border-white/8 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 text-[10px] font-black text-gray-600 uppercase tracking-wide px-4 py-3 border-b border-white/8">
                <span>Item</span>
                <span className="text-right">Est.</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Paid</span>
                <span className="text-center">Status</span>
                <span />
              </div>
              {displayItems.map(item => {
                const pm = PAYMENT_META[item.payment_status] ?? PAYMENT_META.UNPAID;
                const over = Number(item.actual_cost || 0) > Number(item.estimated_cost || 0) && Number(item.estimated_cost || 0) > 0;
                const catColor = catEntries.find(e => e.cat === (item.category || "Uncategorized"))?.color;
                return (
                  <div
                    key={item.id}
                    className="group grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {catColor && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />}
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                      </div>
                      {item.vendor_name && <p className="text-[11px] text-gray-500 mt-0.5">{item.vendor_name}</p>}
                      {item.due_date && (
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          Due {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 text-right">${Number(item.estimated_cost || 0).toLocaleString()}</p>
                    <p className={`text-sm font-semibold text-right ${over ? "text-red-400" : "text-white"}`}>
                      ${Number(item.actual_cost || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-400 text-right">${Number(item.paid_amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${pm.cls}`}>{pm.label}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAdd && <AddItemModal projectId={projectId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
