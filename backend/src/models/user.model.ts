import { query } from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  company_name: string;
  state?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  companyName: string;
  state?: string;
}

export class UserModel {
  static async create(data: CreateUserDTO): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, company_name, state) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, company_name, state, created_at, updated_at`,
      [data.email, hashedPassword, data.companyName, data.state || null]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT id, email, company_name, state, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
  }
}
