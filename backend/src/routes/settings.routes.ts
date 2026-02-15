import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure logos directory exists
const logosDir = path.join(__dirname, "../../uploads/logos");
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Configure storage for logos
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, logosDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for logos
const logoFileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = /png|jpg|jpeg|svg/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files (PNG, JPG, JPEG, SVG) are allowed for logos"),
    );
  }
};

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: logoFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logos
});

const router = Router();

// Get user profile
router.get("/profile", authenticate, SettingsController.getProfile);

// Get credits balance
router.get("/credits", authenticate, async (req: any, res) => {
  try {
    const { CreditService } = await import("../services/credit.service");
    const balance = await CreditService.getBalance(req.userId);
    res.json({ credits: balance });
  } catch (error) {
    res.status(500).json({ error: "Failed to get credits balance" });
  }
});

// Update user profile
router.put("/profile", authenticate, SettingsController.updateProfile);

// Upload company logo
router.post(
  "/logo",
  authenticate,
  logoUpload.single("logo"),
  SettingsController.uploadLogo,
);

// Delete company logo
router.delete("/logo", authenticate, SettingsController.deleteLogo);

// Delete user account
router.delete("/account", authenticate, SettingsController.deleteAccount);

export default router;
