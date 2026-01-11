import { DocumentModel } from "../models/document.model";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

export async function parseDocumentWithAI(
  documentId: number,
  filePath: string
) {
  console.log(`🤖 Starting AI parsing for doc ${documentId}: ${filePath}`);

  try {
    // Update status to processing
    await DocumentModel.updateParsedData(documentId, {}, "processing");
    console.log(`📝 Status updated to processing`);

    // Use OCR.space API (25,000 free requests/month)
    console.log(`📸 Starting OCR with OCR.space API...`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 is more accurate

    let response;
    let retries = 0;
    const maxRetries = 2;

    // Retry logic for OCR.space timeouts
    while (retries <= maxRetries) {
      try {
        response = await axios.post(
          "https://api.ocr.space/parse/image",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              apikey: process.env.OCR_SPACE_API_KEY || "K87899142388957", // Free API key
            },
            timeout: 60000, // 60 second timeout
          }
        );

        // Check for timeout error (E101)
        if (response.data.IsErroredOnProcessing && 
            response.data.ErrorMessage && 
            response.data.ErrorMessage[0]?.includes('E101')) {
          if (retries < maxRetries) {
            console.log(`⏳ OCR timeout - retrying (${retries + 1}/${maxRetries})...`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          }
        }

        break; // Success or non-timeout error
      } catch (error: any) {
        if (retries < maxRetries && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
          console.log(`⏳ Network timeout - retrying (${retries + 1}/${maxRetries})...`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw error;
      }
    }

    if (!response) {
      throw new Error("OCR service error - maximum retries exceeded");
    }

    // Log full OCR.space response for debugging
    console.log(`🔍 OCR.space response status:`, response.data.OCRExitCode);
    console.log(`🔍 OCR.space error message:`, response.data.ErrorMessage);
    console.log(`🔍 OCR.space IsErroredOnProcessing:`, response.data.IsErroredOnProcessing);

    // Check for OCR.space API errors
    if (response.data.IsErroredOnProcessing) {
      throw new Error(`OCR API error: ${response.data.ErrorMessage || 'Unknown error'}`);
    }

    if (
      !response.data.ParsedResults ||
      response.data.ParsedResults.length === 0
    ) {
      throw new Error("Image quality too low - please upload a clearer photo or use Manual Entry");
    }

    const ocrText = response.data.ParsedResults[0].ParsedText || "";

    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error("Image quality too low - please upload a clearer, higher resolution photo");
    }

    console.log(`✨ OCR extracted text (${ocrText.length} chars):`);
    console.log(ocrText); // Print FULL text for debugging

    // Parse the text using regex patterns
    console.log(`🔍 Parsing extracted text...`);
    const parsedData = parseUtilityBillText(ocrText);
    console.log(`🎯 Parsed data:`, parsedData);

    // Validate that we got meaningful data
    if (
      !parsedData.consumption ||
      !parsedData.consumption.value ||
      parsedData.consumption.value === 0
    ) {
      throw new Error(
        "Document is unreadable or does not contain consumption data"
      );
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

    if (errorMessage.includes("Image quality too low") || errorMessage.includes("clearer")) {
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
      "failed"
    );
    throw new Error(userFriendlyError);
  }
}

function parseUtilityBillText(text: string): any {
  const lowerText = text.toLowerCase();

  // Detect bill type (PRIORITY ORDER: specific first)
  let type = "other";
  let provider = "Unknown";

  // FUEL - check for gallons (gas station receipts, fuel delivery)
  if (lowerText.includes("gallon") || lowerText.includes("fuel sale") || lowerText.includes("gasoline")) {
    type = "fuel";
    provider = "Fuel Supplier";
  }
  // GAS - natural gas utility bills
  else if (lowerText.includes("socalgas") || lowerText.includes("north shore gas") || 
           (lowerText.includes("gas") && (lowerText.includes("therm") || lowerText.includes("ccf")))) {
    type = "gas";
    if (lowerText.includes("socalgas")) provider = "SoCalGas";
    else if (lowerText.includes("north shore")) provider = "North Shore Gas";
    else provider = "Gas Company";
  }
  // ELECTRICITY - electric utility bills
  else if (lowerText.includes("edison") || lowerText.includes("electric") || lowerText.includes("kwh")) {
    type = "electricity";
    if (lowerText.includes("edison")) provider = "Southern California Edison";
    else if (lowerText.includes("pascoag")) provider = "Pascoag Utility District";
    else provider = "Electric Company";
  }

  // Extract US state (for regional electricity factors)
  let state = "";
  const statePatterns = [
    // Two-letter state codes with context (MOST SPECIFIC FIRST - avoid POD-ID, SERVICE-ID, etc.)
    /(?:,\s*|\s+)(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+\d{5}(?:-\d{4})?\b/i, // State + ZIP code (with optional +4)
    /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i, // City, State (comma separated)
    // Full state names (common ones)
    /\b(california|texas|new york|florida|illinois|pennsylvania|ohio|georgia|north carolina|michigan|new jersey|virginia|washington|arizona|massachusetts|tennessee|indiana|missouri|maryland|wisconsin|colorado|minnesota|south carolina|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|new mexico|nebraska|west virginia|idaho|hawaii|new hampshire|maine|montana|rhode island|delaware|south dakota|north dakota|alaska|vermont|wyoming)\b/i,
  ];

  for (const pattern of statePatterns) {
    const match = text.match(pattern);
    if (match) {
      let stateStr = match[1].toUpperCase();
      // Convert full names to abbreviations
      const stateMap: { [key: string]: string } = {
        CALIFORNIA: "CA",
        TEXAS: "TX",
        "NEW YORK": "NY",
        FLORIDA: "FL",
        ILLINOIS: "IL",
        PENNSYLVANIA: "PA",
        OHIO: "OH",
        GEORGIA: "GA",
        "NORTH CAROLINA": "NC",
        MICHIGAN: "MI",
        "NEW JERSEY": "NJ",
        VIRGINIA: "VA",
        WASHINGTON: "WA",
        ARIZONA: "AZ",
        MASSACHUSETTS: "MA",
        TENNESSEE: "TN",
        INDIANA: "IN",
        MISSOURI: "MO",
        MARYLAND: "MD",
        WISCONSIN: "WI",
        COLORADO: "CO",
        MINNESOTA: "MN",
        "SOUTH CAROLINA": "SC",
        ALABAMA: "AL",
        LOUISIANA: "LA",
        KENTUCKY: "KY",
        OREGON: "OR",
        OKLAHOMA: "OK",
        CONNECTICUT: "CT",
        UTAH: "UT",
        IOWA: "IA",
        NEVADA: "NV",
        ARKANSAS: "AR",
        MISSISSIPPI: "MS",
        KANSAS: "KS",
        "NEW MEXICO": "NM",
        NEBRASKA: "NE",
        "WEST VIRGINIA": "WV",
        IDAHO: "ID",
        HAWAII: "HI",
        "NEW HAMPSHIRE": "NH",
        MAINE: "ME",
        MONTANA: "MT",
        "RHODE ISLAND": "RI",
        DELAWARE: "DE",
        "SOUTH DAKOTA": "SD",
        "NORTH DAKOTA": "ND",
        ALASKA: "AK",
        VERMONT: "VT",
        WYOMING: "WY",
      };
      state = stateMap[stateStr] || stateStr;
      break;
    }
  }

  // Extract date (various formats)
  let date = new Date().toISOString().split("T")[0];
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        date = new Date(match[0]).toISOString().split("T")[0];
        break;
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Extract consumption value and unit
  let consumptionValue = 0;
  let unit =
    type === "gas" ? "therms" : type === "electricity" ? "kWh" : "gallons";

  // Pattern: number followed by unit (MOST SPECIFIC FIRST!)
  const consumptionPatterns = [
    // ELECTRICITY - Edison bill format (MUST BE FIRST - very specific)
    /total\s+electricity\s+you\s+used\s+this\s+month\s+in\s+(?:kwh\s+)?(\d{1,3}(?:,\d{3})*)/i,
    /total\s+(?:kwh\s+)?usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,

    // GAS - Various formats (SoCalGas, North Shore Gas, etc.)
    /gas\s+usage\s+history[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i, // "Gas Usage History ... 55 Therms"
    /(?:total\s+)?therms?\s+used[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /total\s+therma?s?[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /difference[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*therms?/i, // "Difference: 37 Therms"
    /gas\s+service[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*therms?/i, // "Gas Service: 37 Therms"
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+therms?(?!\s*allowance)/i, // Exclude baseline
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*ccf/i, // CCF (hundred cubic feet) - some utilities use this

    // FUEL - Gas station / fuel delivery receipts (HIGH PRIORITY)
    /gallons?[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i, // "GALLONS: 357"
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*gal(?:lons?)?(?!\s*per)/i, // "357 gallons" (exclude "gal per mile")
    /fuel\s+sale[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i, // "FUEL SALE ... 357"

    // GENERIC patterns (last resort)
    /(\d{1,3}(?:,\d{3})*)\s*kwh/i,
    /usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?:\s*(?:kwh|therms?|gal))?/i,
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
          if (unitMatch.includes("kwh") || unitMatch.includes("kilowatt"))
            unit = "kWh";
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
    state, // Auto-detected state from bill
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
