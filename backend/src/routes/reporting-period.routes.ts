import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createReportingPeriod,
  getActivePeriod,
  getAllPeriods,
  setActivePeriod,
  deletePeriod,
  deactivateAllPeriods,
} from "../controllers/reporting-period.controller";

const router = Router();

router.post("/", authenticate, createReportingPeriod);
router.get("/active", authenticate, getActivePeriod);
router.get("/", authenticate, getAllPeriods);
router.put("/:periodId/activate", authenticate, setActivePeriod);
router.post("/deactivate", authenticate, deactivateAllPeriods);
router.delete("/:periodId", authenticate, deletePeriod);

export default router;
