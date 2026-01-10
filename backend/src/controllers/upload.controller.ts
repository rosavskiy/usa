import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel } from '../models/document.model';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { parseDocumentWithAI } from '../services/ai.service';

export const uploadDocument = asyncHandler(async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const userId = req.userId!;
  const filePath = req.file.path;
  const fileName = req.file.originalname;

  // Save document to database
  const document = await DocumentModel.create({
    userId,
    fileName,
    filePath,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  // Parse document with AI (async, don't wait)
  parseDocumentWithAI(document.id, filePath).catch(err => {
    console.error('AI parsing error:', err);
  });

  res.status(201).json({
    success: true,
    data: {
      id: document.id,
      fileName: document.file_name,
      uploadedAt: document.created_at,
      status: 'processing',
    },
  });
});

export const getDocuments = asyncHandler(async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.userId!;
  const documents = await DocumentModel.findByUserId(userId);

  res.json({
    success: true,
    data: documents,
  });
});

export const createManualDocument = asyncHandler(async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.userId!;
  const { type, provider, date, amount, consumption, period } = req.body;

  if (!consumption || !consumption.value || !consumption.unit) {
    throw new AppError('Consumption data is required', 400);
  }

  // Create document with manual data
  const parsedData = {
    type,
    provider: provider || 'Manual Entry',
    date,
    amount: amount || 0,
    consumption,
    period: period || { start: date, end: date },
  };

  const document = await DocumentModel.create({
    userId,
    fileName: `Manual Entry - ${type} - ${date}`,
    filePath: 'manual',
    fileType: 'manual',
    fileSize: 0,
    parsedData: parsedData,
    status: 'completed',
  });

  res.status(201).json({
    success: true,
    data: {
      id: document.id,
      fileName: document.file_name,
      uploadedAt: document.created_at,
      status: 'completed',
    },
  });
});
