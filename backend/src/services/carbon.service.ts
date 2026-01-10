import { DocumentModel } from '../models/document.model';
import { CarbonModel } from '../models/carbon.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';

// Regional electricity emission factors by state (kg CO2e per kWh)
// Source: EPA eGRID 2023
const ELECTRICITY_BY_STATE: Record<string, number> = {
  CA: 0.200, NY: 0.180, MA: 0.290, OR: 0.250, WA: 0.220,
  CO: 0.520, CT: 0.280, RI: 0.340, VT: 0.010, ME: 0.240,
  MD: 0.420, NJ: 0.260, VA: 0.390, TX: 0.390, FL: 0.420,
  IL: 0.450, PA: 0.480, OH: 0.620, GA: 0.460, NC: 0.410,
  MI: 0.560, WI: 0.580, MN: 0.490, AZ: 0.430, NV: 0.410,
  NM: 0.540, WV: 0.720,
};

const DEFAULT_ELECTRICITY = 0.385; // US average kg CO2e per kWh

// Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  // Natural gas
  gas: {
    m3: 1.89,        // per cubic meter
    therms: 5.3,     // per therm
    mmbtu: 53.06,    // per MMBtu
  },
  // Fuel
  fuel: {
    gallons: 8.89,   // gasoline per gallon
    diesel: 10.21,   // diesel per gallon
    liters: 2.35,    // gasoline per liter (8.89 / 3.785)
  },
};

export async function calculateEmissions(userId: number, documentId: number) {
  // Get document
  const document = await DocumentModel.findById(documentId);
  if (!document || document.user_id !== userId) {
    throw new AppError('Document not found', 404);
  }

  if (document.status !== 'completed' || !document.parsed_data) {
    throw new AppError('Document not yet processed', 400);
  }

  // Get user to retrieve state for regional factors
  const user = await UserModel.findById(userId);
  const userState = user?.state || null;

  // Parse data - handle both string and object
  const parsedData = typeof document.parsed_data === 'string' 
    ? JSON.parse(document.parsed_data) 
    : document.parsed_data;
  
  // Determine emission type and category
  let emissionType = 'scope3';
  let category = parsedData.type || 'other';

  // Map categories to emission types
  if (parsedData.type === 'electricity') {
    emissionType = 'scope2';
  } else if (parsedData.type === 'gas' || parsedData.type === 'fuel') {
    emissionType = 'scope1';
  }

  const consumption = parsedData.consumption?.value || 0;
  const unit = (parsedData.consumption?.unit || 'kWh').toLowerCase();
  const region = userState || 'US';

  // Calculate emissions using EPA factors
  let co2e_kg = 0;
  let factorUsed = 0;

  if (category === 'electricity') {
    factorUsed = ELECTRICITY_BY_STATE[region] || DEFAULT_ELECTRICITY;
    // Handle different units
    if (unit === 'mwh') {
      co2e_kg = consumption * 1000 * factorUsed; // MWh to kWh
    } else {
      co2e_kg = consumption * factorUsed; // kWh
    }
  } else if (category === 'gas') {
    if (unit.includes('therm')) {
      factorUsed = EMISSION_FACTORS.gas.therms;
    } else if (unit.includes('mmbtu')) {
      factorUsed = EMISSION_FACTORS.gas.mmbtu;
    } else {
      factorUsed = EMISSION_FACTORS.gas.m3; // cubic meters
    }
    co2e_kg = consumption * factorUsed;
  } else if (category === 'fuel') {
    if (unit.includes('diesel')) {
      factorUsed = EMISSION_FACTORS.fuel.diesel;
    } else if (unit.includes('liter')) {
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
      method: 'EPA/eGRID 2023',
      factor_value: factorUsed,
      source: category === 'electricity' ? `EPA eGRID 2023 - ${region}` : 'EPA Emission Factors',
    },
  };
}

