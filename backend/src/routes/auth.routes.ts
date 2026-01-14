import { Router } from "express";
import {
  register,
  login,
  getProfile,
  googleCallback,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import passport from "../config/passport";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=auth_failed`,
  }),
  googleCallback
);

export default router;
