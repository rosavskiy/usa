import { DocumentModel } from "../models/document.model";
import { createWorker } from "tesseract.js";

export async function parseDocumentWithAI(
  documentId: number,
  filePath: string
) {
  console.log(`🤖 Starting AI parsing for doc ${documentId}: ${filePath}`);
  
  try {
    // Update status to processing
    await DocumentModel.updateParsedData(documentId, {}, "processing");
    console.log(`📝 Status updated to processing`);

    // Use Tesseract OCR to extract text from image
    console.log(`📸 Starting OCR with Tesseract...`);
    const worker = await createWorker("eng");
    const { data: { text: ocrText } } = await worker.recognize(filePath);
    await worker.terminate();
    console.log(`✨ OCR extracted text (${ocrText.length} chars):`);
    console.log(ocrText); // Print FULL text for debugging

    // Parse the text using regex patterns
    console.log(`🔍 Parsing extracted text...`);
    const parsedData = parseUtilityBillText(ocrText);
    console.log(`🎯 Parsed data:`, parsedData);

    // Validate that we got meaningful data
    if (!parsedData.consumption || !parsedData.consumption.value || parsedData.consumption.value === 0) {
      throw new Error("Document is unreadable or does not contain consumption data");
    }

    // Save parsed data
    await DocumentModel.updateParsedData(documentId, parsedData, "completed");
    console.log(`✅ Document ${documentId} parsing complete!`);

    return parsedData;
  } catch (error) {
    console.error("❌ AI parsing error:", error);
    
    // Save user-friendly error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userFriendlyError = "Failed to process document";
    
    if (errorMessage.includes("unreadable") || errorMessage.includes("consumption data")) {
      userFriendlyError = "Document is unreadable or does not contain utility data";
    } else if (errorMessage.includes("parse") || errorMessage.includes("extract")) {
      userFriendlyError = "Failed to extract data from document - image may be blurry or incomplete";
    } else {
      userFriendlyError = "OCR service error - please try again";
    }
    
    await DocumentModel.updateParsedData(
      documentId,
      { error: userFriendlyError, details: errorMessage },
      "failed"
    );
    throw new Error(userFriendlyError);
  }
}

function parseUtilityBillText(text: string): any {
  const lowerText = text.toLowerCase();
  
  // Detect bill type
  let type = "other";
  let provider = "Unknown";
  
  if (lowerText.includes("socalgas") || lowerText.includes("gas")) {
    type = "gas";
    provider = "SoCalGas";
  } else if (lowerText.includes("edison") || lowerText.includes("electric")) {
    type = "electricity";
    provider = "Southern California Edison";
  } else if (lowerText.includes("fuel") || lowerText.includes("gasoline")) {
    type = "fuel";
  }
  
  // Extract date (various formats)
  let date = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        date = new Date(match[0]).toISOString().split('T')[0];
        break;
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  // Extract consumption value and unit
  let consumptionValue = 0;
  let unit = type === "gas" ? "therms" : type === "electricity" ? "kWh" : "gallons";
  
  // Pattern: number followed by unit (prioritize specific patterns)
  const consumptionPatterns = [
    // Most specific first - Edison bill format
    /total\s+electricity\s+you\s+used\s+this\s+month\s+in\s+(\d+)/i,
    // SoCalGas format
    /therms\s+used[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /total\s+electricity[:\s\w]*?(\d{1,3}(?:,\d{3})*)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+therms/i,
    /(\d{1,3}(?:,\d{3})*)\s*kwh/i,
    /total\s+usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /consumption[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /(?:energy|gas|electric)[\s\w]*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
  ];
  
  // Try patterns
  for (const pattern of consumptionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      if (num >= 1 && num < 1000000) {
        consumptionValue = num;
        if (match[2]) {
          const unitMatch = match[2].toLowerCase();
          if (unitMatch.includes("kwh") || unitMatch.includes("kilowatt")) unit = "kWh";
          else if (unitMatch.includes("therm")) unit = "therms";
          else if (unitMatch.includes("gal")) unit = "gallons";
        }
        break;
      }
    }
  }
  
  // Extract amount (total bill cost)
  let amount = 0;
  const amountPatterns = [
    /total\s*(?:amount\s*)?due[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount\s*due[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /total[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }
  
  return {
    type,
    provider,
    date,
    amount,
    consumption: {
      value: consumptionValue,
      unit,
    },
    period: {
      start: date,
      end: date,
    },
  };
}
