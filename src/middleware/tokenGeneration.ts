import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

// Extend Express Request interface to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

// Token generation middleware
const generateToken = (req: Request, res: Response, next: NextFunction): any => {
  try {
    // Define JWT secret (in production, use environment variable)
    const JWT_SECRET: string = process.env.JWT_SECRET || "mysecretkey";
    
    // User should be attached to req from previous middleware
    if (!req.user) {
      console.error("Token generation failed: No user in request object");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Ensure user has an _id
    if (!req.user._id) {
      console.error("Token generation failed: User has no _id");
      return res.status(500).json({ error: "Invalid user data" });
    }

    // Generate the token
    const token = jwt.sign(
      {
        _id: req.user._id.toString(),
        role: req.user.role || 'user', // Default to 'user' if role is undefined
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Attach token to request object for next middleware
    req.token = token;
    
    // Log token (consider removing in production)
    console.log("Generated token:", token);
    
    next();
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate authentication token" });
  }
};

export default generateToken;