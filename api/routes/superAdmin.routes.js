import { Router } from "express";
import { authenticate }      from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";
import {
  getPlatformStats,
  getRevenueOverview,
  getAllEvents,
  getAllOrganizations,
  getAllUsers,
  updateUser,
  createEnterpriseOrganization,
  addOrgMember,
  deleteEvent,
  updateEvent,
  getOrganizationDetail,
  updateOrgPlan,
  getActivityFeed,
  getFinancialOverview,
  getPlatformHealth,
  globalSearch,
  getAuditLogs,
  getFeatureFlags,
  updateFeatureFlag,
  getModerationQueue,
  getAiInsights,
  getAdminVendors,
  updateAdminVendor,
  deleteAdminVendor,
} from "../controllers/superAdmin.controller.js";
import {
  listBroadcastsCtrl,
  getBroadcastCtrl,
  createBroadcastCtrl,
  updateBroadcastCtrl,
  deleteBroadcastCtrl,
  sendBroadcastCtrl,
  getBroadcastStatsCtrl,
} from "../controllers/broadcast.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get("/stats",         getPlatformStats);
router.get("/revenue",       getRevenueOverview);

router.get("/events",               getAllEvents);
router.patch("/events/:eventId",    updateEvent);
router.delete("/events/:eventId",   deleteEvent);

router.get("/organizations",                         getAllOrganizations);
router.post("/organizations",                        createEnterpriseOrganization);
router.get("/organizations/:orgId",                  getOrganizationDetail);
router.patch("/organizations/:orgId/plan",           updateOrgPlan);
router.post("/organizations/:orgId/members",         addOrgMember);

router.get("/users",              getAllUsers);
router.patch("/users/:userId",    updateUser);

router.get("/activity",       getActivityFeed);
router.get("/financial",      getFinancialOverview);
router.get("/health",         getPlatformHealth);
router.get("/search",         globalSearch);
router.get("/audit-logs",     getAuditLogs);
router.get("/flags",          getFeatureFlags);
router.patch("/flags/:key",   updateFeatureFlag);
router.get("/moderation",     getModerationQueue);
router.get("/ai-insights",    getAiInsights);

router.get("/vendors",              getAdminVendors);
router.patch("/vendors/:id",        updateAdminVendor);
router.delete("/vendors/:id",       deleteAdminVendor);

// ── Broadcast notifications ────────────────────────────────────────────────
router.get("/broadcasts/stats",         getBroadcastStatsCtrl);
router.get("/broadcasts",               listBroadcastsCtrl);
router.post("/broadcasts",              createBroadcastCtrl);
router.get("/broadcasts/:id",           getBroadcastCtrl);
router.patch("/broadcasts/:id",         updateBroadcastCtrl);
router.delete("/broadcasts/:id",        deleteBroadcastCtrl);
router.post("/broadcasts/:id/send",     sendBroadcastCtrl);

// ── Legal pages ────────────────────────────────────────────────────────────
import { listLegalPages, getAdminLegalPage, upsertLegalPage, deleteLegalPage } from "../controllers/legal.controller.js";
router.get("/legal",          listLegalPages);
router.get("/legal/:slug",    getAdminLegalPage);
router.put("/legal/:slug",    upsertLegalPage);
router.post("/legal",         upsertLegalPage);
router.delete("/legal/:slug", deleteLegalPage);

export default router;
