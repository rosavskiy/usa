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
  hfcs_kg: number;
  pfcs_kg: number;
  sf6_kg: number;
  other_kg: number;
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
  hfcsKg?: number;
  pfcsKg?: number;
  sf6Kg?: number;
  otherKg?: number;
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
       (user_id, document_id, emission_type, category, co2_kg, ch4_kg, n2o_kg, hfcs_kg, pfcs_kg, sf6_kg, other_kg, total_co2e_kg, period_start, period_end) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        data.userId,
        data.documentId,
        data.emissionType,
        data.category,
        data.co2Kg,
        data.ch4Kg,
        data.n2oKg,
        data.hfcsKg || 0,
        data.pfcsKg || 0,
        data.sf6Kg || 0,
        data.otherKg || 0,
        data.totalCo2eKg,
        data.periodStart,
        data.periodEnd,
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<any[]> {
    const result = await query(
      `SELECT 
        c.*,
        json_build_object(
          'id', d.id,
          'file_name', d.file_name,
          'parsed_data', d.parsed_data
        ) as document
       FROM carbon_calculations c
       LEFT JOIN documents d ON c.document_id = d.id
       WHERE c.user_id = $1 
       ORDER BY c.calculation_date DESC`,
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

  static async updateDocument(id: number, documentId: number): Promise<void> {
    await query(
      `UPDATE carbon_calculations SET document_id = $1 WHERE id = $2`,
      [documentId, id]
    );
  }

  static async update(
    id: number,
    data: {
      category?: string;
      total_co2e_kg?: number;
      period_start?: string;
      period_end?: string;
    }
  ): Promise<CarbonCalculation> {
    // Get current calculation
    const current = await CarbonModel.findById(id);
    if (!current) {
      throw new Error("Calculation not found");
    }

    // Calculate proportional gas breakdowns if total is updated
    let co2_kg = current.co2_kg;
    let ch4_kg = current.ch4_kg;
    let n2o_kg = current.n2o_kg;

    if (
      data.total_co2e_kg !== undefined &&
      data.total_co2e_kg !== current.total_co2e_kg
    ) {
      const ratio = data.total_co2e_kg / current.total_co2e_kg;
      co2_kg = current.co2_kg * ratio;
      ch4_kg = current.ch4_kg * ratio;
      n2o_kg = current.n2o_kg * ratio;
    }

    const result = await query(
      `UPDATE carbon_calculations 
       SET category = COALESCE($1, category),
           total_co2e_kg = COALESCE($2, total_co2e_kg),
           co2_kg = $3,
           ch4_kg = $4,
           n2o_kg = $5,
           period_start = COALESCE($6, period_start),
           period_end = COALESCE($7, period_end)
       WHERE id = $8
       RETURNING *`,
      [
        data.category,
        data.total_co2e_kg,
        co2_kg,
        ch4_kg,
        n2o_kg,
        data.period_start,
        data.period_end,
        id,
      ]
    );

    return result.rows[0];
  }

  static async findPreviousByCategory(
    userId: number,
    category: string,
    currentCalculationId: number
  ): Promise<CarbonCalculation | null> {
    const result = await query(
      `SELECT * FROM carbon_calculations 
       WHERE user_id = $1 AND category = $2 AND id != $3 
       ORDER BY calculation_date DESC 
       LIMIT 1`,
      [userId, category, currentCalculationId]
    );
    return result.rows[0] || null;
  }
}
