import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_MODEL_ORDER = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

function getModelOrder(): string[] {
  const envOrder = process.env.GEMINI_MODEL_ORDER;
  if (!envOrder) return DEFAULT_MODEL_ORDER;
  const parsed = envOrder
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_MODEL_ORDER;
}

function isRateLimitError(error: any): boolean {
  const msg = String(error?.message || error);
  return msg.includes("429") || msg.toLowerCase().includes("quota exceeded");
}

function isModelNotFoundError(error: any): boolean {
  const msg = String(error?.message || error).toLowerCase();
  return msg.includes("404") || msg.includes("not found");
}

function parseRetryDelayMs(error: any): number | null {
  const msg = String(error?.message || error);
  const match = msg.match(/retryDelay"\s*:\s*"(\d+)s"/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModelFallback(
  input:
    | string
    | Array<string | { inlineData: { data: string; mimeType: string } }>
): Promise<string> {
  const modelOrder = getModelOrder();
  let lastError: any;

  for (const modelName of modelOrder) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(input as any);
      console.log(`✅ Using model: ${modelName}`);
      return result.response.text();
    } catch (error: any) {
      lastError = error;

      if (isRateLimitError(error)) {
        const delayMs = parseRetryDelayMs(error) ?? 25000;
        console.log(
          `⏳ Gemini rate limit hit. Retrying in ${Math.ceil(
            delayMs / 1000
          )}s...`
        );
        await sleep(delayMs);
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(input as any);
          console.log(`✅ Using model: ${modelName}`);
          return result.response.text();
        } catch (retryError: any) {
          throw new Error("GEMINI_RATE_LIMIT");
        }
      }

      if (isModelNotFoundError(error)) {
        console.log(`⚠️ Model not found: ${modelName}`);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Gemini AI failed");
}

/**
 * Parse utility bill text using Google Gemini AI
 *
 * @param text - Raw OCR extracted text from utility bill
 * @returns Parsed bill data with all fields extracted
 */
export async function parseUtilityBillWithGemini(text: string): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("🤖 Parsing with Gemini AI...");

  // Detailed prompt for utility bill parsing
  const prompt = `You are a utility bill parser. Extract the following information from this utility bill text and return ONLY valid JSON (no markdown, no explanations).

IMPORTANT RULES:
1. For consumption: Find the ACTUAL usage amount, NOT "Baseline Allowance" or "Page numbers"
2. For amount: Find "Total Amount Due" or "Total Current Charges" - the final bill amount
3. For period: Extract billing period start and end dates in YYYY-MM-DD format
4. For address: Extract the SERVICE address (where utility is delivered), not billing address
5. If a field is not found, use null

Required JSON structure:
{
  "type": "gas" | "electricity" | "fuel",
  "provider": "string (company name)",
  "state": "string (2-letter state code like CA, NY)",
  "accountNumber": "string",
  "serviceAddress": "string (street address)",
  "phoneNumber": "string (customer service phone)",
  "amount": number (total bill amount in dollars),
  "consumption": {
    "value": number (actual usage, NOT baseline or allowance),
    "unit": "therms" | "kWh" | "gallons" | "ccf"
  },
  "period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "hfcsKg": number | null,
  "pfcsKg": number | null,
  "sf6Kg": number | null,
  "otherKg": number | null
}

Utility bill text:
${text}

Return ONLY the JSON object, nothing else.`;

  try {
    let responseText = await generateWithModelFallback(prompt);

    console.log(
      "📄 Gemini raw response:",
      responseText.substring(0, 200) + "..."
    );

    // Remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Parse JSON response
    const parsedData = JSON.parse(responseText);

    console.log("✅ Gemini parsed successfully");
    console.log("📊 Type:", parsedData.type);
    console.log("💰 Amount:", parsedData.amount);
    console.log(
      "⚡ Consumption:",
      parsedData.consumption?.value,
      parsedData.consumption?.unit
    );

    return parsedData;
  } catch (error: any) {
    if (error?.message === "GEMINI_RATE_LIMIT") {
      console.error("❌ Gemini parsing failed: rate limit exceeded");
      throw new Error("Gemini rate limit exceeded");
    }
    console.error("❌ Gemini parsing failed:", error.message);
    throw new Error(`Gemini AI parsing failed: ${error.message}`);
  }
}

/**
 * Parse utility bill image directly using Gemini Vision
 * (Alternative to OCR + text parsing)
 *
 * @param imageBase64 - Base64 encoded image
 * @returns Parsed bill data
 */
export async function parseUtilityBillImageWithGemini(
  imageBase64: string
): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("📸 Parsing image with Gemini Vision...");

  const prompt = `Analyze this utility bill image and extract information. Return ONLY valid JSON.

CRITICAL RULES:
1. consumption.value = ACTUAL USAGE (not "Baseline Allowance", not page numbers)
2. amount = Total Amount Due (the final bill total)
3. period = billing period dates in YYYY-MM-DD format
4. serviceAddress = where utility is delivered

JSON structure:
{
  "type": "gas" | "electricity" | "fuel",
  "provider": "string",
  "state": "string (2-letter)",
  "accountNumber": "string",
  "serviceAddress": "string",
  "phoneNumber": "string",
  "amount": number,
  "consumption": {
    "value": number (ACTUAL usage only),
    "unit": "therms" | "kWh" | "gallons"
  },
  "period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "hfcsKg": null,
  "pfcsKg": null,
  "sf6Kg": null,
  "otherKg": null
}

Return ONLY JSON.`;

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    let responseText = await generateWithModelFallback([prompt, imagePart]);

    // Remove markdown
    responseText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsedData = JSON.parse(responseText);

    console.log("✅ Gemini Vision parsed successfully");
    return parsedData;
  } catch (error: any) {
    if (error?.message === "GEMINI_RATE_LIMIT") {
      console.error("❌ Gemini Vision failed: rate limit exceeded");
      throw new Error("Gemini rate limit exceeded");
    }
    console.error("❌ Gemini Vision failed:", error.message);
    throw new Error(`Gemini Vision failed: ${error.message}`);
  }
}
