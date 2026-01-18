import pool from "../config/database";

export interface ReportingPeriod {
  id: number;
  user_id: number;
  period_type: "monthly" | "quarterly" | "annual";
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReportingPeriodDto {
  period_type: "monthly" | "quarterly" | "annual";
  start_date: Date;
  end_date: Date;
}

class ReportingPeriodModel {
  async create(
    userId: number,
    data: CreateReportingPeriodDto,
  ): Promise<ReportingPeriod> {
    // Deactivate all other periods for this user
    await pool.query(
      "UPDATE reporting_periods SET is_active = false WHERE user_id = $1",
      [userId],
    );

    const result = await pool.query<ReportingPeriod>(
      `INSERT INTO reporting_periods (user_id, period_type, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [userId, data.period_type, data.start_date, data.end_date],
    );

    return result.rows[0];
  }

  async getActive(userId: number): Promise<ReportingPeriod | null> {
    const result = await pool.query<ReportingPeriod>(
      "SELECT * FROM reporting_periods WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    return result.rows[0] || null;
  }

  async getAll(userId: number): Promise<ReportingPeriod[]> {
    const result = await pool.query<ReportingPeriod>(
      "SELECT * FROM reporting_periods WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );

    return result.rows;
  }

  async setActive(userId: number, periodId: number): Promise<void> {
    // Deactivate all periods
    await pool.query(
      "UPDATE reporting_periods SET is_active = false WHERE user_id = $1",
      [userId],
    );

    // Activate selected period
    await pool.query(
      "UPDATE reporting_periods SET is_active = true WHERE id = $1 AND user_id = $2",
      [periodId, userId],
    );
  }

  async delete(userId: number, periodId: number): Promise<void> {
    await pool.query(
      "DELETE FROM reporting_periods WHERE id = $1 AND user_id = $2",
      [periodId, userId],
    );
  }

  async deactivateAll(userId: number): Promise<void> {
    await pool.query(
      "UPDATE reporting_periods SET is_active = false WHERE user_id = $1",
      [userId],
    );
  }
}

export default new ReportingPeriodModel();
