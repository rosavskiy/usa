import axios from "axios";
import fs from "fs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const OPENAI_ENABLED = process.env.OPENAI_ENABLED !== "false";

function stripMarkdownJson(text: string) {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function buildVisionPrompt() {
  return `You are an expert utility bill parser. Extract the required fields and return ONLY valid JSON (no markdown, no extra text).

CRITICAL RULES:
1) consumption.value = ACTUAL usage (NOT baseline/allowance, not page numbers, not meter multipliers)
2) amount = Total Amount Due / Total Current Charges
3) period = billing period start and end dates in YYYY-MM-DD format
4) serviceAddress = where utility is delivered (not mailing/billing address)
5) If unknown, use null

JSON schema:
{
  "type": "gas" | "electricity" | "fuel",
  "provider": string,
  "state": string (2-letter US state code),
  "accountNumber": string,
  "serviceAddress": string,
  "phoneNumber": string,
  "amount": number,
  "consumption": {
    "value": number,
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

Return ONLY JSON.`;
}

export async function parseUtilityBillImageWithOpenAI(
  filePath: string,
): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Read file and convert to base64
  const imageBuffer = fs.readFileSync(filePath);
  const imageBase64 = imageBuffer.toString("base64");

  const payload = {
    model: OPENAI_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildVisionPrompt(),
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.0,
    max_tokens: 2048,
  };

  try {
    console.log(`🤖 Calling OpenAI Vision API (${OPENAI_VISION_MODEL})...`);

    const res = await axios.post(OPENAI_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      timeout: 60000,
    });

    const responseText = res.data?.choices?.[0]?.message?.content || "";
    if (!responseText) {
      throw new Error("Empty response from OpenAI");
    }

    const cleaned = stripMarkdownJson(responseText);
    const parsed = JSON.parse(cleaned);

    console.log(`✅ OpenAI Vision parsed successfully`);
    console.log("📊 Type:", parsed.type);
    console.log("💰 Amount:", parsed.amount);
    console.log(
      "⚡ Consumption:",
      parsed.consumption?.value,
      parsed.consumption?.unit,
    );

    return parsed;
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message || error?.message || String(error);
    console.error("❌ OpenAI Vision failed:", message);
    throw new Error(`OpenAI Vision failed: ${message}`);
  }
}

export async function checkOpenAIHealth(): Promise<boolean> {
  if (!OPENAI_ENABLED) {
    console.log("⚠️ OpenAI disabled (OPENAI_ENABLED=false)");
    return false;
  }

  if (!OPENAI_API_KEY) {
    console.log("⚠️ OPENAI_API_KEY not configured");
    return false;
  }

  try {
    const res = await axios.get("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      timeout: 5000,
    });

    const models = res.data?.data || [];
    const hasVisionModel = models.some(
      (m: any) => m.id === OPENAI_VISION_MODEL,
    );

    console.log("🤖 OpenAI API online");
    console.log("🤖 Model:", OPENAI_VISION_MODEL, hasVisionModel ? "✅" : "⚠️");
    console.log("💰 Cost: ~$0.38 per 1000 requests");
    return true;
  } catch (error: any) {
    console.log("⚠️ OpenAI API check failed:", error?.message || String(error));
    return false;
  }
}
