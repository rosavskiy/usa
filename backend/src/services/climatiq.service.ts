import axios from 'axios';

const CLIMATIQ_API_URL = 'https://api.climatiq.io/data/v1';
const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY;

interface ClimatiqRequest {
  emissionFactor: string;
  parameters: {
    energy?: number;
    energy_unit?: string;
    volume?: number;
    volume_unit?: string;
    distance?: number;
    distance_unit?: string;
  };
  region?: string;
}

interface ClimatiqResponse {
  co2e: number; // kg CO2e
  co2e_unit: string;
  co2e_calculation_method: string;
  emission_factor: {
    name: string;
    activity_id: string;
    id: string;
  };
}

/**
 * Calculate emissions using Climatiq API
 * Docs: https://www.climatiq.io/docs
 */
export async function calculateEmissionsWithClimatiq(
  category: string,
  consumption: number,
  unit: string,
  region: string = 'US' // Default to US
): Promise<{ co2e_kg: number; details: any }> {
  
  // If no API key, fallback to hardcoded factors
  if (!CLIMATIQ_API_KEY || CLIMATIQ_API_KEY === 'YOUR_CLIMATIQ_API_KEY_HERE') {
    console.warn('⚠️ Climatiq API key not configured, using fallback emission factors');
    return fallbackCalculation(category, consumption, unit, region);
  }

  try {
    const activityId = getActivityId(category, unit);
    
    const requestData: any = {
      emission_factor: {
        activity_id: activityId,
        region: region,
      },
    };

    // Map parameters based on category
    if (category === 'electricity') {
      requestData.parameters = {
        energy: consumption,
        energy_unit: unit.toLowerCase(),
      };
    } else if (category === 'gas') {
      requestData.parameters = {
        volume: consumption,
        volume_unit: unit.toLowerCase(),
      };
    } else if (category === 'fuel') {
      requestData.parameters = {
        volume: consumption,
        volume_unit: unit.toLowerCase(),
      };
    }

    const response = await axios.post<ClimatiqResponse>(
      `${CLIMATIQ_API_URL}/estimate`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      co2e_kg: response.data.co2e,
      details: {
        method: response.data.co2e_calculation_method,
        factor_name: response.data.emission_factor.name,
        factor_id: response.data.emission_factor.id,
      },
    };
  } catch (error: any) {
    console.error('Climatiq API error:', error.response?.data || error.message);
    
    // Fallback to hardcoded factors
    console.warn('⚠️ Falling back to hardcoded emission factors');
    return fallbackCalculation(category, consumption, unit, region);
  }
}

/**
 * Get Climatiq activity ID based on category
 */
function getActivityId(category: string, unit: string): string {
  const activityMap: Record<string, string> = {
    electricity: 'electricity-supply_grid-source_supplier_mix',
    gas: 'natural_gas-supply_natural_gas-production_natural_gas',
    fuel: 'fuel-type_petrol_diesel',
  };

  return activityMap[category] || activityMap.electricity;
}

/**
 * Fallback calculation using EPA emission factors
 */
function fallbackCalculation(
  category: string,
  consumption: number,
  unit: string,
  region: string
): { co2e_kg: number; details: any } {
  
  // Regional electricity factors (kg CO2e per kWh) - EPA eGRID 2023
  const electricityByState: Record<string, number> = {
    CA: 0.200, NY: 0.180, MA: 0.290, OR: 0.250, WA: 0.220,
    CO: 0.520, CT: 0.280, RI: 0.340, VT: 0.010, ME: 0.240,
    MD: 0.420, NJ: 0.260, VA: 0.390, TX: 0.390, FL: 0.420,
    IL: 0.450, PA: 0.480, OH: 0.620, GA: 0.460, NC: 0.410,
    MI: 0.560, WI: 0.580, MN: 0.490, AZ: 0.430, NV: 0.410,
    NM: 0.540, WV: 0.720,
  };

  const defaultElectricity = 0.385; // US average

  let factor = 0;
  let factorName = '';

  if (category === 'electricity') {
    factor = electricityByState[region] || defaultElectricity;
    factorName = `EPA eGRID 2023 - ${region || 'US Average'}`;
  } else if (category === 'gas') {
    // Natural gas: 1.89 kg CO2e per cubic meter (EPA)
    factor = 1.89;
    factorName = 'EPA - Natural Gas Combustion';
    // Convert if needed
    if (unit.toLowerCase().includes('therm')) {
      factor = 5.3; // kg CO2e per therm
    }
  } else if (category === 'fuel') {
    // Gasoline: 8.89 kg CO2e per gallon (EPA)
    // Diesel: 10.21 kg CO2e per gallon
    factor = unit.toLowerCase().includes('diesel') ? 10.21 : 8.89;
    factorName = `EPA - ${unit.includes('diesel') ? 'Diesel' : 'Gasoline'} Combustion`;
    
    // Convert liters to gallons if needed
    if (unit.toLowerCase().includes('liter')) {
      consumption = consumption * 0.264172; // liters to gallons
    }
  }

  const co2e_kg = consumption * factor;

  return {
    co2e_kg: Math.round(co2e_kg * 100) / 100, // Round to 2 decimals
    details: {
      method: 'fallback',
      factor_name: factorName,
      factor_value: factor,
      source: 'EPA/eGRID 2023',
    },
  };
}
