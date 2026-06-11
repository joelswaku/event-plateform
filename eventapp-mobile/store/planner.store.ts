import { create } from "zustand";
import api from "@/lib/api";

interface PlannerProject {
  id: string;
  title: string;
  event_type?: string;
  event_date?: string;
  event_end_date?: string;
  guest_count?: number;
  total_budget?: number;
  currency?: string;
  venue?: string;
  city?: string;
  country?: string;
  style_notes?: string;
  color?: string;
  ai_brief?: string;
  status?: string;
  task_count?: number;
  done_count?: number;
  tasks?: any[];
  vendors?: any[];
  timeline?: any[];
  budgetSummary?: any;
}

interface PlannerStore {
  projects: PlannerProject[];
  currentProject: PlannerProject | null;
  budget: any | null;
  team: any[];
  notes: any[];
  files: any[];
  loading: boolean;
  saving: boolean;
  aiGenerating: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (payload: any) => Promise<{ success: boolean; data?: PlannerProject; error?: string }>;
  fetchProject: (projectId: string) => Promise<{ success: boolean; data?: PlannerProject }>;
  updateProject: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  archiveProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;

  createTask: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateTask: (projectId: string, taskId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteTask: (projectId: string, taskId: string) => Promise<{ success: boolean; error?: string }>;
  reorderTasks: (projectId: string, orderedIds: string[]) => Promise<{ success: boolean; error?: string }>;

  createVendor: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateVendor: (projectId: string, vendorId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteVendor: (projectId: string, vendorId: string) => Promise<{ success: boolean; error?: string }>;
  createTimelineItem: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;

  fetchBudget: (projectId: string) => Promise<void>;
  createBudgetItem: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteBudgetItem: (projectId: string, itemId: string) => Promise<{ success: boolean; error?: string }>;
  generateAIBudget: (projectId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;

  fetchTeam: (projectId: string) => Promise<void>;
  inviteTeamMember: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateTeamMember: (projectId: string, memberId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  removeTeamMember: (projectId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;

  fetchNotes: (projectId: string) => Promise<void>;
  createNote: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateNote: (projectId: string, noteId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteNote: (projectId: string, noteId: string) => Promise<{ success: boolean; error?: string }>;

  fetchFiles: (projectId: string) => Promise<void>;
  uploadFile: (projectId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteFile: (projectId: string, fileId: string) => Promise<{ success: boolean; error?: string }>;

  generateAIBrief: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  generateAITasks: (projectId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  generateAITimeline: (projectId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  generateAIVendors: (projectId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  projects: [],
  currentProject: null,
  budget: null,
  team: [],
  notes: [],
  files: [],
  loading: false,
  saving: false,
  aiGenerating: false,
  error: null,

  // ── PROJECTS ──────────────────────────────────────────────────────

  fetchProjects: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/planner/projects");
      set({ projects: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  createProject: async (payload) => {
    try {
      set({ saving: true });
      const res = await api.post("/planner/projects", payload);
      const project = res.data.data;
      set((s) => ({ projects: [project, ...s.projects], saving: false }));
      return { success: true, data: project };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  fetchProject: async (projectId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/planner/projects/${projectId}`);
      const p = res.data.data;
      set({
        currentProject: p,
        budget: p.budget || null,
        team: p.team || [],
        loading: false,
      });
      return { success: true, data: p };
    } catch (err: any) {
      set({ loading: false });
      return { success: false };
    }
  },

  updateProject: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.patch(`/planner/projects/${projectId}`, payload);
      set((s) => ({
        saving: false,
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, ...res.data.data } : s.currentProject,
        projects: s.projects.map((p) => p.id === projectId ? { ...p, ...res.data.data } : p),
      }));
      return { success: true, data: res.data.data };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteProject: async (projectId) => {
    try {
      await api.delete(`/planner/projects/${projectId}`);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  archiveProject: async (projectId) => {
    try {
      await api.post(`/planner/projects/${projectId}/archive`);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── TASKS ──────────────────────────────────────────────────────────

  createTask: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/tasks`, payload);
      const task = res.data.data;
      set((s) => ({
        saving: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, tasks: [...(s.currentProject.tasks || []), task] }
          : s.currentProject,
      }));
      return { success: true, data: task };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateTask: async (projectId, taskId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/tasks/${taskId}`, payload);
      const updated = res.data.data;
      set((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, tasks: (s.currentProject.tasks || []).map((t) => t.id === taskId ? updated : t) }
          : s.currentProject,
      }));
      return { success: true, data: updated };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/tasks/${taskId}`);
      set((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, tasks: (s.currentProject.tasks || []).filter((t) => t.id !== taskId) }
          : s.currentProject,
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  reorderTasks: async (projectId, orderedIds) => {
    try {
      await api.post(`/planner/projects/${projectId}/tasks/reorder`, { orderedIds });
      // Optimistically update position_order in store
      set((s) => {
        if (!s.currentProject) return s;
        const tasks = [...(s.currentProject.tasks || [])];
        orderedIds.forEach((id, idx) => {
          const t = tasks.find((t) => t.id === id);
          if (t) t.position_order = idx;
        });
        tasks.sort((a, b) => (a.position_order ?? 0) - (b.position_order ?? 0));
        return { currentProject: { ...s.currentProject, tasks } };
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── VENDORS / TIMELINE ─────────────────────────────────────────────

  createVendor: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/vendors`, payload);
      const vendor = res.data.data;
      set((s) => ({
        saving: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, vendors: [...(s.currentProject.vendors || []), vendor] }
          : s.currentProject,
      }));
      return { success: true, data: vendor };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateVendor: async (projectId, vendorId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/vendors/${vendorId}`, payload);
      const updated = res.data.data;
      set((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, vendors: (s.currentProject.vendors || []).map((v: any) => v.id === vendorId ? updated : v) }
          : s.currentProject,
      }));
      return { success: true, data: updated };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteVendor: async (projectId, vendorId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/vendors/${vendorId}`);
      set((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, vendors: (s.currentProject.vendors || []).filter((v: any) => v.id !== vendorId) }
          : s.currentProject,
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  createTimelineItem: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/timeline`, payload);
      const item = res.data.data;
      set((s) => ({
        saving: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, timeline: [...(s.currentProject.timeline || []), item] }
          : s.currentProject,
      }));
      return { success: true, data: item };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── BUDGET ─────────────────────────────────────────────────────────

  fetchBudget: async (projectId) => {
    try {
      const res = await api.get(`/planner/projects/${projectId}/budget`);
      set({ budget: res.data.data });
    } catch {}
  },

  createBudgetItem: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/budget`, payload);
      const item = res.data.data;
      set((s) => ({
        saving: false,
        budget: s.budget ? { ...s.budget, items: [...(s.budget.items || []), item] } : { items: [item] },
      }));
      return { success: true, data: item };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteBudgetItem: async (projectId, itemId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/budget/${itemId}`);
      set((s) => ({
        budget: s.budget
          ? { ...s.budget, items: (s.budget.items || []).filter((i: any) => i.id !== itemId) }
          : s.budget,
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  generateAIBudget: async (projectId) => {
    try {
      set({ aiGenerating: true });
      const res = await api.post(`/planner/projects/${projectId}/ai/budget`, {}, { timeout: 120_000 });
      const items = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        budget: s.budget ? { ...s.budget, items: [...(s.budget.items || []), ...items] } : { items },
      }));
      return { success: true, data: items };
    } catch (err: any) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message || 'AI request timed out — try again' };
    }
  },

  // ── TEAM ───────────────────────────────────────────────────────────

  fetchTeam: async (projectId) => {
    try {
      const res = await api.get(`/planner/projects/${projectId}/team`);
      set({ team: res.data.data || [] });
    } catch {}
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── NOTES ──────────────────────────────────────────────────────────

  fetchNotes: async (projectId) => {
    try {
      const res = await api.get(`/planner/projects/${projectId}/notes`);
      set({ notes: res.data.data || [] });
    } catch {}
  },

  createNote: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/notes`, payload);
      const note = res.data.data;
      set((s) => ({ saving: false, notes: [note, ...s.notes] }));
      return { success: true, data: note };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  updateNote: async (projectId, noteId, payload) => {
    try {
      const res = await api.patch(`/planner/projects/${projectId}/notes/${noteId}`, payload);
      const updated = res.data.data;
      set((s) => ({ notes: s.notes.map((n) => n.id === noteId ? updated : n) }));
      return { success: true, data: updated };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteNote: async (projectId, noteId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/notes/${noteId}`);
      set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── FILES ──────────────────────────────────────────────────────────

  fetchFiles: async (projectId) => {
    try {
      const res = await api.get(`/planner/projects/${projectId}/files`);
      set({ files: res.data.data || [] });
    } catch {}
  },

  uploadFile: async (projectId, payload) => {
    try {
      set({ saving: true });
      const res = await api.post(`/planner/projects/${projectId}/files`, payload);
      const file = res.data.data;
      set((s) => ({ saving: false, files: [file, ...s.files] }));
      return { success: true, data: file };
    } catch (err: any) {
      set({ saving: false });
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  deleteFile: async (projectId, fileId) => {
    try {
      await api.delete(`/planner/projects/${projectId}/files/${fileId}`);
      set((s) => ({ files: s.files.filter((f) => f.id !== fileId) }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  // ── AI GENERATION ──────────────────────────────────────────────────

  generateAIBrief: async (projectId) => {
    try {
      set({ aiGenerating: true });
      const res = await api.post(`/planner/projects/${projectId}/ai/brief`, {}, { timeout: 120_000 });
      set((s) => ({
        aiGenerating: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, ai_brief: JSON.stringify(res.data.data) }
          : s.currentProject,
      }));
      return { success: true, data: res.data.data };
    } catch (err: any) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message || 'AI request timed out — try again' };
    }
  },

  generateAITasks: async (projectId) => {
    try {
      set({ aiGenerating: true });
      const res = await api.post(`/planner/projects/${projectId}/ai/tasks`, {}, { timeout: 120_000 });
      const tasks = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, tasks: [...(s.currentProject.tasks || []), ...tasks] }
          : s.currentProject,
      }));
      return { success: true, data: tasks };
    } catch (err: any) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message || 'AI request timed out — try again' };
    }
  },

  generateAITimeline: async (projectId) => {
    try {
      set({ aiGenerating: true });
      const res = await api.post(`/planner/projects/${projectId}/ai/timeline`, {}, { timeout: 120_000 });
      const items = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, timeline: [...(s.currentProject.timeline || []), ...items] }
          : s.currentProject,
      }));
      return { success: true, data: items };
    } catch (err: any) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message || 'AI request timed out — try again' };
    }
  },

  generateAIVendors: async (projectId) => {
    try {
      set({ aiGenerating: true });
      const res = await api.post(`/planner/projects/${projectId}/ai/vendors`, {}, { timeout: 120_000 });
      const vendors = res.data.data || [];
      set((s) => ({
        aiGenerating: false,
        currentProject: s.currentProject
          ? { ...s.currentProject, vendors: [...(s.currentProject.vendors || []), ...vendors] }
          : s.currentProject,
      }));
      return { success: true, data: vendors };
    } catch (err: any) {
      set({ aiGenerating: false });
      return { success: false, error: err?.response?.data?.message || err.message || 'AI request timed out — try again' };
    }
  },
}));
