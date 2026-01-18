import { DocumentModel } from "../models/document.model";
import { parseUtilityBillImageWithOpenAI } from "./openai.service";

export async function parseDocumentWithAI(
  documentId: number,
  filePath: string,
) {
  console.log(`🤖 Starting AI parsing for doc ${documentId}: ${filePath}`);

  try {
    // Update status to processing
    await DocumentModel.updateParsedData(documentId, {}, "processing");
    console.log(`📝 Status updated to processing`);

    // Use OpenAI Vision API for parsing
    console.log(`🤖 Using OpenAI Vision API for parsing...`);
    const parsedData = await parseUtilityBillImageWithOpenAI(filePath);
    console.log(`🎯 OpenAI parsed data:`, parsedData);

    // Save parsed data
    await DocumentModel.updateParsedData(documentId, parsedData, "completed");
    console.log(`✅ Document ${documentId} parsing complete!`);

    return parsedData;
  } catch (error) {
    console.error("❌ AI parsing error:", error);

    // Save user-friendly error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userFriendlyError = "Failed to process document";

    if (
      errorMessage.includes("Image quality too low") ||
      errorMessage.includes("clearer")
    ) {
      userFriendlyError =
        "Photo is too blurry or low resolution - please upload a clearer, higher quality photo";
    } else if (
      errorMessage.includes("unreadable") ||
      errorMessage.includes("consumption data")
    ) {
      userFriendlyError =
        "Document is unreadable or does not contain utility data";
    } else if (
      errorMessage.includes("parse") ||
      errorMessage.includes("extract")
    ) {
      userFriendlyError =
        "Failed to extract data from document - image may be blurry or incomplete";
    } else {
      userFriendlyError = "OCR service error - please try again";
    }

    await DocumentModel.updateParsedData(
      documentId,
      { error: userFriendlyError, details: errorMessage },
      "failed",
    );
    throw new Error(userFriendlyError);
  }
}

