import axios from "axios";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_VISION_MODEL =
  process.env.MISTRAL_VISION_MODEL || "pixtral-12b-2409";

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

export async function parseUtilityBillImageWithMistral(
  imageBase64: string
): Promise<any> {
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY not configured");
  }

  const payload = {
    model: MISTRAL_VISION_MODEL,
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
            image_url: `data:image/jpeg;base64,${imageBase64}`,
          },
        ],
      },
    ],
    temperature: 0.0,
    max_tokens: 2048,
  };

  try {
    console.log(`🔮 Calling Mistral Vision API (${MISTRAL_VISION_MODEL})...`);

    const res = await axios.post(MISTRAL_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      timeout: 60000,
    });

    const responseText = res.data?.choices?.[0]?.message?.content || "";
    if (!responseText) {
      throw new Error("Empty response from Mistral");
    }

    const cleaned = stripMarkdownJson(responseText);
    const parsed = JSON.parse(cleaned);

    console.log("✅ Mistral Vision parsed successfully");
    console.log("📊 Type:", parsed.type);
    console.log("💰 Amount:", parsed.amount);
    console.log(
      "⚡ Consumption:",
      parsed.consumption?.value,
      parsed.consumption?.unit
    );

    return parsed;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || String(error);
    console.error("❌ Mistral Vision failed:", message);
    throw new Error(`Mistral Vision failed: ${message}`);
  }
}

export async function checkMistralHealth(): Promise<boolean> {
  if (!MISTRAL_API_KEY) {
    console.log("⚠️ MISTRAL_API_KEY not configured");
    return false;
  }

  try {
    const res = await axios.get("https://api.mistral.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      timeout: 5000,
    });

    const models = res.data?.data || [];
    const hasVisionModel = models.some(
      (m: any) => m.id === MISTRAL_VISION_MODEL
    );

    console.log("🔮 Mistral API online");
    console.log(
      "🔮 Model:",
      MISTRAL_VISION_MODEL,
      hasVisionModel ? "✅" : "⚠️"
    );
    return true;
  } catch (error: any) {
    console.log(
      "⚠️ Mistral API check failed:",
      error?.message || String(error)
    );
    return false;
  }
}
