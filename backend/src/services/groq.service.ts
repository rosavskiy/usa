import axios from "axios";
import fs from "fs";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Try multiple vision models in order (some may be deprecated)
const GROQ_VISION_MODELS = [
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
  "llava-v1.5-7b-4096-preview",
  "llama-vision",
];

const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || GROQ_VISION_MODELS[0];

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

export async function parseUtilityBillImageWithGroq(
  filePath: string,
): Promise<any> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Read file and convert to base64
  const imageBuffer = fs.readFileSync(filePath);
  const imageBase64 = imageBuffer.toString("base64");

  // First, get list of available models
  let availableModels: string[] = [];
  try {
    const modelsRes = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 5000,
    });

    const allModels = modelsRes.data?.data || [];
    // Filter for vision models
    availableModels = allModels
      .filter((m: any) => {
        const id = m.id?.toLowerCase() || "";
        return id.includes("vision") || id.includes("llava");
      })
      .map((m: any) => m.id);

    console.log(`⚡ Available Groq vision models:`, availableModels);

    if (availableModels.length === 0) {
      throw new Error("No vision models available in Groq");
    }
  } catch (error: any) {
    console.log(`⚠️ Could not fetch models list, using defaults`);
    availableModels = GROQ_VISION_MODELS;
  }

  const payload = {
    model: "",
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

  // Try each available model
  let lastError: any;

  for (const modelName of availableModels) {
    try {
      console.log(`⚡ Trying Groq model: ${modelName}...`);
      payload.model = modelName;

      const res = await axios.post(GROQ_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 60000,
      });

      const responseText = res.data?.choices?.[0]?.message?.content || "";
      if (!responseText) {
        throw new Error("Empty response from Groq");
      }

      const cleaned = stripMarkdownJson(responseText);
      const parsed = JSON.parse(cleaned);

      console.log(`✅ Groq Vision parsed successfully with ${modelName}`);
      console.log("📊 Type:", parsed.type);
      console.log("💰 Amount:", parsed.amount);
      console.log(
        "⚡ Consumption:",
        parsed.consumption?.value,
        parsed.consumption?.unit,
      );

      return parsed;
    } catch (error: any) {
      lastError = error;
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        String(error);

      // If model is decommissioned, try next one
      if (
        message.includes("decommissioned") ||
        message.includes("not found") ||
        message.includes("does not exist")
      ) {
        console.log(`⚠️ Model ${modelName} not available, trying next...`);
        continue;
      }

      // For other errors, throw immediately
      console.error("❌ Groq Vision failed:", message);
      throw new Error(`Groq Vision failed: ${message}`);
    }
  }

  // All models failed
  const message =
    lastError?.response?.data?.error?.message ||
    lastError?.message ||
    String(lastError);
  console.error("❌ All Groq models failed");
  throw new Error(`Groq Vision failed: ${message}`);
}

export async function checkGroqHealth(): Promise<boolean> {
  if (!GROQ_API_KEY) {
    console.log("⚠️ GROQ_API_KEY not configured");
    return false;
  }

  try {
    const res = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 5000,
    });

    const models = res.data?.data || [];
    const hasVisionModel = models.some((m: any) => m.id === GROQ_VISION_MODEL);

    console.log("⚡ Groq API online");
    console.log("⚡ Model:", GROQ_VISION_MODEL, hasVisionModel ? "✅" : "⚠️");
    console.log("⚡ Free limit: 14,400 requests/day");
    return true;
  } catch (error: any) {
    console.log("⚠️ Groq API check failed:", error?.message || String(error));
    return false;
  }
}
