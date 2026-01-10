import { CarbonModel } from "../models/carbon.model";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Recommendation {
  title: string;
  description: string;
  potentialReduction: string; // with CO2 kg and $ savings
  category: string;
  priority: "high" | "medium" | "low";
}

export async function generateRecommendations(
  userId: number
): Promise<Recommendation[]> {
  const calculations = await CarbonModel.findByUserId(userId);

  if (calculations.length === 0) {
    return getDefaultRecommendations();
  }

  // Analyze by category
  const categoryTotals = calculations.reduce((acc, calc) => {
    acc[calc.category] = (acc[calc.category] || 0) + calc.total_co2e_kg;
    return acc;
  }, {} as Record<string, number>);

  const totalEmissions = Object.values(categoryTotals).reduce(
    (sum, val) => sum + val,
    0
  );

  // Try to generate AI recommendations
  try {
    const aiRecommendations = await generateAIRecommendations(
      categoryTotals,
      totalEmissions
    );
    return aiRecommendations;
  } catch (error) {
    console.error("AI recommendations failed, using fallback:", error);
    return getFallbackRecommendations(categoryTotals);
  }
}

/**
 * Generate AI-powered recommendations with specific savings
 */
async function generateAIRecommendations(
  categoryTotals: Record<string, number>,
  totalEmissions: number
): Promise<Recommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a carbon reduction consultant for small businesses. Analyze this monthly emissions data and provide 5 specific, actionable recommendations.

Emissions breakdown:
${Object.entries(categoryTotals)
  .map(([cat, kg]) => `- ${cat}: ${kg.toFixed(1)} kg CO2e`)
  .join("\n")}
Total: ${totalEmissions.toFixed(1)} kg CO2e per month

For EACH recommendation, provide:
1. **Title**: Short action (e.g., "Switch to LED Lighting")
2. **Description**: 1-2 sentences explaining how to implement
3. **CO2 Savings**: Specific kg CO2e saved per year
4. **Money Savings**: Estimated $ saved per year (use realistic US prices: electricity $0.12/kWh, gas $1.50/therm, gasoline $3.50/gallon)
5. **Category**: electricity, gas, fuel, or general
6. **Priority**: high, medium, or low

Return ONLY valid JSON array:
[
  {
    "title": "Switch to LED Lighting",
    "description": "Replace 20 incandescent bulbs with LED bulbs to cut electricity use by 75%",
    "potentialReduction": "Save 240 kg CO2e and $85/year",
    "category": "electricity",
    "priority": "high"
  },
  ...
]`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Extract JSON from markdown if wrapped
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    text = jsonMatch[1] || jsonMatch[0];
  }

  const recommendations = JSON.parse(text);

  // Validate structure
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    throw new Error("Invalid AI response format");
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

/**
 * Fallback recommendations with estimated savings
 */
function getFallbackRecommendations(
  categoryTotals: Record<string, number>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Electricity recommendations
  if (categoryTotals.electricity > 100) {
    const savingsKg = Math.round(categoryTotals.electricity * 0.15 * 12);
    const savingsDollars = Math.round(savingsKg * 0.12 * 8.89); // rough conversion

    recommendations.push({
      title: "Switch to LED Lighting",
      description:
        "Replace incandescent bulbs with LED bulbs to reduce electricity consumption by up to 75%",
      potentialReduction: `Save ${savingsKg} kg CO2e and $${savingsDollars}/year`,
      category: "electricity",
      priority: "high",
    });

    recommendations.push({
      title: "Install Smart Thermostats",
      description:
        "Use programmable thermostats to optimize heating and cooling schedules automatically",
      potentialReduction: `Save ${Math.round(
        categoryTotals.electricity * 0.12 * 12
      )} kg CO2e and $${Math.round(
        categoryTotals.electricity * 0.12 * 12 * 0.35
      )}/year`,
      category: "electricity",
      priority: "high",
    });
  }

  // Fuel recommendations
  if (categoryTotals.fuel > 50) {
    const savingsKg = Math.round(categoryTotals.fuel * 0.15 * 12);
    const savingsDollars = Math.round(
      (categoryTotals.fuel / 8.89) * 0.15 * 12 * 3.5
    ); // gallons * price

    recommendations.push({
      title: "Optimize Fleet Routes",
      description:
        "Use route optimization software to reduce fuel consumption by 10-20%",
      potentialReduction: `Save ${savingsKg} kg CO2e and $${savingsDollars}/year`,
      category: "fuel",
      priority: "high",
    });
  }

  // Gas recommendations
  if (categoryTotals.gas > 50) {
    const savingsKg = Math.round(categoryTotals.gas * 0.2 * 12);
    const savingsDollars = Math.round(savingsKg * 0.25); // rough estimate

    recommendations.push({
      title: "Improve Building Insulation",
      description:
        "Upgrade insulation to reduce heating requirements by 15-25%",
      potentialReduction: `Save ${savingsKg} kg CO2e and $${savingsDollars}/year`,
      category: "gas",
      priority: "medium",
    });
  }

  // General recommendation
  recommendations.push({
    title: "Conduct Professional Energy Audit",
    description:
      "Hire a certified auditor to identify customized reduction opportunities",
    potentialReduction: `Typically finds 20-30% reduction opportunities`,
    category: "general",
    priority: "high",
  });

  return recommendations.slice(0, 5);
}

/**
 * Default recommendations when no data exists
 */
function getDefaultRecommendations(): Recommendation[] {
  return [
    {
      title: "Upload Your First Bill",
      description:
        "Start tracking emissions by uploading utility bills, fuel receipts, or energy statements",
      potentialReduction: "Begin your carbon reduction journey",
      category: "general",
      priority: "high",
    },
    {
      title: "Switch to LED Lighting",
      description:
        "LED bulbs use 75% less energy and last 25x longer than incandescent bulbs",
      potentialReduction: "Typical savings: 200-500 kg CO2e and $100-300/year",
      category: "electricity",
      priority: "high",
    },
    {
      title: "Install Smart Thermostats",
      description:
        "Programmable thermostats optimize HVAC schedules automatically",
      potentialReduction: "Typical savings: 150-400 kg CO2e and $80-200/year",
      category: "electricity",
      priority: "medium",
    },
  ];
}
