import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import * as ctrl from "../controllers/planner.controller.js";

const router = express.Router();
router.use(authenticate, resolveOrganization);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { success: false, message: "Too many AI requests, please wait." },
  standardHeaders: true, legacyHeaders: false,
});

// Projects
router.get("/projects",                             ctrl.listProjects);
router.post("/projects",                            ctrl.createProject);
router.get("/projects/:projectId",                  ctrl.getProject);
router.patch("/projects/:projectId",                ctrl.updateProject);
router.delete("/projects/:projectId",               ctrl.deleteProject);
router.post("/projects/:projectId/archive",         ctrl.archiveProject);

// Tasks
router.get("/projects/:projectId/tasks",                         ctrl.getTasks);
router.post("/projects/:projectId/tasks",                        ctrl.createTask);
router.patch("/projects/:projectId/tasks/:taskId",               ctrl.updateTask);
router.delete("/projects/:projectId/tasks/:taskId",              ctrl.deleteTask);
router.post("/projects/:projectId/tasks/reorder",                ctrl.reorderTasks);
router.post("/projects/:projectId/tasks/bulk-update",            ctrl.bulkUpdateTasks);

// Timeline
router.get("/projects/:projectId/timeline",                      ctrl.getTimeline);
router.post("/projects/:projectId/timeline",                     ctrl.createTimelineItem);
router.patch("/projects/:projectId/timeline/:itemId",            ctrl.updateTimelineItem);
router.delete("/projects/:projectId/timeline/:itemId",           ctrl.deleteTimelineItem);
router.post("/projects/:projectId/timeline/reorder",             ctrl.reorderTimeline);

// Budget
router.get("/projects/:projectId/budget",                        ctrl.getBudget);
router.post("/projects/:projectId/budget",                       ctrl.createBudgetItem);
router.patch("/projects/:projectId/budget/:itemId",              ctrl.updateBudgetItem);
router.delete("/projects/:projectId/budget/:itemId",             ctrl.deleteBudgetItem);

// Vendors
router.get("/projects/:projectId/vendors",                       ctrl.getVendors);
router.post("/projects/:projectId/vendors",                      ctrl.createVendor);
router.patch("/projects/:projectId/vendors/:vendorId",           ctrl.updateVendor);
router.delete("/projects/:projectId/vendors/:vendorId",          ctrl.deleteVendor);

// Team
router.get("/projects/:projectId/team",                          ctrl.getTeam);
router.post("/projects/:projectId/team",                         ctrl.inviteTeamMember);
router.patch("/projects/:projectId/team/:memberId",              ctrl.updateTeamMember);
router.delete("/projects/:projectId/team/:memberId",             ctrl.removeTeamMember);

// Notes
router.get("/projects/:projectId/notes",                         ctrl.getNotes);
router.post("/projects/:projectId/notes",                        ctrl.createNote);
router.patch("/projects/:projectId/notes/:noteId",               ctrl.updateNote);
router.delete("/projects/:projectId/notes/:noteId",              ctrl.deleteNote);

// Files
router.get("/projects/:projectId/files",                         ctrl.getFiles);
router.post("/projects/:projectId/files",                        ctrl.uploadFile);
router.delete("/projects/:projectId/files/:fileId",              ctrl.deleteFile);

// AI (rate limited)
router.post("/projects/:projectId/ai/brief",                     aiLimiter, ctrl.generateAIBrief);
router.post("/projects/:projectId/ai/tasks",                     aiLimiter, ctrl.generateAITasks);
router.post("/projects/:projectId/ai/timeline",                  aiLimiter, ctrl.generateAITimeline);
router.post("/projects/:projectId/ai/budget",                    aiLimiter, ctrl.generateAIBudget);
router.post("/projects/:projectId/ai/vendors",                   aiLimiter, ctrl.generateAIVendors);
router.get("/projects/:projectId/ai/risk-analysis",              aiLimiter, ctrl.getRiskAnalysis);

// Settings
router.get("/projects/:projectId/settings",                      ctrl.getSettings);
router.patch("/projects/:projectId/settings",                    ctrl.updateSettings);

export default router;
