import axios from "axios";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_VISION_MODEL =
  process.env.TOGETHER_VISION_MODEL ||
  "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo";

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

const VISION_MODELS = [
  "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
  "meta-llama/Llama-Vision-Free",
  "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
];

export async function parseUtilityBillImageWithTogether(
  imageBase64: string
): Promise<any> {
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY not configured");
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

  let lastError: any;

  for (const modelName of VISION_MODELS) {
    try {
      console.log(`🔮 Trying Together.ai model: ${modelName}...`);
      payload.model = modelName;

      const res = await axios.post(TOGETHER_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
        },
        timeout: 60000,
      });

      const responseText = res.data?.choices?.[0]?.message?.content || "";
      if (!responseText) {
        throw new Error("Empty response from Together");
      }

      const cleaned = stripMarkdownJson(responseText);
      const parsed = JSON.parse(cleaned);

      console.log(
        `✅ Together.ai Vision parsed successfully with ${modelName}`
      );
      console.log("📊 Type:", parsed.type);
      console.log("💰 Amount:", parsed.amount);
      console.log(
        "⚡ Consumption:",
        parsed.consumption?.value,
        parsed.consumption?.unit
      );

      return parsed;
    } catch (error: any) {
      lastError = error;
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        String(error);

      if (message.includes("not found") || message.includes("does not exist")) {
        console.log(`⚠️ Model ${modelName} not available, trying next...`);
        continue;
      }

      console.error("❌ Together.ai Vision failed:", message);
      throw new Error(`Together.ai Vision failed: ${message}`);
    }
  }

  const message =
    lastError?.response?.data?.error?.message ||
    lastError?.message ||
    String(lastError);
  console.error("❌ All Together.ai models failed");
  throw new Error(`Together.ai Vision failed: ${message}`);
}

export async function checkTogetherHealth(): Promise<boolean> {
  if (!TOGETHER_API_KEY) {
    console.log("⚠️ TOGETHER_API_KEY not configured");
    return false;
  }

  try {
    const res = await axios.get("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      timeout: 5000,
    });

    const models = res.data || [];
    const visionModels = models.filter(
      (m: any) =>
        m.id?.toLowerCase().includes("vision") ||
        m.id?.toLowerCase().includes("llava")
    );

    console.log("🔮 Together.ai API online");
    console.log(`🔮 Found ${visionModels.length} vision models`);
    console.log("🔮 $25 free credit for new accounts");
    return true;
  } catch (error: any) {
    console.log(
      "⚠️ Together.ai API check failed:",
      error?.message || String(error)
    );
    return false;
  }
}
