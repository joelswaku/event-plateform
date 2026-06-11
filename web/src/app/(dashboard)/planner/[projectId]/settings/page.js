"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import { Loader2, Save, Archive, Trash2, AlertTriangle, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

const EVENT_TYPES = ["wedding","conference","concert","birthday","corporate","festival","party","gala","networking","other"];
const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","CHF","JPY","SGD"];
const COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e","#ef4444",
  "#f97316","#eab308","#22c55e","#14b8a6","#3b82f6",
];

const input = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40 transition-colors";

export default function SettingsPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const { currentProject, saving, updateProject, archiveProject, deleteProject } = usePlannerStore();

  const [form, setForm] = useState({
    title: "", event_type: "wedding", event_date: "", event_end_date: "",
    venue: "", city: "", country: "", guest_count: "",
    total_budget: "", currency: "USD", style_notes: "", color: "#6366f1",
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setForm({
        title: currentProject.title || "",
        event_type: currentProject.event_type || "wedding",
        event_date: currentProject.event_date ? currentProject.event_date.slice(0, 10) : "",
        event_end_date: currentProject.event_end_date ? currentProject.event_end_date.slice(0, 10) : "",
        venue: currentProject.venue || "",
        city: currentProject.city || "",
        country: currentProject.country || "",
        guest_count: currentProject.guest_count || "",
        total_budget: currentProject.total_budget || "",
        currency: currentProject.currency || "USD",
        style_notes: currentProject.style_notes || "",
        color: currentProject.color || "#6366f1",
      });
    }
  }, [currentProject?.id]);

  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    const res = await updateProject(projectId, {
      ...form,
      event_date:     form.event_date     || null,
      event_end_date: form.event_end_date || null,
      guest_count:    form.guest_count    ? parseInt(form.guest_count)    : null,
      total_budget:   form.total_budget   ? parseFloat(form.total_budget) : null,
    });
    if (res.success) toast.success("Settings saved");
    else toast.error(res.error || "Failed to save");
  }

  async function handleArchive() {
    setArchiving(true);
    const res = await archiveProject(projectId);
    setArchiving(false);
    if (res.success) { toast.success("Project archived"); router.push("/planner"); }
    else toast.error(res.error || "Failed to archive");
  }

  async function handleDelete() {
    if (deleteConfirm !== currentProject?.title) return;
    setDeleting(true);
    const res = await deleteProject(projectId);
    setDeleting(false);
    if (res.success) { toast.success("Project deleted"); router.push("/planner"); }
    else toast.error(res.error || "Failed to delete");
  }

  if (!currentProject) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8 max-w-2xl">
      {/* Project Details */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Settings2 className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Project Details</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Project Title</label>
            <input className={input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="My Event Planner" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Event Type</label>
              <select className={input} value={form.event_type} onChange={e => set("event_type", e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-[#111127] capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Currency</label>
              <select className={input} value={form.currency} onChange={e => set("currency", e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#111127]">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Event Start Date</label>
              <input type="date" className={input} value={form.event_date} onChange={e => set("event_date", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Event End Date</label>
              <input type="date" className={input} value={form.event_end_date} onChange={e => set("event_end_date", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Venue</label>
            <input className={input} value={form.venue} onChange={e => set("venue", e.target.value)} placeholder="Venue name or address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">City</label>
              <input className={input} value={form.city} onChange={e => set("city", e.target.value)} placeholder="New York" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Country</label>
              <input className={input} value={form.country} onChange={e => set("country", e.target.value)} placeholder="USA" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Expected Guests</label>
              <input type="number" className={input} value={form.guest_count} onChange={e => set("guest_count", e.target.value)} placeholder="150" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Total Budget</label>
              <input type="number" className={input} value={form.total_budget} onChange={e => set("total_budget", e.target.value)} placeholder="25000" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Style Notes</label>
            <textarea
              className={`${input} resize-none h-24`}
              value={form.style_notes}
              onChange={e => set("style_notes", e.target.value)}
              placeholder="Describe the atmosphere, theme, or style…"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Project Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={`w-8 h-8 rounded-lg transition-all ${(form.color || '').toLowerCase() === c.toLowerCase() ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a14] scale-110" : "opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-2xl p-5 bg-red-500/3">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
        </div>

        {/* Archive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 pb-5 border-b border-red-500/10">
          <div>
            <p className="text-sm font-semibold text-white">Archive Project</p>
            <p className="text-xs text-gray-500 mt-0.5">Hide this project from the active list. It can be restored later.</p>
          </div>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            Archive
          </button>
        </div>

        {/* Delete */}
        <div className="pt-5">
          <p className="text-sm font-semibold text-white">Delete Project</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">This action is irreversible. All tasks, budget items, vendors, and files will be permanently deleted.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className={`${input} flex-1`}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={`Type "${currentProject.title}" to confirm`}
            />
            <button
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== currentProject.title}
              className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
