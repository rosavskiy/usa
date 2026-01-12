import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { generateToken } from "../utils/jwt.utils";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { PasswordResetService } from "../services/password-reset.service";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  state: z.string().length(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
  }
);

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await UserModel.findByEmail(validated.email);
    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    // Create user
    const user = await UserModel.create({
      email: validated.email,
      password: validated.password,
      companyName: validated.companyName,
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
        },
        token,
      },
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = loginSchema.parse(req.body);

    // Find user
    const user = await UserModel.findByEmail(validated.email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(
      validated.password,
      user.password_hash
    );
    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
        },
        token,
      },
    });
  }
);

export const requestPasswordReset = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const resetToken = await PasswordResetService.requestPasswordReset(email);

    // Don't reveal if user exists
    res.json({
      success: true,
      message:
        "If an account exists with this email, password reset instructions have been sent.",
      devToken: resetToken, // For MVP only - remove in production
    });
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError("Token and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const success = await PasswordResetService.resetPasswordWithToken(
      token,
      newPassword
    );

    if (!success) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  }
);

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await UserModel.findById(req.userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
    },
  });
});
