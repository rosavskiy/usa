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

    // STRATEGY: Use OCR.space + regex parsing (AI vision disabled)
    let parsedData;

    // AI Vision parsing disabled - using OCR + regex
    console.log(`📝 AI vision disabled, using OCR.space + regex parsing`);

    // Extract text using OCR (OCR.space)
    const ocrText = await extractTextFromImage(filePath);
    console.log(`✨ OCR extracted text (${ocrText.length} chars):`);
    console.log(ocrText);

    // Parse the text using regex
    console.log(`🔍 Parsing extracted text with regex...`);
    parsedData = parseUtilityBillText(ocrText);
    console.log(`🎯 Regex parsed data:`, parsedData);

    // Skip watermark and consumption validation - allow parsing
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

function parseUtilityBillText(text: string): any {
  console.log(`🔍 Parsing extracted text...`);

  // Normalize text for better regex matching
  const normalizedText = text
    .replace(/\r\n/g, "\n") // Normalize line breaks
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .replace(/\n\s+/g, "\n") // Remove leading spaces after newlines
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
  // PRIORITY: Service Address > Provider Address > Payment Address
  let state = "";

  // Step 1: Try to find "Service Address" section with state
  const serviceAddressMatch = text.match(
    /service\s+address:?[\s\S]{0,200}?(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+\d{5}/i
  );
  if (serviceAddressMatch) {
    state = serviceAddressMatch[1].toUpperCase();
    console.log(`🏠 Found state from Service Address: ${state}`);
  }

  // Step 2: If not found, try ZIP code to state mapping
  if (!state) {
    const zipMatch = text.match(
      /service\s+address:?[\s\S]{0,200}?(\d{5})(?:-\d{4})?/i
    );
    if (zipMatch) {
      const zip = zipMatch[1];
      const zipToState: { [key: string]: string } = {
        // Michigan ZIP codes
        "49": "MI",
        "48": "MI",
        // California ZIP codes
        "90": "CA",
        "91": "CA",
        "92": "CA",
        "93": "CA",
        "94": "CA",
        "95": "CA",
        "96": "CA",
        // Texas ZIP codes
        "75": "TX",
        "76": "TX",
        "77": "TX",
        "78": "TX",
        "79": "TX",
        // New York ZIP codes
        "10": "NY",
        "11": "NY",
        "12": "NY",
        "13": "NY",
        "14": "NY",
        // Florida ZIP codes
        "32": "FL",
        "33": "FL",
        "34": "FL",
        // Illinois ZIP codes
        "60": "IL",
        "61": "IL",
        "62": "IL",
        // Pennsylvania ZIP codes
        "15": "PA",
        "16": "PA",
        "17": "PA",
        "18": "PA",
        "19": "PA",
        // Ohio ZIP codes
        "43": "OH",
        "44": "OH",
        "45": "OH",
        // Iowa ZIP codes
        "50": "IA",
        "51": "IA",
        "52": "IA",
      };
      const zipPrefix = zip.substring(0, 2);
      if (zipToState[zipPrefix]) {
        state = zipToState[zipPrefix];
        console.log(`📮 Found state from ZIP code ${zip}: ${state}`);
      }
    }
  }

  // Step 3: General patterns (fallback)
  if (!state) {
    const statePatterns = [
      // State + ZIP code (with optional +4) - MOST RELIABLE
      /(?:,\s*|\s+)(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+\d{5}(?:-\d{4})?\b/i,
      // City, State (comma separated)
      /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i,
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
        console.log(`🗺️  Found state from general pattern: ${state}`);
        break;
      }
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
    // SoCalGas format: "05/12/20 - 06/14/20" (MUST BE FIRST!)
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    // Edison format: "Apr 2 '08 to May 1'08"
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s*'?(\d{2,4})\s+to\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s*'?(\d{2,4})/i,
    // "From Apr 2, 2008 to May 1, 2008"
    /from\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s*(\d{4})\s+to\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s*(\d{4})/i,
  ];

  for (const pattern of periodPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Check if it's a numeric date format (MM/DD/YY)
        if (match[1].match(/^\d+$/)) {
          // Numeric date format: MM/DD/YY - MM/DD/YY
          const startMonth = parseInt(match[1]) - 1;
          const startDay = parseInt(match[2]);
          let startYear = parseInt(match[3]);
          if (startYear < 100) startYear += 2000;

          const endMonth = parseInt(match[4]) - 1;
          const endDay = parseInt(match[5]);
          let endYear = parseInt(match[6]);
          if (endYear < 100) endYear += 2000;

          periodStart = new Date(startYear, startMonth, startDay)
            .toISOString()
            .split("T")[0];
          periodEnd = new Date(endYear, endMonth, endDay)
            .toISOString()
            .split("T")[0];
        } else {
          // Month name format
          const monthMap: { [key: string]: number } = {
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            may: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            oct: 9,
            nov: 10,
            dec: 11,
          };

          const startMonth = monthMap[match[1].toLowerCase()];
          const startDay = parseInt(match[2]);
          let startYear = parseInt(match[3]);
          if (startYear < 100) startYear += 2000; // Handle '08 -> 2008

          const endMonth = monthMap[match[4].toLowerCase()];
          const endDay = parseInt(match[5]);
          let endYear = parseInt(match[6]);
          if (endYear < 100) endYear += 2000;

          periodStart = new Date(startYear, startMonth, startDay)
            .toISOString()
            .split("T")[0];
          periodEnd = new Date(endYear, endMonth, endDay)
            .toISOString()
            .split("T")[0];
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

  // Step 1: Find ALL numbers near "kWh", "therms", "gallons" keywords (global search)
  const allMatches: Array<{
    value: number;
    match: string;
    unit: string;
    context: string;
  }> = [];

  // Search for kWh/therms/gallons and extract nearby numbers
  if (type === "electricity") {
    // Strategy: Find "kWh" and look for numbers within reasonable distance
    // Multiple patterns for different OCR scenarios

    // ★★★ PATTERN 0: "kWh" followed by number on same/next line (HIGHEST PRIORITY!)
    // Catches OCR pattern: "kWh\n626" or "kWh 626"
    const kwhLineRegex = /kwh\s*[\n\r\s]*(\d{2,5})/gi;
    let match;
    while ((match = kwhLineRegex.exec(normalizedText)) !== null) {
      const num = parseFloat(match[1]);
      if (num >= 32 && num < 100000) {
        allMatches.push({
          value: num,
          match: match[0],
          unit: "kWh",
          context:
            normalizedText.substring(
              Math.max(0, match.index - 80),
              match.index + 100
            ) + " [DIRECT AFTER kWh]",
        });
      }
    }

    // Pattern 1: Number immediately before kWh (strict format: "626 kWh" or "1,041 kWh")
    const directKwhRegex = /(\d{1,5}(?:[,\s]\d{3})*)\s*kwh/gi;
    let match1;
    while ((match1 = directKwhRegex.exec(normalizedText)) !== null) {
      const numStr = match1[1].replace(/[,\s]/g, "");
      const num = parseFloat(numStr);
      if (num >= 1 && num < 100000) {
        allMatches.push({
          value: num,
          match: match1[0],
          unit: "kWh",
          context: normalizedText.substring(
            Math.max(0, match1.index - 50),
            match1.index + 100
          ),
        });
      }
    }

    // Pattern 2: Any number near "kWh" (flexible, catches OCR errors)
    const flexibleKwhRegex = /(\d+)\s*kwh/gi;
    let match2;
    while ((match2 = flexibleKwhRegex.exec(normalizedText)) !== null) {
      const num = parseFloat(match2[1]);
      // Filter out days (< 32) - typical billing period is 28-31 days
      if (num >= 32 && num < 100000) {
        // Check if not already added
        if (!allMatches.some((m) => Math.abs(m.value - num) < 0.01)) {
          allMatches.push({
            value: num,
            match: match2[0],
            unit: "kWh",
            context: normalizedText.substring(
              Math.max(0, match2.index - 50),
              match2.index + 100
            ),
          });
        }
      }
    }

    // Pattern 3: "kWh" in header, then look for numbers in nearby lines
    // "Your Usage Information (kWh)" followed by numbers
    const headerKwhRegex =
      /usage\s+information\s*\(kwh\)[\s\S]{0,200}?(\d{2,5})/gi;
    let match3;
    while ((match3 = headerKwhRegex.exec(normalizedText)) !== null) {
      const num = parseFloat(match3[1]);
      // Filter out days - typical consumption is > 31
      if (num >= 32 && num < 100000) {
        if (!allMatches.some((m) => Math.abs(m.value - num) < 0.01)) {
          allMatches.push({
            value: num,
            match: match3[0].substring(0, 80),
            unit: "kWh",
            context: match3[0],
          });
        }
      }
    }

    // Pattern 4: Table format - "Comparison" section
    // Looking for "Current Bill Period" row vs "Same Period Last Year" row
    // Format: "Current Bill Period    Days: 30    kWh: 626    Avg: 20.87"
    // We need the SECOND number (kWh), not the first (days)
    const currentPeriodRegex =
      /current\s+bill\s+period[^\d]*(\d{1,2})[^\d]+(\d{2,5})[^\d]+(\d+\.?\d*)/gi;
    let match4;
    while ((match4 = currentPeriodRegex.exec(normalizedText)) !== null) {
      const days = parseFloat(match4[1]);
      const kwh = parseFloat(match4[2]);
      const avg = parseFloat(match4[3]);

      // Validate: days < 32, kWh > 31, avg is usually between 1-100
      if (days < 32 && kwh > 31 && kwh < 100000 && avg < 200) {
        if (!allMatches.some((m) => Math.abs(m.value - kwh) < 0.01)) {
          allMatches.push({
            value: kwh,
            match: match4[0],
            unit: "kWh",
            context: match4[0] + " [CURRENT PERIOD]",
          });
        }
      }
    }

    // Pattern 5: "Same Period Last Year" - mark as past
    const lastYearRegex =
      /same\s+period\s+last\s+year[^\d]*(\d{1,2})[^\d]+(\d{2,5})[^\d]+(\d+\.?\d*)/gi;
    let match5;
    while ((match5 = lastYearRegex.exec(normalizedText)) !== null) {
      const days = parseFloat(match5[1]);
      const kwh = parseFloat(match5[2]);
      const avg = parseFloat(match5[3]);

      // Validate same as above
      if (days < 32 && kwh > 1 && kwh < 100000 && avg < 200) {
        if (!allMatches.some((m) => Math.abs(m.value - kwh) < 0.01)) {
          allMatches.push({
            value: kwh,
            match: match5[0],
            unit: "kWh",
            context: match5[0] + " [PAST PERIOD]",
          });
        }
      }
    }
  }

  if (type === "gas") {
    // Find "therms" or "ccf" with nearby numbers (no space concatenation)
    const thermRegex = /(\d{1,5}(?:[,]\d{3})*)\s*(?:therms?|ccf)/gi;
    let matchGas;
    while ((matchGas = thermRegex.exec(normalizedText)) !== null) {
      const numStr = matchGas[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      if (num >= 1 && num < 10000) {
        const unitType = matchGas[0].toLowerCase().includes("therm")
          ? "therms"
          : "CCF";
        allMatches.push({
          value: num,
          match: matchGas[0],
          unit: unitType,
          context: normalizedText.substring(
            Math.max(0, matchGas.index - 50),
            matchGas.index + 80
          ),
        });
      }
    }
  }

  if (type === "fuel") {
    // Find "gallons" with nearby numbers (no space concatenation)
    const gallonRegex =
      /(\d{1,5}(?:[,]\d{3})*(?:\.\d+)?)\s*(?:gal(?:lons?)?)/gi;
    let matchFuel;
    while ((matchFuel = gallonRegex.exec(normalizedText)) !== null) {
      const numStr = matchFuel[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      if (num >= 1 && num < 10000) {
        allMatches.push({
          value: num,
          match: matchFuel[0],
          unit: "gallons",
          context: normalizedText.substring(
            Math.max(0, matchFuel.index - 50),
            matchFuel.index + 80
          ),
        });
      }
    }
  }

  console.log(`🔍 Found ${allMatches.length} potential consumption values`);
  if (allMatches.length > 0) {
    allMatches.forEach((m, i) => {
      const digits = Math.floor(Math.log10(m.value)) + 1;
      console.log(`   ${i + 1}. ${m.value} ${m.unit} (${digits} digits)`);
      console.log(`      Context: "${m.context.substring(0, 100)}"`);
    });
  }

  // AI-like reasoning: Smart prioritization based on multiple factors
  if (allMatches.length > 0) {
    // CRITICAL: Remove numbers that are clearly days (< 32)
    const filteredMatches = allMatches.filter((m) => {
      if (m.value < 32) {
        console.log(
          `⚠️  Filtered out ${m.value} kWh - likely days, not consumption`
        );
        return false;
      }
      return true;
    });

    if (filteredMatches.length === 0) {
      console.log(
        `❌ All matches were < 32 (days). No valid consumption found.`
      );
      console.log(`⚠️ Consumption not found`);
      return;
    }

    // Score each match based on context, value reasonableness, and patterns
    const scoredMatches = filteredMatches.map((m) => {
      let score = 0;
      const lowerContext = m.context.toLowerCase();

      // ★★★ HIGHEST PRIORITY: Current period vs Past period ★★★
      // +1000: DIRECT AFTER kWh marker (число сразу после "kWh" - это 100% потребление!)
      if (lowerContext.includes("[direct after kwh]")) {
        score += 1000;
      }

      // +500: CURRENT PERIOD marker (МАКСИМАЛЬНЫЙ приоритет!)
      if (lowerContext.includes("[current period]")) {
        score += 500;
      }

      // +300: Explicitly labeled as current/usage
      if (
        lowerContext.includes("current bill period") ||
        lowerContext.includes("current charges")
      ) {
        score += 300;
      }

      // +100: General usage indicators
      if (
        lowerContext.includes("usage") ||
        (lowerContext.includes("total") && lowerContext.includes("kwh"))
      ) {
        score += 100;
      }

      // +50: Reasonable residential/small business range (100-5000 kWh/month)
      if (m.value >= 100 && m.value <= 5000) {
        score += 50;
      } else if (m.value >= 50 && m.value <= 99) {
        score += 30; // Could be short billing period (few days)
      } else if (m.value >= 32 && m.value < 50) {
        score += 10; // Very short period or low usage
      } else if (m.value > 5000 && m.value < 20000) {
        score += 20; // Large business
      }

      // +30: More digits = more likely to be consumption (not days/avg)
      const digits = Math.floor(Math.log10(m.value)) + 1;
      if (digits >= 3) score += 30;

      // ★★★ LOWEST PRIORITY: Past period data ★★★
      // -500: PAST PERIOD marker (МАКСИМАЛЬНЫЙ штраф! Никогда не выбираем прошлый год)
      if (lowerContext.includes("[past period]")) {
        score -= 500;
      }

      // -300: Last year context (НЕ ХОТИМ прошлый год!)
      if (
        lowerContext.includes("last year") ||
        lowerContext.includes("same period last") ||
        lowerContext.includes("previous year")
      ) {
        score -= 300;
      }

      // -50: Suspiciously high (likely OCR error or wrong value)
      if (m.value > 50000) score -= 50;

      // -20: General "previous" context
      if (
        lowerContext.includes("previous") &&
        !lowerContext.includes("current")
      ) {
        score -= 20;
      }

      return { ...m, score };
    });

    // Sort by score (highest first)
    scoredMatches.sort((a, b) => b.score - a.score);

    console.log(
      `🧠 AI Reasoning - Scored matches (CURRENT PERIOD = приоритет!):`
    );
    scoredMatches.forEach((m, i) => {
      const isPast = m.context.toLowerCase().includes("[past period]");
      const isCurrent = m.context.toLowerCase().includes("[current period]");
      const marker = isCurrent ? "✓ ТЕКУЩИЙ" : isPast ? "✗ ПРОШЛЫЙ ГОД" : "";
      console.log(
        `   ${i + 1}. ${m.value} ${m.unit} [score: ${m.score}] ${marker}`
      );
    });

    const best = scoredMatches[0];
    consumptionValue = best.value;
    unit = best.unit;

    const digitCount = Math.floor(Math.log10(consumptionValue)) + 1;
    console.log(
      `✅ Selected consumption: ${consumptionValue} ${unit} (${digitCount} digits, score: ${best.score})`
    );

    if (scoredMatches.length > 1) {
      const hasPastAndCurrent =
        scoredMatches.some((m) =>
          m.context.toLowerCase().includes("[current period]")
        ) &&
        scoredMatches.some((m) =>
          m.context.toLowerCase().includes("[past period]")
        );
      if (hasPastAndCurrent) {
        console.log(
          `ℹ️  Detected both CURRENT and PAST periods → Auto-selected CURRENT period`
        );
      } else {
        console.log(
          `ℹ️  Total matches: ${scoredMatches.length}, selected highest-scored`
        );
      }
    }
  } else {
    console.log(`⚠️ Consumption not found`);
  }

  // Extract amount (total bill cost) - improved patterns
  let amount = 0;
  const amountPatterns = [
    // Most specific first - exact phrases
    /total\s+amount\s+you\s+owe[^$\d]{0,30}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    /total\s+amount\s+due[^$\d]{0,20}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    /amount\s+due[^$\d]{0,10}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    /total\s+current\s+charges[^$\d]{0,20}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    /total\s+(?:balance\s*)?due[^$\d]{0,20}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    /(?:your\s*)?new\s*charges[^$\d]{0,20}\$\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
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
      accountNumber = match[1].replace(/\s+/g, "").trim();
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
    // Street addresses with explicit street types (MOST SPECIFIC)
    /(\d{3,6})\s+([A-Z]+(?:\s+[A-Z]+)?)\s+(STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|BOULEVARD|BLVD|LANE|LN|WAY|COURT|CT|PLACE|PL|PORTABLE|SAMPLE|ANYWHERE)\b/i,
    /(\d{3,6})\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|portable|sample|anywhere)\b/i,
    // Labeled service address
    /service\s+account[^\d]+(\d{3,6}\s+[A-Z\s]{3,50})/i,
  ];

  console.log(`🔎 Searching for service address...`);
  for (const pattern of addressPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      serviceAddress = match[1].trim().replace(/\s+/g, " ");
      // Clean up - stop at ZIP code, state, or newline
      serviceAddress = serviceAddress
        .replace(/\s*\d{5}(?:-\d{4})?.*$/, "") // Remove ZIP
        .replace(/\s*,?\s*[A-Z]{2}\s+\d{5}.*$/, "") // Remove state + ZIP
        .replace(/\n.*$/, "") // Remove everything after newline
        .replace(/\s*,\s*$/, "") // Remove trailing comma
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
    // 1-800 numbers (most common for customer service)
    /1-800-\d{3}-\d{4}/i,
    /1-\d{3}-\d{3}-\d{4}/i,
    // With context labels
    /(?:customer\s+service|contact|phone|for\s+billing)[^\d]*(\d{3}[-.\s]\d{3}[-.\s]\d{4})/i,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phoneNumber = match[0].replace(/[^\d]/g, "");
      // Format as (XXX) XXX-XXXX
      if (phoneNumber.length === 10) {
        phoneNumber = `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
          3,
          6
        )}-${phoneNumber.slice(6)}`;
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
      if (
        match[0].toLowerCase().includes("lb") ||
        match[0].toLowerCase().includes("pound")
      ) {
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
      if (
        match[0].toLowerCase().includes("lb") ||
        match[0].toLowerCase().includes("pound")
      ) {
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
      if (
        match[0].toLowerCase().includes("lb") ||
        match[0].toLowerCase().includes("pound")
      ) {
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
      if (
        match[0].toLowerCase().includes("lb") ||
        match[0].toLowerCase().includes("pound")
      ) {
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
  console.log(`   Type: ${type}`);
  console.log(`   Provider: ${provider}`);
  console.log(`   State: ${state || "N/A"}`);
  console.log(`   Account: ${accountNumber || "NOT FOUND"}`);
  console.log(`   Address: ${serviceAddress || "NOT FOUND"}`);
  console.log(`   Phone: ${phoneNumber || "NOT FOUND"}`);
  console.log(`   Amount: $${amount || 0}`);
  console.log(`   Consumption: ${consumptionValue} ${unit}`);
  console.log(`   Period: ${periodStart} → ${periodEnd}`);

  return {
    type,
    provider,
    state,
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
    accountNumber,
    serviceAddress,
    phoneNumber,
    hfcsKg: hfcsKg > 0 ? hfcsKg : undefined,
    pfcsKg: pfcsKg > 0 ? pfcsKg : undefined,
    sf6Kg: sf6Kg > 0 ? sf6Kg : undefined,
    otherKg: otherKg > 0 ? otherKg : undefined,
  };
}
