import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listContacts,
  listConversations,
  createConversation,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
  typing,
  unreadCount,
  broadcast,
  openSupport,
  stream,
} from "../controllers/chat.controller.js";

const router = Router();

// Real-time stream — authenticates internally (supports ?token= for EventSource)
router.get("/stream", stream);

// Everything else requires a valid session
router.use(authenticate);

router.get("/contacts",       listContacts);
router.get("/unread-count",   unreadCount);
router.post("/support",       openSupport);

router.get("/conversations",                  listConversations);
router.post("/conversations",                 createConversation);
router.get("/conversations/:id",              getConversation);
router.get("/conversations/:id/messages",     getMessages);
router.post("/conversations/:id/messages",    sendMessage);
router.post("/conversations/:id/read",        markRead);
router.post("/conversations/:id/typing",      typing);

router.post("/broadcast",     broadcast);

export default router;
