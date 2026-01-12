import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

export interface UploadResult {
  location: string;
  bucket: string;
  key: string;
}

export async function uploadToS3(
  filePath: string,
  fileName: string
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET || "carbon-tracker-uploads";
  const key = `documents/${Date.now()}-${fileName}`;

  const fileStream = fs.createReadStream(filePath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: getContentType(fileName),
    },
  });

  const result = await upload.done();

  return {
    location: result.Location || `https://${bucket}.s3.amazonaws.com/${key}`,
    bucket,
    key,
  };
}

export async function uploadToStorage(
  filePath: string,
  fileName: string
): Promise<UploadResult> {
  // If AWS credentials are configured, use S3
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("☁️ Uploading to S3:", fileName);
    return uploadToS3(filePath, fileName);
  }

  // Fallback to local storage
  console.log("💾 Using local storage (S3 not configured):", fileName);

  return {
    location: `/uploads/${fileName}`,
    bucket: "local",
    key: fileName,
  };
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export { s3Client };
