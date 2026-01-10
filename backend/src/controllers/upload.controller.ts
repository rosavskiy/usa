import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { DocumentModel } from "../models/document.model";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { parseDocumentWithAI } from "../services/ai.service";

export const uploadDocument = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const userId = req.userId!;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`📤 Upload: userId=${userId}, file=${fileName}, path=${filePath}`);

    // Save document to database
    const document = await DocumentModel.create({
      userId,
      fileName,
      filePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    console.log(`💾 Document saved: docId=${document.id}`);

    // Parse document with AI (WAIT for result)
    try {
      await parseDocumentWithAI(document.id, filePath);
      console.log(`✅ AI parsed document ${document.id} successfully`);
    } catch (err) {
      console.error("❌ AI parsing error:", err);
      // Continue anyway, user can calculate manually
    }

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        fileName: document.file_name,
        uploadedAt: document.created_at,
        status: "processing",
      },
    });
  }
);

export const getDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const documents = await DocumentModel.findByUserId(userId);

    res.json({
      success: true,
      data: documents,
    });
  }
);

export const createManualDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { type, provider, date, amount, consumption, period, state } = req.body;

    if (!consumption || !consumption.value || !consumption.unit) {
      throw new AppError("Consumption data is required", 400);
    }

    // Create document with manual data
    const parsedData = {
      type,
      provider: provider || "Manual Entry",
      date,
      amount: amount || 0,
      consumption,
      period: period || { start: date, end: date },
      state: state || null, // for electricity emission factors
    };

    const document = await DocumentModel.create({
      userId,
      fileName: `Manual Entry - ${type} - ${date}`,
      filePath: "manual",
      fileType: "manual",
      fileSize: 0,
      parsedData: parsedData,
      status: "completed",
    });

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        fileName: document.file_name,
        uploadedAt: document.created_at,
        status: "completed",
      },
    });
  }
);
