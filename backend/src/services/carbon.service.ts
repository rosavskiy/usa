import { DocumentModel } from "../models/document.model";
import { CarbonModel } from "../models/carbon.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";

// Regional electricity emission factors by state (kg CO2e per kWh)
// Source: EPA eGRID 2023
const ELECTRICITY_BY_STATE: Record<string, number> = {
  CA: 0.2,
  NY: 0.18,
  MA: 0.29,
  OR: 0.25,
  WA: 0.22,
  CO: 0.52,
  CT: 0.28,
  RI: 0.34,
  VT: 0.01,
  ME: 0.24,
  MD: 0.42,
  NJ: 0.26,
  VA: 0.39,
  TX: 0.39,
  FL: 0.42,
  IL: 0.45,
  PA: 0.48,
  OH: 0.62,
  GA: 0.46,
  NC: 0.41,
  MI: 0.56,
  WI: 0.58,
  MN: 0.49,
  AZ: 0.43,
  NV: 0.41,
  NM: 0.54,
  WV: 0.72,
};

const DEFAULT_ELECTRICITY = 0.385; // US average kg CO2e per kWh

// Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  // Natural gas
  gas: {
    m3: 1.89, // per cubic meter
    therms: 5.3, // per therm
    mmbtu: 53.06, // per MMBtu
  },
  // Fuel
  fuel: {
    gallons: 8.89, // gasoline per gallon
    diesel: 10.21, // diesel per gallon
    liters: 2.35, // gasoline per liter (8.89 / 3.785)
  },
};

interface CalculationOptions {
  manualScope?: string;
  manualCategory?: string;
}

export async function calculateEmissions(
  userId: number,
  documentId: number,
  options: CalculationOptions = {}
) {
  console.log(`📊 Calculate emissions: userId=${userId}, docId=${documentId}`);

  // Get document
  const document = await DocumentModel.findById(documentId);
  if (!document || document.user_id !== userId) {
    console.error(`❌ Document not found or unauthorized: docId=${documentId}`);
    throw new AppError("Document not found", 404);
  }

  console.log(
    `📄 Document status: ${
      document.status
    }, has parsed_data: ${!!document.parsed_data}`
  );

  if (document.status === "failed") {
    const parsedData =
      typeof document.parsed_data === "string"
        ? JSON.parse(document.parsed_data)
        : document.parsed_data;
    const errorMsg = parsedData?.error || "Document processing failed";
    console.error(`❌ Document failed: ${errorMsg}`);
    throw new AppError(errorMsg, 400);
  }

  if (document.status !== "completed" || !document.parsed_data) {
    console.error(`❌ Document not ready: status=${document.status}`);
    throw new AppError("Document is still being processed - please wait", 400);
  }

  // Parse data - handle both string and object
  const parsedData =
    typeof document.parsed_data === "string"
      ? JSON.parse(document.parsed_data)
      : document.parsed_data;

  console.log(`📋 Parsed data:`, JSON.stringify(parsedData, null, 2));

  // PRIORITY: Get state from user profile FIRST (company location)
  const user = await UserModel.findById(userId);
  let userState = user?.state || parsedData.state || null;

  console.log(
    `🌎 Using state: ${userState} (from ${
      user?.state ? "company profile" : "OCR"
    })`
  );

  // Determine emission type and category
  let emissionType = options.manualScope || "scope3";
  let category = options.manualCategory || parsedData.type || "other";

  // Map categories to emission types (if manual override not provided)
  if (!options.manualScope) {
    if (category === "electricity") {
      emissionType = "scope2";
    } else if (category === "gas" || category === "fuel") {
      emissionType = "scope1";
    }
  }

  console.log(`🎯 Category: ${category}, Scope: ${emissionType}${options.manualCategory || options.manualScope ? ' (manual override)' : ' (auto-detected)'}`);

  const consumption = parsedData.consumption?.value || 0;
  const unit = (parsedData.consumption?.unit || "kWh").toLowerCase();
  const region = userState || "US";

  // Calculate emissions using EPA factors
  let co2e_kg = 0;
  let factorUsed = 0;

  if (category === "electricity") {
    factorUsed = ELECTRICITY_BY_STATE[region] || DEFAULT_ELECTRICITY;
    // Handle different units
    if (unit === "mwh") {
      co2e_kg = consumption * 1000 * factorUsed; // MWh to kWh
    } else {
      co2e_kg = consumption * factorUsed; // kWh
    }
  } else if (category === "gas") {
    if (unit.includes("therm")) {
      factorUsed = EMISSION_FACTORS.gas.therms;
    } else if (unit.includes("mmbtu")) {
      factorUsed = EMISSION_FACTORS.gas.mmbtu;
    } else {
      factorUsed = EMISSION_FACTORS.gas.m3; // cubic meters
    }
    co2e_kg = consumption * factorUsed;
  } else if (category === "fuel") {
    if (unit.includes("diesel")) {
      factorUsed = EMISSION_FACTORS.fuel.diesel;
    } else if (unit.includes("liter")) {
      factorUsed = EMISSION_FACTORS.fuel.liters;
    } else {
      factorUsed = EMISSION_FACTORS.fuel.gallons; // default gasoline
    }
    co2e_kg = consumption * factorUsed;
  }

  // For compatibility with existing schema, split into components
  const co2Kg = co2e_kg * 0.97; // ~97% is CO2
  const ch4Kg = co2e_kg * 0.02; // ~2% equivalent from CH4
  const n2oKg = co2e_kg * 0.01; // ~1% equivalent from N2O
  const totalCo2eKg = co2e_kg;


  // Save calculation
  const calculation = await CarbonModel.create({
    userId,
    documentId,
    emissionType,
    category,
    co2Kg,
    ch4Kg,
    n2oKg,
    totalCo2eKg,
    periodStart: new Date(parsedData.period?.start || parsedData.date),
    periodEnd: new Date(parsedData.period?.end || parsedData.date),
  });

  return {
    id: calculation.id,
    category,
    emissionType,
    consumption: parsedData.consumption,
    emissions: {
      co2Kg,
      ch4Kg,
      n2oKg,
      totalCo2eKg,
    },
    period: parsedData.period,
    calculationDetails: {
      method: "EPA/eGRID 2023",
      factor_value: factorUsed,
      source:
        category === "electricity"
          ? `EPA eGRID 2023 - ${region}`
          : "EPA Emission Factors",
      state_used: userState,
      state_source: user?.state ? "company_profile" : "ocr_detected",
    },
  };
}
