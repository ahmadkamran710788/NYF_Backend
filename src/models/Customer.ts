// src/models/Customer.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  passport?: string;
  passportExpiry?: Date;
  address?: string;
  country?: string;
  trnNumber?: string;
  newsletter?: boolean;
  approved?: boolean;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSchema = new Schema({
  title: {
    type: String,
    trim: true,
    enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', ''],
    default: ''
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  passport: {
    type: String,
    trim: true,
    maxlength: 50
  },
  passportExpiry: {
    type: Date
  },
  address: {
    type: String,
    trim: true,
    maxlength: 500
  },
  country: {
    type: String,
    trim: true,
    maxlength: 100
  },
  trnNumber: {
    type: String,
    trim: true,
    maxlength: 50
  },
  newsletter: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CustomerSchema.index({ firstName: 1, lastName: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ passport: 1 });
CustomerSchema.index({ trnNumber: 1 });
CustomerSchema.index({ country: 1 });

// Virtual for full name
CustomerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
CustomerSchema.set('toJSON', {
  virtuals: true
});

export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);