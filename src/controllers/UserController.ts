import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("Creating user...");
    const { email, password, role = 'admin' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).send({ error: 'User already exists with this email' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'admin', // Only admin role is allowed
    });

    // Save user to database
    await user.save();

    // Set user in request for token generation middleware
    req.user = user;
    
    // Continue to next middleware (which should be generateToken)
    next();
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).send({ error: 'Failed to create user' });
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("Login attempt...");
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).send({ error: 'Invalid login credentials' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).send({ error: 'Invalid login credentials' });
      return;
    }

    // Set user in request for token generation middleware
    req.user = user;
    
    // Continue to next middleware (which should be generateToken)
    next();
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send({ error: 'Failed to login' });
  }
};