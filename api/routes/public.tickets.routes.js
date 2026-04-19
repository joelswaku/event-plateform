// This route is for public ticket purchasing, no authentication required
import express from "express";
import { createTicketOrder } from "../controllers/tickets.controller.js";

const router = express.Router();

router.post("/events/:eventId/orders", createTicketOrder);


export default router;