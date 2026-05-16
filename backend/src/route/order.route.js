import express from "express";
import orderController from "../controller/order.controller.js";
import { validateCreate, validateCancel } from "../middleware/order.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// PUBLIC: customer places order (no login required)
router.post("/public", validateCreate, orderController.publicCreate);

// Authenticated: list & view
router.get("/", requireAuth, orderController.list);
router.get("/:id", requireAuth, orderController.getOne);

// Staff + Admin: create counter bill
router.post("/", requireAuth, validateCreate, orderController.create);

// Staff + Admin: confirm or cancel
router.patch("/:id/confirm", requireAuth, orderController.confirm);
router.patch("/:id/cancel", requireAuth, validateCancel, orderController.cancel);

export default router;
