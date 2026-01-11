import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Get user profile
router.get("/profile", authenticate, SettingsController.getProfile);

// Update user profile
router.put("/profile", authenticate, SettingsController.updateProfile);

export default router;
