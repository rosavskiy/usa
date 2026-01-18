import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import ReportingPeriodModel from "../models/reporting-period.model";

export const createReportingPeriod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { period_type, start_date, end_date } = req.body;

    if (!period_type || !start_date || !end_date) {
      res
        .status(400)
        .json({ error: "Period type, start date, and end date are required" });
      return;
    }

    const period = await ReportingPeriodModel.create(userId, {
      period_type,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });

    res.json(period);
  },
);

export const getActivePeriod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const period = await ReportingPeriodModel.getActive(userId);

    res.json(period);
  },
);

export const getAllPeriods = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const periods = await ReportingPeriodModel.getAll(userId);

    res.json(periods);
  },
);

export const setActivePeriod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { periodId } = req.params;

    await ReportingPeriodModel.setActive(userId, parseInt(periodId));

    res.json({ success: true });
  },
);

export const deletePeriod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { periodId } = req.params;

    await ReportingPeriodModel.delete(userId, parseInt(periodId));

    res.json({ success: true });
  },
);

export const deactivateAllPeriods = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    await ReportingPeriodModel.deactivateAll(userId);

    res.json({ success: true });
  },
);
