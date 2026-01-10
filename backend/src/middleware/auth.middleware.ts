import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.utils";
import { AppError } from "./error.middleware";

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", 401));
  }
};
