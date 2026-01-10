import { Router } from "express";
import {
  calculateCarbon,
  getCalculations,
  getRecommendations,
  exportReport,
} from "../controllers/carbon.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/calculate", authenticate, calculateCarbon);
router.get("/calculations", authenticate, getCalculations);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/export", authenticate, exportReport);

export default router;
