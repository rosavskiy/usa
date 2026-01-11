import { Router } from "express";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  createManualDocument,
  deleteDocument,
  deleteDocumentsByFilename,
  downloadDocument,
} from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"));
    }
  },
});

router.post("/", authenticate, upload.single("document"), uploadDocument);
router.post("/manual", authenticate, createManualDocument);
router.get("/", authenticate, getDocuments);
router.get("/:id", authenticate, getDocumentById);
router.get("/download/:id", authenticate, downloadDocument);
router.delete("/by-filename/:filename", authenticate, deleteDocumentsByFilename);
router.delete("/:id", authenticate, deleteDocument);

export default router;
