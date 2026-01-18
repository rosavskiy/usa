import axios from "axios";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava:latest";

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
  "state": string (2-letter),
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

export async function parseUtilityBillImageWithOllama(
  imageBase64: string
): Promise<any> {
  if (!OLLAMA_VISION_MODEL) {
    throw new Error("OLLAMA_VISION_MODEL not configured");
  }

  const payload = {
    model: OLLAMA_VISION_MODEL,
    prompt: buildVisionPrompt(),
    images: [imageBase64],
    stream: false,
  };

  try {
    const res = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, payload, {
      timeout: 120000,
    });

    const responseText = stripMarkdownJson(res.data?.response || "");
    if (!responseText) {
      throw new Error("Empty response from Ollama");
    }

    const parsed = JSON.parse(responseText);
    console.log("✅ Ollama Vision parsed successfully");
    return parsed;
  } catch (error: any) {
    const message =
      error?.response?.data?.error || error?.message || String(error);
    console.error("❌ Ollama Vision failed:", message);
    throw new Error(`Ollama Vision failed: ${message}`);
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 3000,
    });
    const models = res.data?.models?.map((m: any) => m.name) || [];
    const hasModel = models.includes(OLLAMA_VISION_MODEL);
    console.log("🧠 Ollama online:", OLLAMA_BASE_URL);
    console.log(
      "🧠 Ollama model:",
      OLLAMA_VISION_MODEL,
      hasModel ? "✅" : "⚠️ not pulled"
    );
    return true;
  } catch (error: any) {
    const message =
      error?.response?.data?.error || error?.message || String(error);
    console.log("⚠️ Ollama not reachable:", message);
    return false;
  }
}
