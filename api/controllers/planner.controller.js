import * as svc from "../services/planner.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);
  const statusCode = error?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

const orgId = (req) => req.organizationId;
const uid   = (req) => req.user?.id;

// ── PROJECTS ──────────────────────────────────────────────────────────────

export async function listProjects(req, res) {
  try { return res.json({ success: true, data: await svc.listProjectsService({ organizationId: orgId(req) }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to list projects"); }
}

export async function createProject(req, res) {
  try {
    const result = await svc.createProjectService({ organizationId: orgId(req), userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create project"); }
}

export async function getProject(req, res) {
  try { return res.json({ success: true, data: await svc.getProjectService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get project"); }
}

export async function updateProject(req, res) {
  try { return res.json({ success: true, data: await svc.updateProjectService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update project"); }
}

export async function deleteProject(req, res) {
  try { await svc.deleteProjectService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete project"); }
}

export async function archiveProject(req, res) {
  try { return res.json({ success: true, data: await svc.archiveProjectService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req) }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to archive project"); }
}

// ── TASKS ─────────────────────────────────────────────────────────────────

export async function getTasks(req, res) {
  try { return res.json({ success: true, data: await svc.getTasksService({ organizationId: orgId(req), projectId: req.params.projectId, filters: req.query }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get tasks"); }
}

export async function createTask(req, res) {
  try {
    const result = await svc.createTaskService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create task"); }
}

export async function updateTask(req, res) {
  try { return res.json({ success: true, data: await svc.updateTaskService({ organizationId: orgId(req), projectId: req.params.projectId, taskId: req.params.taskId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update task"); }
}

export async function deleteTask(req, res) {
  try { await svc.deleteTaskService({ organizationId: orgId(req), projectId: req.params.projectId, taskId: req.params.taskId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete task"); }
}

export async function reorderTasks(req, res) {
  try { await svc.reorderTasksService({ organizationId: orgId(req), projectId: req.params.projectId, status: req.body.status, orderedIds: req.body.orderedIds ?? req.body.taskIds }); return res.json({ success: true }); }
  catch (e) { return handleControllerError(res, e, "Failed to reorder tasks"); }
}

export async function bulkUpdateTasks(req, res) {
  try { await svc.bulkUpdateTasksService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), taskIds: req.body.taskIds, payload: req.body.payload ?? req.body }); return res.json({ success: true }); }
  catch (e) { return handleControllerError(res, e, "Failed to bulk update tasks"); }
}

// ── TIMELINE ──────────────────────────────────────────────────────────────

export async function getTimeline(req, res) {
  try { return res.json({ success: true, data: await svc.getTimelineService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get timeline"); }
}

export async function createTimelineItem(req, res) {
  try {
    const result = await svc.createTimelineItemService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create timeline item"); }
}

export async function updateTimelineItem(req, res) {
  try { return res.json({ success: true, data: await svc.updateTimelineItemService({ organizationId: orgId(req), projectId: req.params.projectId, itemId: req.params.itemId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update timeline item"); }
}

export async function deleteTimelineItem(req, res) {
  try { await svc.deleteTimelineItemService({ organizationId: orgId(req), projectId: req.params.projectId, itemId: req.params.itemId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete timeline item"); }
}

export async function reorderTimeline(req, res) {
  try { await svc.reorderTimelineItemsService({ organizationId: orgId(req), projectId: req.params.projectId, orderedIds: req.body.orderedIds }); return res.json({ success: true }); }
  catch (e) { return handleControllerError(res, e, "Failed to reorder timeline"); }
}

// ── BUDGET ────────────────────────────────────────────────────────────────

export async function getBudget(req, res) {
  try { return res.json({ success: true, data: await svc.getBudgetService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get budget"); }
}

export async function createBudgetItem(req, res) {
  try {
    const result = await svc.createBudgetItemService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create budget item"); }
}

export async function updateBudgetItem(req, res) {
  try { return res.json({ success: true, data: await svc.updateBudgetItemService({ organizationId: orgId(req), projectId: req.params.projectId, itemId: req.params.itemId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update budget item"); }
}

export async function deleteBudgetItem(req, res) {
  try { await svc.deleteBudgetItemService({ organizationId: orgId(req), projectId: req.params.projectId, itemId: req.params.itemId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete budget item"); }
}

// ── VENDORS ───────────────────────────────────────────────────────────────

export async function getVendors(req, res) {
  try { return res.json({ success: true, data: await svc.getVendorsService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get vendors"); }
}

export async function createVendor(req, res) {
  try {
    const result = await svc.createVendorService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create vendor"); }
}

export async function updateVendor(req, res) {
  try { return res.json({ success: true, data: await svc.updateVendorService({ organizationId: orgId(req), projectId: req.params.projectId, vendorId: req.params.vendorId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update vendor"); }
}

export async function deleteVendor(req, res) {
  try { await svc.deleteVendorService({ organizationId: orgId(req), projectId: req.params.projectId, vendorId: req.params.vendorId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete vendor"); }
}

// ── TEAM ──────────────────────────────────────────────────────────────────

export async function getTeam(req, res) {
  try { return res.json({ success: true, data: await svc.getTeamService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get team"); }
}

export async function inviteTeamMember(req, res) {
  try {
    const result = await svc.inviteTeamMemberService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    const type = result?.type || (result ? 'added' : 'invited');
    return res.status(201).json({ success: true, data: result, type });
  } catch (e) { return handleControllerError(res, e, "Failed to invite team member"); }
}

export async function updateTeamMember(req, res) {
  try { return res.json({ success: true, data: await svc.updateTeamMemberService({ organizationId: orgId(req), projectId: req.params.projectId, memberId: req.params.memberId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update team member"); }
}

export async function removeTeamMember(req, res) {
  try { await svc.removeTeamMemberService({ organizationId: orgId(req), projectId: req.params.projectId, memberId: req.params.memberId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to remove team member"); }
}

// ── NOTES ─────────────────────────────────────────────────────────────────

export async function getNotes(req, res) {
  try { return res.json({ success: true, data: await svc.getNotesService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get notes"); }
}

export async function createNote(req, res) {
  try {
    const result = await svc.createNoteService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to create note"); }
}

export async function updateNote(req, res) {
  try { return res.json({ success: true, data: await svc.updateNoteService({ organizationId: orgId(req), projectId: req.params.projectId, noteId: req.params.noteId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update note"); }
}

export async function deleteNote(req, res) {
  try { await svc.deleteNoteService({ organizationId: orgId(req), projectId: req.params.projectId, noteId: req.params.noteId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete note"); }
}

// ── FILES ─────────────────────────────────────────────────────────────────

export async function getFiles(req, res) {
  try { return res.json({ success: true, data: await svc.getFilesService({ organizationId: orgId(req), projectId: req.params.projectId, folder: req.query.folder }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get files"); }
}

export async function uploadFile(req, res) {
  try {
    const result = await svc.uploadFileService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), fileData: req.body });
    return res.status(201).json({ success: true, data: result });
  } catch (e) { return handleControllerError(res, e, "Failed to upload file"); }
}

export async function deleteFile(req, res) {
  try { await svc.deleteFileService({ organizationId: orgId(req), projectId: req.params.projectId, fileId: req.params.fileId, userId: uid(req) }); return res.status(204).send(); }
  catch (e) { return handleControllerError(res, e, "Failed to delete file"); }
}

// ── AI GENERATION ─────────────────────────────────────────────────────────

export async function generateAIBrief(req, res) {
  try { return res.json({ success: true, data: await svc.generateAIBriefService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate AI brief"); }
}

export async function generateAITasks(req, res) {
  try { return res.json({ success: true, data: await svc.generateAITasksService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate AI tasks"); }
}

export async function generateAITimeline(req, res) {
  try { return res.json({ success: true, data: await svc.generateAITimelineService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate AI timeline"); }
}

export async function generateAIBudget(req, res) {
  try { return res.json({ success: true, data: await svc.generateAIBudgetService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate AI budget"); }
}

export async function generateAIVendors(req, res) {
  try { return res.json({ success: true, data: await svc.generateAIVendorsService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate AI vendors"); }
}

export async function getRiskAnalysis(req, res) {
  try { return res.json({ success: true, data: await svc.generateRiskAnalysisService({ organizationId: orgId(req), userId: uid(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to generate risk analysis"); }
}

// ── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSettings(req, res) {
  try { return res.json({ success: true, data: await svc.getSettingsService({ organizationId: orgId(req), projectId: req.params.projectId }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to get settings"); }
}

export async function updateSettings(req, res) {
  try { return res.json({ success: true, data: await svc.updateSettingsService({ organizationId: orgId(req), projectId: req.params.projectId, userId: uid(req), payload: req.body }) }); }
  catch (e) { return handleControllerError(res, e, "Failed to update settings"); }
}
