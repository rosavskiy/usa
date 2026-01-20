import { query } from "../config/database";

export class CreditService {
  /**
   * Check if user has enough credits
   */
  static async hasEnoughCredits(userId: number, required: number = 1): Promise<boolean> {
    const result = await query(
      "SELECT credits FROM users WHERE id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const currentCredits = result.rows[0].credits || 0;
    return currentCredits >= required;
  }

  /**
   * Get user's current credit balance
   */
  static async getBalance(userId: number): Promise<number> {
    const result = await query(
      "SELECT credits FROM users WHERE id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return 0;
    }
    
    return result.rows[0].credits || 0;
  }

  /**
   * Deduct credits from user (for successful processing)
   */
  static async deductCredits(userId: number, amount: number = 1): Promise<void> {
    await query(
      "UPDATE users SET credits = GREATEST(COALESCE(credits, 0) - $1, 0) WHERE id = $2",
      [amount, userId]
    );
    
    console.log(`💳 Deducted ${amount} credit(s) from user ${userId}`);
  }

  /**
   * Refund credits to user (for failed processing)
   */
  static async refundCredits(userId: number, amount: number = 1): Promise<void> {
    await query(
      "UPDATE users SET credits = COALESCE(credits, 0) + $1 WHERE id = $2",
      [amount, userId]
    );
    
    console.log(`💰 Refunded ${amount} credit(s) to user ${userId}`);
  }
}
