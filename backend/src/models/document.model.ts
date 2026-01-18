import { query } from "../config/database";

export interface Document {
  id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsed_data?: any;
  status: "pending" | "processing" | "completed" | "failed";
  reporting_period_id?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDocumentDTO {
  userId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  parsedData?: any;
  status?: "pending" | "processing" | "completed" | "failed";
  reportingPeriodId?: number | null;
}

export class DocumentModel {
  static async create(data: CreateDocumentDTO): Promise<Document> {
    const status = data.status || "pending";
    const parsedData = data.parsedData ? JSON.stringify(data.parsedData) : null;

    const result = await query(
      `INSERT INTO documents (user_id, file_name, file_path, file_type, file_size, parsed_data, status, reporting_period_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        data.userId,
        data.fileName,
        data.filePath,
        data.fileType,
        data.fileSize,
        parsedData,
        status,
        data.reportingPeriodId || null,
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<Document[]> {
    const result = await query(
      `SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findUniqueByUserId(userId: number): Promise<Document[]> {
    const result = await query(
      `SELECT * FROM (
        SELECT DISTINCT ON (file_name) * 
        FROM documents 
        WHERE user_id = $1 AND file_path != 'manual'
        ORDER BY file_name, id DESC
      ) as unique_docs
      ORDER BY id DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Document | null> {
    const result = await query("SELECT * FROM documents WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async updateParsedData(
    id: number,
    parsedData: any,
    status?: string
  ): Promise<void> {
    if (status) {
      await query(
        `UPDATE documents SET parsed_data = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [JSON.stringify(parsedData), status, id]
      );
    } else {
      await query(
        `UPDATE documents SET parsed_data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(parsedData), id]
      );
    }
  }

  static async findByFileName(
    userId: number,
    fileName: string
  ): Promise<Document[]> {
    const result = await query(
      `SELECT * FROM documents WHERE user_id = $1 AND file_name = $2`,
      [userId, fileName]
    );
    return result.rows;
  }

  static async delete(id: number): Promise<void> {
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
  }
}
