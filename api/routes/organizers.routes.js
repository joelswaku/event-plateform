import { Router } from "express";
import * as ctrl from "../controllers/organizers.controller.js";
import { organizerAuth } from "../controllers/organizers.controller.js";

const r = Router();

// Public auth
r.post("/auth/register", ctrl.register);
r.post("/auth/login",    ctrl.login);

// Protected
r.get("/me",                              organizerAuth, ctrl.getMe);
r.patch("/me",                            organizerAuth, ctrl.updateMe);
r.get("/me/saved",                        organizerAuth, ctrl.getSaved);
r.post("/me/saved/:vendorId",             organizerAuth, ctrl.saveVendor);
r.delete("/me/saved/:vendorId",           organizerAuth, ctrl.unsaveVendor);

export default r;
