import { query } from '../config/database';
import crypto from 'crypto';
import { UserModel } from '../models/user.model';

export class PasswordResetService {
  /**
   * Generate reset token and save to DB
   */
  static async requestPasswordReset(email: string): Promise<string | null> {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return null; // Don't reveal if user exists
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create table if not exists (for MVP without migrations)
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Save token to DB
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // For MVP: log token to console (in production, send email)
    console.log(`\n🔐 PASSWORD RESET TOKEN for ${email}:`);
    console.log(`Token: ${token}`);
    console.log(`Reset URL: http://localhost:3001/reset-password?token=${token}`);
    console.log(`Expires: ${expiresAt.toISOString()}\n`);

    return token;
  }

  /**
   * Verify token and reset password
   */
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    // Find valid token
    const result = await query(
      `SELECT user_id, expires_at, used FROM password_reset_tokens 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return false; // Token not found
    }

    const resetToken = result.rows[0];

    // Check if expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return false;
    }

    // Check if already used
    if (resetToken.used) {
      return false;
    }

    // Update password
    await UserModel.updatePassword(resetToken.user_id, newPassword);

    // Mark token as used
    await query(
      `UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
      [token]
    );

    return true;
  }
}
