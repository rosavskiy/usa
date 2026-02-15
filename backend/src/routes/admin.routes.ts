import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { query } from "../config/database";
import { NextFunction, Response } from "express";

const router = Router();

// Middleware to check if user is admin
const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await query(
      "SELECT is_admin, is_super FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};

// Get all users
router.get(
  "/users",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const search = (req.query.search as string) || "";
      const limit = 10;

      let sql = `
      SELECT 
        u.id,
        u.email,
        u.company_name,
        u.credits,
        u.is_admin,
        u.is_super,
        u.is_blocked,
        u.last_login,
        u.created_at,
        COUNT(DISTINCT d.id) as uploads_count,
        0 as downloads_count,
        COALESCE((
          SELECT COUNT(*) 
          FROM activity_logs al 
          WHERE al.user_id = u.id 
          AND al.action = 'credit_deducted'
        ), 0) as credits_spent,
        0 as credits_purchased
      FROM users u
      LEFT JOIN documents d ON d.user_id = u.id
      `;

      const params: any[] = [];
      if (search) {
        sql += ` WHERE u.email ILIKE $1 OR u.company_name ILIKE $1`;
        params.push(`%${search}%`);
      }

      sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ${limit}`;

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

// Update user
router.patch(
  "/users/:userId",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { is_admin, is_super, credits, is_blocked } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (typeof is_admin === "boolean") {
        updates.push(`is_admin = $${paramCount++}`);
        values.push(is_admin);
      }

      if (typeof is_super === "boolean") {
        updates.push(`is_super = $${paramCount++}`);
        values.push(is_super);
      }

      if (typeof credits === "number") {
        updates.push(`credits = $${paramCount++}`);
        values.push(credits);
      }

      if (typeof is_blocked === "boolean") {
        updates.push(`is_blocked = $${paramCount++}`);
        values.push(is_blocked);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      values.push(userId);
      const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

      const result = await query(sql, values);

      // Log activity
      if (req.userId && req.userEmail) {
        await query(
          "INSERT INTO activity_logs (user_id, user_email, action, details) VALUES ($1, $2, $3, $4)",
          [req.userId, req.userEmail, "USER_UPDATED", `Updated user ${userId}`],
        );
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Block user
router.post(
  "/users/:userId/block",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { permanent } = req.body;

      await query("UPDATE users SET is_blocked = TRUE WHERE id = $1", [userId]);

      // Log activity
      if (req.userId && req.userEmail) {
        await query(
          "INSERT INTO activity_logs (user_id, user_email, action, details) VALUES ($1, $2, $3, $4)",
          [
            req.userId,
            req.userEmail,
            "USER_BLOCKED",
            `${permanent ? "Permanently" : "Temporarily"} blocked user ${userId}`,
          ],
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  },
);

// Get activity logs
router.get(
  "/activities",
  authenticate,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await query(`
      SELECT 
        id,
        user_email,
        action,
        details,
        timestamp
      FROM activity_logs
      ORDER BY timestamp DESC
      LIMIT 100
    `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  },
);

// Check if current user is admin
router.get("/check", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.json({ isAdmin: false, isSuper: false });
    }

    const result = await query(
      "SELECT is_admin, is_super FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.json({ isAdmin: false, isSuper: false });
    }

    return res.json({
      isAdmin: result.rows[0].is_admin || false,
      isSuper: result.rows[0].is_super || false,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to check admin status" });
  }
});

// Login as user (impersonate)
router.post(
  "/login-as/:userId",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await query(
        "SELECT id, email, company_name FROM users WHERE id = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = result.rows[0];
      const { generateToken } = await import("../utils/jwt.utils");
      const token = generateToken({ userId: user.id, email: user.email });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
        },
      });
    } catch (error) {
      console.error("Error logging in as user:", error);
      res.status(500).json({ error: "Failed to login as user" });
    }
  },
);

export default router;
