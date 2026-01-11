import { query } from "../config/database";

export interface CarbonCalculation {
  id: number;
  user_id: number;
  document_id: number;
  emission_type: string; // 'scope1', 'scope2', 'scope3'
  category: string; // 'electricity', 'gas', 'fuel', 'supplies'
  co2_kg: number;
  ch4_kg: number;
  n2o_kg: number;
  total_co2e_kg: number;
  calculation_date: Date;
  period_start: Date;
  period_end: Date;
}

export interface CreateCarbonCalculationDTO {
  userId: number;
  documentId: number;
  emissionType: string;
  category: string;
  co2Kg: number;
  ch4Kg: number;
  n2oKg: number;
  totalCo2eKg: number;
  periodStart: Date;
  periodEnd: Date;
}

export class CarbonModel {
  static async create(
    data: CreateCarbonCalculationDTO
  ): Promise<CarbonCalculation> {
    const result = await query(
      `INSERT INTO carbon_calculations 
       (user_id, document_id, emission_type, category, co2_kg, ch4_kg, n2o_kg, total_co2e_kg, period_start, period_end) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        data.userId,
        data.documentId,
        data.emissionType,
        data.category,
        data.co2Kg,
        data.ch4Kg,
        data.n2oKg,
        data.totalCo2eKg,
        data.periodStart,
        data.periodEnd,
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<CarbonCalculation[]> {
    const result = await query(
      `SELECT * FROM carbon_calculations WHERE user_id = $1 ORDER BY calculation_date DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getTotalByUser(userId: number): Promise<number> {
    const result = await query(
      `SELECT SUM(total_co2e_kg) as total FROM carbon_calculations WHERE user_id = $1`,
      [userId]
    );
    return parseFloat(result.rows[0]?.total || "0");
  }

  static async findByUserIdAndDateRange(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<CarbonCalculation[]> {
    let queryText = `SELECT * FROM carbon_calculations WHERE user_id = $1`;
    const params: any[] = [userId];

    if (startDate && endDate) {
      queryText += ` AND calculation_date >= $2 AND calculation_date <= $3`;
      params.push(startDate, endDate);
    }

    queryText += ` ORDER BY calculation_date DESC`;

    const result = await query(queryText, params);
    return result.rows;
  }

  static async findById(id: number): Promise<CarbonCalculation | null> {
    const result = await query(
      `SELECT * FROM carbon_calculations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<void> {
    await query(`DELETE FROM carbon_calculations WHERE id = $1`, [id]);
  }
}
