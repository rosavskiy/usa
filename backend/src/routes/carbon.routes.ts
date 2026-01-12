import { Router } from "express";
import {
  calculateCarbon,
  getCalculations,
  getRecommendations,
  exportReport,
  deleteCalculation,
  updateCalculation,
  downloadIndividualReport,
  downloadAnnualReport,
  replaceDocument,
} from "../controllers/carbon.controller";
import { exportCSV } from "../controllers/export.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/calculate", authenticate, calculateCarbon);
router.get("/calculations", authenticate, getCalculations);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/export", authenticate, exportReport);
router.get("/export-csv", authenticate, exportCSV);
router.delete("/calculations/:id", authenticate, deleteCalculation);
router.put("/calculations/:id", authenticate, updateCalculation);
router.put("/calculations/:id/replace", authenticate, replaceDocument);
router.get("/calculations/:id/report", authenticate, downloadIndividualReport);
router.get("/annual-report/:year", authenticate, downloadAnnualReport);

export default router;
