import { Response } from "express";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../middleware/auth.middleware";
import path from "path";
import fs from "fs";

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

      const {
        companyName,
        state,
        industry,
        currency,
        unitSystem,
        address,
        phone,
        logoPath,
      } = req.body;

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
        address,
        phone,
        logoPath,
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

  static async uploadLogo(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get relative path
      const logoPath = `/uploads/logos/${req.file.filename}`;

      // Update user profile with logo path
      const updatedUser = await UserModel.updateProfile(userId, {
        logoPath,
      });

      // Remove sensitive data
      const { password_hash, ...userProfile } = updatedUser;

      return res.json({
        message: "Logo uploaded successfully",
        user: userProfile,
        logoPath,
      });
    } catch (error) {
      console.error("Upload logo error:", error);
      return res.status(500).json({ error: "Failed to upload logo" });
    }
  }

  static async deleteLogo(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await UserModel.findById(userId);
      if (user?.logo_path) {
        // Delete file if exists
        const filePath = path.join(__dirname, "../../", user.logo_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remove logo path from user
      const updatedUser = await UserModel.updateProfile(userId, {
        logoPath: "",
      });

      const { password_hash, ...userProfile } = updatedUser;

      return res.json({
        message: "Logo deleted successfully",
        user: userProfile,
      });
    } catch (error) {
      console.error("Delete logo error:", error);
      return res.status(500).json({ error: "Failed to delete logo" });
    }
  }
}
