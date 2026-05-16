import express from "express";
import dashboardController from "../controller/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", requireAuth, dashboardController.summary);
router.get("/monthly-sales", requireAuth, dashboardController.monthlySales);
router.get("/weekly-sales", requireAuth, dashboardController.weeklySales);
router.get("/year-compare", requireAuth, dashboardController.yearCompare);
router.get("/low-stock", requireAuth, dashboardController.lowStock);
router.get("/recent-orders", requireAuth, dashboardController.recentOrders);

export default router;
