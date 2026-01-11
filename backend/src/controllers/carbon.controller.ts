import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { CarbonModel } from "../models/carbon.model";
import { calculateEmissions } from "../services/carbon.service";
import { generateRecommendations } from "../services/recommendations.service";
import { generateCarbonReport } from "../services/report.service";
import { generateCarbonReport as generateIndividualReport } from "../services/pdf.service";
import { asyncHandler, AppError } from "../middleware/error.middleware";

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

export const deleteCalculation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const calculationId = parseInt(req.params.id);

    // Get calculation to verify ownership
    const calculation = await CarbonModel.findById(calculationId);

    if (!calculation) {
      throw new AppError("Calculation not found", 404);
    }

    if (calculation.user_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Delete calculation
    await CarbonModel.delete(calculationId);
    console.log(`🗑️ Deleted calculation ${calculationId}`);

    res.json({
      success: true,
      message: "Calculation deleted successfully",
    });
  }
);

export const downloadIndividualReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const calculationId = parseInt(req.params.id);

    // Verify ownership
    const calculation = await CarbonModel.findById(calculationId);
    if (!calculation) {
      throw new AppError("Calculation not found", 404);
    }

    if (calculation.user_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Generate PDF
    const doc = await generateIndividualReport(calculationId, userId);

    // Set response headers
    const filename = `carbon-report-${calculationId}-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  }
);
