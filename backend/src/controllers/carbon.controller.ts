import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { CarbonModel } from "../models/carbon.model";
import { calculateEmissions } from "../services/carbon.service";
import { generateRecommendations } from "../services/recommendations.service";
import { generateCarbonReport } from "../services/report.service";
import { asyncHandler } from "../middleware/error.middleware";

export const calculateCarbon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { documentId } = req.body;

    const calculation = await calculateEmissions(userId, documentId);

    res.json({
      success: true,
      data: calculation,
    });
  }
);

export const getCalculations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const calculations = await CarbonModel.findByUserId(userId);

    res.json({
      success: true,
      data: calculations,
    });
  }
);

export const getRecommendations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const recommendations = await generateRecommendations(userId);

    res.json({
      success: true,
      data: recommendations,
    });
  }
);

export const exportReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { startDate, endDate, period } = req.query;

    const pdfBuffer = await generateCarbonReport({
      userId,
      startDate: startDate as string,
      endDate: endDate as string,
      period: period as "month" | "quarter" | "year",
    });

    const filename = `carbon-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
);
