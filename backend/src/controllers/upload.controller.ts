import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { DocumentModel } from "../models/document.model";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { parseDocumentWithAI } from "../services/ai.service";
import fs from "fs";

export const uploadDocument = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const userId = req.userId!;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(
      `📤 Upload: userId=${userId}, file=${fileName}, path=${filePath}`
    );

    // Check for duplicate filename
    const existingDoc = await DocumentModel.findByFileName(userId, fileName);
    if (existingDoc) {
      console.log(`⚠️ Duplicate file detected: ${fileName} - skipping upload`);
      // Delete uploaded file
      fs.unlinkSync(filePath);
      
      res.status(200).json({
        success: true,
        data: {
          id: existingDoc.id,
          fileName: existingDoc.file_name,
          uploadedAt: existingDoc.created_at,
          status: existingDoc.status,
          duplicate: true,
        },
      });
      return;
    }

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string; // 'readable' or 'unreadable'
    
    const offset = (page - 1) * limit;
    
    let documents = await DocumentModel.findByUserId(userId);
    
    // Filter by status if provided
    if (status === 'readable') {
      documents = documents.filter(d => d.status === 'completed');
    } else if (status === 'unreadable') {
      documents = documents.filter(d => d.status === 'failed');
    }
    
    const total = documents.length;
    const paginatedDocs = documents.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedDocs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const deleteDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const documentId = parseInt(req.params.id);

    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new AppError("Document not found", 404);
    }

    if (document.user_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Delete file from filesystem (if not manual entry)
    if (document.file_path !== 'manual' && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
      console.log(`🗑️ Deleted file: ${document.file_path}`);
    }

    // Delete from database
    await DocumentModel.delete(documentId);
    console.log(`🗑️ Deleted document ${documentId}`);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  }
);

export const downloadDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const documentId = parseInt(req.params.id);

    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new AppError("Document not found", 404);
    }

    if (document.user_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    if (document.file_path === 'manual') {
      throw new AppError("Cannot download manual entry", 400);
    }

    if (!fs.existsSync(document.file_path)) {
      throw new AppError("File not found on server", 404);
    }

    res.download(document.file_path, document.file_name);
  }
);

export const createManualDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { type, provider, date, amount, consumption, period, state } =
      req.body;

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
