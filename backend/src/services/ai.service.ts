import { DocumentModel } from "../models/document.model";
import { extractTextFromImage } from "./ocr.service";

export async function parseDocumentWithAI(
  documentId: number,
  filePath: string
) {
  console.log(`🤖 Starting AI parsing for doc ${documentId}: ${filePath}`);

  try {
    // Update status to processing
    await DocumentModel.updateParsedData(documentId, {}, "processing");
    console.log(`📝 Status updated to processing`);

    // Extract text using OCR (Azure CV with rotation -> OCR.space fallback)
    const ocrText = await extractTextFromImage(filePath);
    console.log(`✨ OCR extracted text (${ocrText.length} chars):`);
    console.log(ocrText);

    // Parse the text using regex patterns
    console.log(`🔍 Parsing extracted text...`);
    const parsedData = parseUtilityBillText(ocrText);
    console.log(`🎯 Parsed data:`, parsedData);

    // Check for watermarks ONLY if parsing failed or suspicious values
    const hasWatermark = detectWatermark(ocrText);
    const hasLowConfidence =
      parsedData.consumption &&
      (parsedData.consumption.value === 0 || !parsedData.consumption.value);

    // Add watermark warning ONLY if it affects data quality
    if (hasWatermark && hasLowConfidence) {
      parsedData.warning =
        "Watermark detected - numbers may be partially obscured. Please verify the extracted data is correct.";
      console.log(`⚠️ Watermark detected and affecting readability`);
    }

    // Validate that we got meaningful data
    if (
      !parsedData.consumption ||
      !parsedData.consumption.value ||
      parsedData.consumption.value === 0
    ) {
      throw new Error(
        "Consumption data not found on photo - please ensure the bill is fully visible and try again"
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
      "failed"
    );
    throw new Error(userFriendlyError);
  }
}

function detectWatermark(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Common watermark patterns
  const watermarkPatterns = [
    /roposh/i,
    /sample/i,
    /demo/i,
    /specimen/i,
    /watermark/i,
    /not valid/i,
    /for illustration only/i,
    /template/i,
  ];

  return watermarkPatterns.some((pattern) => pattern.test(lowerText));
}

function parseUtilityBillText(text: string): any {
  console.log(`🔍 Parsing extracted text...`);
  
  // Normalize text for better regex matching
  const normalizedText = text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n\s+/g, '\n') // Remove leading spaces after newlines
    .trim();
  
  const lowerText = normalizedText.toLowerCase();

  // Detect bill type (PRIORITY ORDER: specific first)
  let type = "other";
  let provider = "Unknown";

  // FUEL - check for gallons (gas station receipts, fuel delivery)
  if (
    lowerText.includes("gallon") ||
    lowerText.includes("fuel sale") ||
    lowerText.includes("gasoline")
  ) {
    type = "fuel";
    provider = "Fuel Supplier";
  }
  // GAS - natural gas utility bills
  else if (
    lowerText.includes("socalgas") ||
    lowerText.includes("north shore gas") ||
    (lowerText.includes("gas") &&
      (lowerText.includes("therm") || lowerText.includes("ccf")))
  ) {
    type = "gas";
    if (lowerText.includes("socalgas")) provider = "SoCalGas";
    else if (lowerText.includes("north shore")) provider = "North Shore Gas";
    else provider = "Gas Company";
  }
  // ELECTRICITY - electric utility bills
  else if (
    lowerText.includes("edison") ||
    lowerText.includes("electric") ||
    lowerText.includes("kwh")
  ) {
    type = "electricity";
    if (lowerText.includes("edison")) provider = "Southern California Edison";
    else if (lowerText.includes("pascoag"))
      provider = "Pascoag Utility District";
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

  // Extract billing period (start and end dates)
  let periodStart = date;
  let periodEnd = date;
  
  const periodPatterns = [
    // Edison format: "Apr 2 '08 to May 1'08"
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s*'?(\d{2,4})\s+to\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s*'?(\d{2,4})/i,
    // "From Apr 2, 2008 to May 1, 2008"
    /from\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s*(\d{4})\s+to\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s*(\d{4})/i,
    // "04/02/08 - 05/01/08"
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
  ];

  for (const pattern of periodPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (pattern.source.includes('jan|feb')) {
          // Month name format
          const monthMap: { [key: string]: number } = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
          };
          
          const startMonth = monthMap[match[1].toLowerCase()];
          const startDay = parseInt(match[2]);
          let startYear = parseInt(match[3]);
          if (startYear < 100) startYear += 2000; // Handle '08 -> 2008
          
          const endMonth = monthMap[match[4].toLowerCase()];
          const endDay = parseInt(match[5]);
          let endYear = parseInt(match[6]);
          if (endYear < 100) endYear += 2000;
          
          periodStart = new Date(startYear, startMonth, startDay).toISOString().split("T")[0];
          periodEnd = new Date(endYear, endMonth, endDay).toISOString().split("T")[0];
        } else {
          // Numeric date format
          const startMonth = parseInt(match[1]) - 1;
          const startDay = parseInt(match[2]);
          let startYear = parseInt(match[3]);
          if (startYear < 100) startYear += 2000;
          
          const endMonth = parseInt(match[4]) - 1;
          const endDay = parseInt(match[5]);
          let endYear = parseInt(match[6]);
          if (endYear < 100) endYear += 2000;
          
          periodStart = new Date(startYear, startMonth, startDay).toISOString().split("T")[0];
          periodEnd = new Date(endYear, endMonth, endDay).toISOString().split("T")[0];
        }
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

  console.log(`🔎 Searching for consumption (type: ${type})...`);
  
  // Pattern: number followed by unit (MOST SPECIFIC FIRST!)
  const consumptionPatterns = [
    // ELECTRICITY - Edison bill format (MUST BE FIRST - very specific)
    /total\s+electricity\s+you\s+used\s+(?:this\s+month\s+)?(?:in\s+)?(?:kwh\s+)?(\d{1,3}(?:,\d{3})*)/i,
    /total\s+(?:kwh\s+)?usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /(\d{1,3}(?:,\d{3})*)\s*kwh/i,

    // GAS - Various formats (SoCalGas, North Shore Gas, etc.)
    /gas\s+usage\s+history[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /(?:total\s+)?therms?\s+used[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /total\s+therma?s?[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /difference[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*therms?/i,
    /gas\s+service[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*therms?/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+therms?(?!\s*allowance)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*ccf/i,

    // FUEL - Gas station / fuel delivery receipts
    /gallons?[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*gal(?:lons?)?(?!\s*per)/i,
    /fuel\s+sale[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,

    // GENERIC patterns (last resort)
    /usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?:\s*(?:kwh|therms?|gal))?/i,
  ];

  // Try patterns
  for (const pattern of consumptionPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      if (num >= 1 && num < 10000000) {
        consumptionValue = num;
        console.log(`✅ Found consumption: ${consumptionValue} (raw match: "${match[0].substring(0, 50)}")`);
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
  
  if (consumptionValue === 0) {
    console.log(`⚠️ Consumption not found`);
  }

  // Extract amount (total bill cost) - improved patterns
  let amount = 0;
  const amountPatterns = [
    // Most specific first
    /total\s*(?:balance\s*)?due[^$\d]{0,20}\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /total\s*amount\s*(?:you\s*)?(?:owe|due)[^$\d]{0,20}\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount\s*(?:you\s*)?(?:owe|due)[^$\d]{0,20}\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:total\s*)?current\s*charges[^$\d]{0,20}\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:your\s*)?new\s*charges[^$\d]{0,20}\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    // Generic fallback
    /total[^$\d]{0,25}\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  console.log(`🔎 Searching for amount...`);
  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const parsedAmount = parseFloat(match[1].replace(/,/g, ""));
      if (parsedAmount > 0 && parsedAmount < 1000000) {
        amount = parsedAmount;
        console.log(`✅ Found amount: $${amount}`);
        break;
      }
    }
  }
  if (amount === 0) {
    console.log(`⚠️ Amount not found`);
  }

  // Extract account number (improved patterns)
  let accountNumber = "";
  const accountPatterns = [
    // Specific labels first
    /customer\s*account[:\s#]*(\d[\d\-\s]{6,24})/i,
    /service\s*account[:\s#]*(\d[\d\-\s]{6,24})/i,
    /account\s*number[:\s#]*(\d[\d\-\s]{6,24})/i,
    /account\s*#[:\s]*(\d[\d\-\s]{6,24})/i,
    /acct\.?\s*(?:no\.?|#)[:\s]*(\d[\d\-\s]{6,24})/i,
    // Generic patterns
    /account[:\s]+(\d[\d\-]{5,20})/i,
  ];

  console.log(`🔎 Searching for account number...`);
  for (const pattern of accountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      accountNumber = match[1].replace(/\s+/g, '').trim();
      // Validate it looks like an account number (has digits)
      if (/\d{6,}/.test(accountNumber)) {
        console.log(`✅ Found account number: ${accountNumber}`);
        break;
      }
    }
  }
  if (!accountNumber) {
    console.log(`⚠️ Account number not found`);
  }

  // Extract service address (improved patterns)
  let serviceAddress = "";
  const addressPatterns = [
    // Labeled addresses first
    /service\s+(?:address|account)[:\s]*([^\n]{15,120})/i,
    /billing\s+address[:\s]*([^\n]{15,120})/i,
    // Street addresses with numbers (more flexible)
    /(\d{3,6}\s+[A-Z][A-Z\s]{2,60}?(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|BOULEVARD|BLVD|LANE|LN|WAY|COURT|CT|PLACE|PL|CIRCLE|CIR)(?:\.|,|\s|$)[^\n]{0,40})/i,
    /(\d{3,6}\s+[A-Za-z\s]{3,60}?(?:street|st|avenue|ave|road|rd|drive|dr|blvd|lane|ln|way|court|ct)(?:\.|,|\s|$)[^\n]{0,40})/i,
  ];

  console.log(`🔎 Searching for service address...`);
  for (const pattern of addressPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      serviceAddress = match[1].trim().replace(/\s+/g, ' ');
      // Clean up - stop at ZIP code, state, or newline
      serviceAddress = serviceAddress
        .replace(/\s*\d{5}(?:-\d{4})?.*$/,'') // Remove ZIP
        .replace(/\s*,?\s*[A-Z]{2}\s+\d{5}.*$/,'') // Remove state + ZIP
        .replace(/\n.*$/,'') // Remove everything after newline
        .replace(/\s*,\s*$/,'') // Remove trailing comma
        .trim();
      // Validate it has a street number
      if (/^\d{3,6}\s/.test(serviceAddress) && serviceAddress.length >= 10) {
        console.log(`✅ Found service address: ${serviceAddress}`);
        break;
      }
    }
  }
  if (!serviceAddress) {
    console.log(`⚠️ Service address not found`);
  }

  // Extract phone number
  let phoneNumber = "";
  const phonePatterns = [
    /(?:customer\s+service|contact|phone|tel)[:\s]*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i,
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phoneNumber = match[0].replace(/[^\d]/g, '');
      // Format as (XXX) XXX-XXXX
      if (phoneNumber.length === 10) {
        phoneNumber = `(${phoneNumber.slice(0,3)}) ${phoneNumber.slice(3,6)}-${phoneNumber.slice(6)}`;
      }
      break;
    }
  }

  // Extract F-gases (industrial greenhouse gases)
  let hfcsKg = 0;
  let pfcsKg = 0;
  let sf6Kg = 0;
  let otherKg = 0;

  // HFCs - refrigerant reports (R-134a, R-410A, R-404A, etc.)
  const hfcPatterns = [
    /(?:hfc|r-134a|r-410a|r-404a|r-407c|refrigerant)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i,
    /(?:hfc|r-134a|r-410a|r-404a|r-407c|refrigerant)[^\d]*(\d+(?:\.\d+)?)\s*(?:lb|pound)/i, // will convert
  ];

  for (const pattern of hfcPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      // Convert pounds to kg if needed
      if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
        value = value * 0.453592; // lbs to kg
      }
      hfcsKg += value;
    }
  }

  // PFCs - semiconductor/aluminum production
  const pfcPatterns = [
    /(?:pfc|perfluorocarbon|cf4|c2f6)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i,
    /(?:pfc|perfluorocarbon|cf4|c2f6)[^\d]*(\d+(?:\.\d+)?)\s*(?:lb|pound)/i,
  ];

  for (const pattern of pfcPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
        value = value * 0.453592;
      }
      pfcsKg += value;
    }
  }

  // SF6 - electrical equipment
  const sf6Patterns = [
    /(?:sf6|sf-6|sulfur hexafluoride|sulphur hexafluoride)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i,
    /(?:sf6|sf-6|sulfur hexafluoride|sulphur hexafluoride)[^\d]*(\d+(?:\.\d+)?)\s*(?:lb|pound)/i,
  ];

  for (const pattern of sf6Patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
        value = value * 0.453592;
      }
      sf6Kg += value;
    }
  }

  // Other F-gases (NF3, etc.)
  const otherPatterns = [
    /(?:nf3|nitrogen trifluoride)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i,
    /(?:nf3|nitrogen trifluoride)[^\d]*(\d+(?:\.\d+)?)\s*(?:lb|pound)/i,
  ];

  for (const pattern of otherPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
        value = value * 0.453592;
      }
      otherKg += value;
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
      start: periodStart,
      end: periodEnd,
    },
    accountNumber, // Account number from bill
    serviceAddress, // Service address
    phoneNumber, // Customer service phone
    // F-gases (industrial emissions)
    hfcsKg: hfcsKg > 0 ? hfcsKg : undefined,
    pfcsKg: pfcsKg > 0 ? pfcsKg : undefined,
    sf6Kg: sf6Kg > 0 ? sf6Kg : undefined,
    otherKg: otherKg > 0 ? otherKg : undefined,
  };
  
  // Final summary log
  console.log(`📊 PARSING SUMMARY:`);
  console.log(`   Type: ${result.type}`);
  console.log(`   Provider: ${result.provider}`);
  console.log(`   State: ${result.state || 'N/A'}`);
  console.log(`   Account: ${result.accountNumber || 'NOT FOUND'}`);
  console.log(`   Address: ${result.serviceAddress || 'NOT FOUND'}`);
  console.log(`   Phone: ${result.phoneNumber || 'NOT FOUND'}`);
  console.log(`   Amount: $${result.amount || 0}`);
  console.log(`   Consumption: ${result.consumption.value} ${result.consumption.unit}`);
  console.log(`   Period: ${result.period.start} → ${result.period.end}`);
  
  return result;
}
