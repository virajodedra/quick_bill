import express from "express";
import authController from "../controller/auth.controller.js";
import {
  validateLogin,
  validateRegister,
  validateRefresh,
  validateLogout,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/refresh", validateRefresh, authController.refresh);
router.post("/logout", validateLogout, authController.logout);

export default router;
