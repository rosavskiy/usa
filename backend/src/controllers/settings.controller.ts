import { Response } from "express";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../middleware/auth.middleware";

export class SettingsController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove sensitive data
      const { password_hash, ...userProfile } = user;

      return res.json(userProfile);
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ error: "Failed to get profile" });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { companyName, state, industry, currency, unitSystem } = req.body;

      // Validate currency
      const validCurrencies = ["USD", "EUR", "GBP", "CAD"];
      if (currency && !validCurrencies.includes(currency)) {
        return res.status(400).json({ error: "Invalid currency" });
      }

      // Validate unit system
      const validUnitSystems = ["Imperial", "Metric"];
      if (unitSystem && !validUnitSystems.includes(unitSystem)) {
        return res.status(400).json({ error: "Invalid unit system" });
      }

      const updatedUser = await UserModel.updateProfile(userId, {
        companyName,
        state,
        industry,
        currency,
        unitSystem,
      });

      // Remove sensitive data
      const { password_hash, ...userProfile } = updatedUser;

      return res.json({
        message: "Profile updated successfully",
        user: userProfile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }
}
