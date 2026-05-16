import express from "express";
import productController from "../controller/product.controller.js";
import {
  validateCreate,
  validateUpdate,
  validateList,
} from "../middleware/product.middleware.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// GET routes: PUBLIC (customer store + authenticated staff/admin)
router.get("/", validateList, productController.list);
router.get("/:id", productController.getOne);

// Mutating routes: admin only
router.post("/", requireAuth, requireRole("admin"), validateCreate, productController.create);
router.patch("/:id", requireAuth, requireRole("admin"), validateUpdate, productController.update);
router.delete("/:id", requireAuth, requireRole("admin"), productController.remove);

export default router;
