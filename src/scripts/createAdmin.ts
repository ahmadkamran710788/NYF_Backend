import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const EMAIL = 'admin@gmail.com';
const PASSWORD = '710788';

const createAdmin = async () => {
  try {
    const mongoUrl = process.env.mongodb_url;
    if (!mongoUrl) {
      throw new Error('mongodb_url not found in .env');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: EMAIL });
    if (existing) {
      console.log(`Admin already exists: ${EMAIL}`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    await User.create({ email: EMAIL, password: hashedPassword, role: 'admin' });

    console.log(`Admin created successfully — email: ${EMAIL}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
