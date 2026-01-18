import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import {
  ComputerVisionClient,
  ComputerVisionModels,
} from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Azure Computer Vision configuration with multiple keys for rotation
const azureConfigs = [
  {
    key: process.env.AZURE_CV_KEY_1,
    endpoint: process.env.AZURE_CV_ENDPOINT_1,
  },
  {
    key: process.env.AZURE_CV_KEY_2,
    endpoint: process.env.AZURE_CV_ENDPOINT_2,
  },
  {
    key: process.env.AZURE_CV_KEY_3,
    endpoint: process.env.AZURE_CV_ENDPOINT_3,
  },
].filter((config) => config.key && config.endpoint); // Only use configured keys

let currentAzureKeyIndex = 0;

// OCR with Azure Computer Vision (with automatic key rotation)
async function ocrWithAzure(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);

  for (let attempt = 0; attempt < azureConfigs.length; attempt++) {
    const config = azureConfigs[currentAzureKeyIndex];

    try {
      console.log(
        `🔵 Trying Azure CV key ${currentAzureKeyIndex + 1}/${azureConfigs.length}...`
      );

      const credentials = new ApiKeyCredentials({
        inHeader: { "Ocp-Apim-Subscription-Key": config.key! },
      });
      const client = new ComputerVisionClient(credentials, config.endpoint!);

      // Read text from image
      const readResult = await client.readInStream(fileBuffer);
      const operationId = readResult.operationLocation.split("/").pop()!;

      // Poll for result
      let result: ComputerVisionModels.ReadOperationResult;
      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await client.getReadResult(operationId);
      } while (result.status === "running" || result.status === "notStarted");

      if (result.status !== "succeeded") {
        throw new Error(`Azure OCR failed with status: ${result.status}`);
      }

      // Extract text
      const text =
        result.analyzeResult?.readResults
          ?.map((page) => page.lines?.map((line) => line.text).join("\n"))
          .join("\n\n") || "";

      console.log(`✅ Azure CV succeeded with key ${currentAzureKeyIndex + 1}`);
      return text;
    } catch (error: any) {
      console.error(
        `❌ Azure CV key ${currentAzureKeyIndex + 1} failed:`,
        error.message
      );

      // Check if quota exceeded (429) or authentication failed (401)
      if (
        error.statusCode === 429 ||
        error.statusCode === 403 ||
        error.statusCode === 401 ||
        error.message?.includes("quota") ||
        error.message?.includes("limit")
      ) {
        console.log(
          `⚠️ Key ${currentAzureKeyIndex + 1} quota exceeded, rotating...`
        );
        currentAzureKeyIndex = (currentAzureKeyIndex + 1) % azureConfigs.length;

        // If we've tried all keys, throw error
        if (attempt === azureConfigs.length - 1) {
          throw new Error("All Azure CV keys have exceeded quota");
        }
        continue;
      }

      // For other errors, try next key
      currentAzureKeyIndex = (currentAzureKeyIndex + 1) % azureConfigs.length;
      if (attempt === azureConfigs.length - 1) {
        throw error;
      }
    }
  }

  throw new Error("Azure OCR failed with all keys");
}

// OCR with OCR.space (fallback)
async function ocrWithOcrSpace(filePath: string): Promise<string> {
  console.log(`📸 Trying OCR.space API (fallback)...`);

  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");

  const response = await axios.post(
    "https://api.ocr.space/parse/image",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        apikey: process.env.OCR_SPACE_API_KEY || "K87899142388957",
      },
      timeout: 30000,
    }
  );

  if (response.data.IsErroredOnProcessing) {
    throw new Error("OCR.space processing failed");
  }

  const parsedResults = response.data.ParsedResults?.[0];
  if (!parsedResults || !parsedResults.ParsedText) {
    throw new Error("No text extracted from OCR.space");
  }

  return parsedResults.ParsedText;
}

/**
 * Extract text using EasyOCR (local Python service)
 */
async function ocrWithEasyOCR(filePath: string): Promise<string> {
  // Read file and convert to base64
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  
  // Path to Python script
  const scriptPath = path.join(__dirname, 'easyocr_service.py');
  
  // Call Python script with base64 image as argument
  const { stdout, stderr } = await execAsync(
    `py "${scriptPath}" "${base64Image}"`,
    { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
  );
  
  // Log Python stderr (for debugging)
  if (stderr) {
    console.log('🐍 EasyOCR:', stderr.trim());
  }
  
  // Parse JSON response
  const result = JSON.parse(stdout);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✅ EasyOCR extracted ${result.char_count} characters`);
  return result.text;
}

// Main OCR function with fallback chain
export async function extractTextFromImage(filePath: string): Promise<string> {
  let extractedText = "";

  try {
    // 1. Try EasyOCR first (local, highest accuracy)
    console.log('📸 Trying EasyOCR (local Python)...');
    extractedText = await ocrWithEasyOCR(filePath);
    console.log(`✅ EasyOCR successful`);
  } catch (easyOcrError: any) {
    console.log(`⚠️ EasyOCR failed: ${easyOcrError.message}`);
    
    try {
      // 2. Try Azure CV (with key rotation)
      if (azureConfigs.length > 0) {
        extractedText = await ocrWithAzure(filePath);
        console.log(`✅ Azure CV OCR successful`);
      } else {
        console.log("⚠️ No Azure CV keys configured, using OCR.space");
        extractedText = await ocrWithOcrSpace(filePath);
        console.log(`✅ OCR.space OCR successful`);
      }
    } catch (azureError: any) {
      console.error(
        "❌ Azure OCR failed, falling back to OCR.space:",
        azureError.message
      );
      try {
        // 3. Final fallback to OCR.space
        extractedText = await ocrWithOcrSpace(filePath);
        console.log(`✅ OCR.space fallback successful`);
      } catch (ocrSpaceError: any) {
        console.error("❌ OCR.space also failed:", ocrSpaceError.message);
        throw new Error(
          "All OCR services failed - please try a clearer, higher resolution photo"
        );
      }
    }
  }

  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error(
      "Text not readable - please upload a clearer, higher resolution photo"
    );
  }

  return extractedText;
}
