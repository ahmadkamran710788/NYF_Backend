import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

interface JwtPayload {
  _id: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware for authentication
const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwt1 = process.env.JWT_SECRET;
    // Check for JWT_SECRET
    if (!jwt1) {
      res.status(500).send({ error: "Server configuration error: JWT_SECRET is missing" });
      return;
    }

    const authHeader = req.header("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, jwt1) as JwtPayload;
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new Error("User not found");
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

// Middleware for role-based access control
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).send({ error: "Access denied. Admin privileges required." });
    return;
  }
  next();
};

export {
  auth,
  requireAdmin
};