
import { Router } from "express";

import authRoutes from "./auth.routes.js";
import eventsRoutes from "./events.routes.js";
import guestsRoutes from "./guests.routes.js";
import guestPublicRoutes from "./guest-public.routes.js";
import seatRoutes from "./seating.routes.js";

import ticketsRoutes from "./tickets.routes.js";
import publicTicketsRoutes from "./public.tickets.routes.js";
import ticketCheckinRoutes from "./ticket-checkin.routes.js";
import scannerRoutes from "./scanner.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import ticketTypesRoutes from "./ticket-types.routes.js";

import eventBuilderRoutes from "./event-builder.routes.js";
import engagementRoutes from "./engagement.routes.js";

const router = Router();

// 🔓 PUBLIC
router.use("/auth", authRoutes);
router.use("/public", publicTicketsRoutes);
router.use("/public", guestPublicRoutes);

// 🔐 CORE FEATURES
router.use("/events", eventsRoutes);
router.use("/guests", guestsRoutes);
router.use("/seating", seatRoutes);

// 🎟️ TICKETING
router.use("/tickets", ticketsRoutes);
router.use("/ticket-types", ticketTypesRoutes);
router.use("/checkin", ticketCheckinRoutes);

// 📡 SCANNER
router.use("/scanner", scannerRoutes);

// 📊 DASHBOARD
router.use("/dashboard", dashboardRoutes);

// 💍 ENGAGEMENT (FIXED PREFIX)
router.use("/engagement", engagementRoutes);

// 🌐 EVENT BUILDER (FIXED PREFIX)
router.use("/builder", eventBuilderRoutes);

export default router;

// const router = Router();

// router.use("/", engagementRoutes);
// router.use("/", eventBuilderRoutes);


// router.use("/auth", authRoutes);
// router.use("/events", eventsRoutes);
// router.use("/", guestsRoutes);

// router.use("/seating", seatRoutes);

// // 🔒 private
// router.use("/tickets", ticketsRoutes);
// router.use("/checkin", ticketCheckinRoutes);
// router.use("/scanner", scannerRoutes);
// router.use("/dashboard", dashboardRoutes);

// // 🌍 public (FIXED)
// router.use("/public", publicTicketsRoutes);
// router.use("/public", guestPublicRoutes);

// router.use("/", ticketTypesRoutes);



// export default router;







