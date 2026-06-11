"use client";
import { create } from "zustand";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export const usePlannerStore = create((set, get) => ({
  projects:       [],
  currentProject: null,
  tasks:          { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [] },
  timeline:       [],
  budget:         null,
  vendors:        [],
  team:           [],
  notes:          [],
  files:          [],
  activity:       [],
  loading:        false,
  saving:         false,
  aiGenerating:   false,
  activeTab:      "overview",
  error:          null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── PROJECTS ──────────────────────────────────────────────────────
  fetchProjects: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/planner/projects");
      set({ projects: res.data.data || [], loading: false });
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load projects";
      set({ loading: false, error: message });
      toast.error(message);
    }
  },

  createProject: async (payload) => {
    try {
      set({ saving: true, error: null });
      const res = await api.post("/planner/projects", payload);
      const p = res.data.data;
      set((s) => ({ projects: [p, ...s.projects], saving: false }));
      return { success: true, data: p };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ saving: false, error });
      return { success: false, error };
    }
  },

  fetchProject: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const res = await api.get(`/planner/projects/${projectId}`);
      const p = res.data.data;
      set({
        currentProject: p,
        tasks: p.tasks
          ? { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [], ...groupTasksByStatus(p.tasks) }
          : get().tasks,
        timeline: p.timeline || [],
        budget: p.budget || null,
        vendors: p.vendors || [],
        team: p.team || [],
        activity: p.activity || [],
        loading: false,
      });
      return { success: true, data: p };
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  updateProject: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.patch(`/planner/projects/${projectId}`, payload);
      const updated = res.data.data;
      set((s) => ({
        saving: false,
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, ...updated } : s.currentProject,
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...updated } : p)),
      }));
      return { success: true, data: updated };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteProject: async (projectId) => {
    try {
      await api.delete(`/planner/projects/${projectId}`);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  archiveProject: async (projectId) => {
    try {
      const res = await api.post(`/planner/projects/${projectId}/archive`);
      const updated = res.data.data;
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...updated } : p)),
      }));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── TASKS ──────────────────────────────────────────────────────────
  fetchTasks: async (projectId, filters = {}) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/tasks`, { params: filters });
      set({ tasks: res.data.data || { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [] }, loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  createTask: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/tasks`, payload);
      const task = res.data.data;
      const status = task.status?.toUpperCase() || "TODO";
      set((s) => ({
        saving: false,
        tasks: { ...s.tasks, [status]: [...(s.tasks[status] || []), task] },
      }));
      return { success: true, data: task };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateTask: async (projectId, taskId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/tasks/${taskId}`, payload);
      const updated = res.data.data;
      const newStatus = updated.status?.toUpperCase() || "TODO";
      set((s) => {
        const oldTasks = { ...s.tasks };
        for (const key of Object.keys(oldTasks)) {
          oldTasks[key] = oldTasks[key].filter((t) => t.id !== taskId);
        }
        oldTasks[newStatus] = [...(oldTasks[newStatus] || []), updated];
        return { tasks: oldTasks };
      });
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/tasks/${taskId}`);
      set((s) => {
        const tasks = { ...s.tasks };
        for (const key of Object.keys(tasks)) {
          tasks[key] = tasks[key].filter((t) => t.id !== taskId);
        }
        return { tasks };
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  reorderTasks: async (projectId, status, orderedIds) => {
    set((s) => {
      const sorted = [...(s.tasks[status] || [])].sort(
        (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
      );
      return { tasks: { ...s.tasks, [status]: sorted } };
    });
    try {
      await api.post(`/planner/projects/${projectId}/tasks/reorder`, { status, orderedIds });
    } catch { /* revert on failure is complex, silently fail */ }
  },

  bulkUpdateTasks: async (projectId, taskIds, payload) => {
    try {
      await api.post(`/planner/projects/${projectId}/tasks/bulk-update`, { taskIds, ...payload });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── TIMELINE ───────────────────────────────────────────────────────
  fetchTimeline: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/timeline`);
      set({ timeline: res.data.data || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  createTimelineItem: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/timeline`, payload);
      const item = res.data.data;
      set((s) => ({ saving: false, timeline: [...s.timeline, item] }));
      return { success: true, data: item };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateTimelineItem: async (projectId, itemId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/timeline/${itemId}`, payload);
      const updated = res.data.data;
      set((s) => ({ timeline: s.timeline.map((i) => (i.id === itemId ? updated : i)) }));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteTimelineItem: async (projectId, itemId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/timeline/${itemId}`);
      set((s) => ({ timeline: s.timeline.filter((i) => i.id !== itemId) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  reorderTimeline: async (projectId, orderedIds) => {
    try {
      await api.post(`/planner/projects/${projectId}/timeline/reorder`, { orderedIds });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── BUDGET ─────────────────────────────────────────────────────────
  fetchBudget: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/budget`);
      set({ budget: res.data.data, loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  createBudgetItem: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/budget`, payload);
      const item = res.data.data;
      set((s) => ({
        saving: false,
        budget: s.budget ? { ...s.budget, items: [...(s.budget.items || []), item] } : s.budget,
      }));
      return { success: true, data: item };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateBudgetItem: async (projectId, itemId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/budget/${itemId}`, payload);
      const updated = res.data.data;
      set((s) => ({
        budget: s.budget
          ? { ...s.budget, items: (s.budget.items || []).map((i) => (i.id === itemId ? updated : i)) }
          : s.budget,
      }));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteBudgetItem: async (projectId, itemId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/budget/${itemId}`);
      set((s) => ({
        budget: s.budget
          ? { ...s.budget, items: (s.budget.items || []).filter((i) => i.id !== itemId) }
          : s.budget,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── VENDORS ────────────────────────────────────────────────────────
  fetchVendors: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/vendors`);
      set({ vendors: res.data.data?.vendors || [], loading: false });
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load vendors";
      set({ loading: false, error: message });
      toast.error(message);
    }
  },

  createVendor: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/vendors`, payload);
      const vendor = res.data.data;
      set((s) => ({ saving: false, vendors: [...s.vendors, vendor] }));
      return { success: true, data: vendor };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateVendor: async (projectId, vendorId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/vendors/${vendorId}`, payload);
      const updated = res.data.data;
      set((s) => ({ vendors: s.vendors.map((v) => (v.id === vendorId ? updated : v)) }));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteVendor: async (projectId, vendorId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/vendors/${vendorId}`);
      set((s) => ({ vendors: s.vendors.filter((v) => v.id !== vendorId) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── TEAM ───────────────────────────────────────────────────────────
  fetchTeam: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/team`);
      set({ team: res.data.data || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  inviteTeamMember: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/team`, payload);
      const type = res.data?.type; // "invited" or "added"

      // Refetch team to ensure sync with database
      const teamRes = await api.get(`/planner/projects/${projectId}/team`);
      set({ saving: false, team: teamRes.data.data || [] });

      return { success: true, type };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateTeamMember: async (projectId, memberId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/team/${memberId}`, payload);
      // Refetch team to ensure sync with database
      const teamRes = await api.get(`/planner/projects/${projectId}/team`);
      set({ team: teamRes.data.data || [] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  removeTeamMember: async (projectId, memberId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/team/${memberId}`);
      // Refetch team to ensure sync with database (especially for event_members)
      const res = await api.get(`/planner/projects/${projectId}/team`);
      set({ team: res.data.data || [] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── NOTES ──────────────────────────────────────────────────────────
  fetchNotes: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/notes`);
      set({ notes: res.data.data || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  createNote: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/notes`, payload);
      const note = res.data.data;
      set((s) => ({ saving: false, notes: [note, ...s.notes] }));
      return { success: true, data: note };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateNote: async (projectId, noteId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/notes/${noteId}`, payload);
      const updated = res.data.data;
      set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? updated : n)) }));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteNote: async (projectId, noteId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/notes/${noteId}`);
      set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── FILES ──────────────────────────────────────────────────────────
  fetchFiles: async (projectId, folder) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/files`, { params: folder ? { folder } : {} });
      set({ files: res.data.data || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  uploadFile: async (projectId, fileData) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/files`, fileData);
      const file = res.data.data;
      set((s) => ({ saving: false, files: [file, ...s.files] }));
      return { success: true, data: file };
    } catch (err) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteFile: async (projectId, fileId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/files/${fileId}`);
      set((s) => ({ files: s.files.filter((f) => f.id !== fileId) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── AI GENERATION ──────────────────────────────────────────────────
  // AI calls use a 120s timeout — Claude can take 30-60s for complex prompts.
  generateAIBrief: async (projectId) => {
    try {
      set({ aiGenerating: true, error: null });
      const res = await api.post(`/planner/projects/${projectId}/ai/brief`, {}, { timeout: 120000 });
      const brief = res.data.data;
      set((s) => ({
        aiGenerating: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, ai_brief: JSON.stringify(brief), health_score: brief.health_score }
          : s.currentProject,
      }));
      return { success: true, data: brief };
    } catch (err) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  generateAITasks: async (projectId) => {
    try {
      set({ aiGenerating: true, error: null });
      const res = await api.post(`/planner/projects/${projectId}/ai/tasks`, {}, { timeout: 120000 });
      const newTasks = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        tasks: { ...s.tasks, TODO: [...(s.tasks.TODO || []), ...newTasks] },
      }));
      return { success: true, data: newTasks };
    } catch (err) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  generateAITimeline: async (projectId) => {
    try {
      set({ aiGenerating: true, error: null });
      const res = await api.post(`/planner/projects/${projectId}/ai/timeline`, {}, { timeout: 120000 });
      const items = res.data.data || [];
      set((s) => ({ aiGenerating: false, timeline: [...s.timeline, ...items] }));
      return { success: true, data: items };
    } catch (err) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  generateAIBudget: async (projectId) => {
    try {
      set({ aiGenerating: true, error: null });
      const res = await api.post(`/planner/projects/${projectId}/ai/budget`, {}, { timeout: 120000 });
      const items = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        budget: s.budget
          ? { ...s.budget, items: [...(s.budget.items || []), ...items] }
          : { items, total_budget: 0, total_estimated: 0, total_actual: 0, total_paid: 0 },
      }));
      return { success: true, data: items };
    } catch (err) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  generateAIVendors: async (projectId) => {
    try {
      set({ aiGenerating: true, error: null });
      const res = await api.post(`/planner/projects/${projectId}/ai/vendors`, {}, { timeout: 120000 });
      const vendors = res.data.data || [];
      set((s) => ({ aiGenerating: false, vendors: [...s.vendors, ...vendors] }));
      return { success: true, data: vendors };
    } catch (err) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  fetchRiskAnalysis: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}/ai/risk-analysis`, { timeout: 120000 });
      set({ loading: false });
      return { success: true, data: res.data.data };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },
}));

function groupTasksByStatus(taskArray) {
  const groups = { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [] };
  for (const t of taskArray) {
    const key = t.status?.toUpperCase();
    if (groups[key]) groups[key].push(t);
    else groups.TODO.push(t);
  }
  return groups;
}
