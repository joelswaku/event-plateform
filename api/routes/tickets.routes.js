// tikecket.routes.js
import express from "express";
import { createTicketOrder } from "../controllers/tickets.controller.js";

const router = express.Router();

router.post(
  "/public/events/:eventId/orders",
  createTicketOrder
);

export default router;