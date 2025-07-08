// src/models/Supplier.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISupplier extends Document {
  supplierName: string;
  phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ccEmail?: string;
  apiPayload?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SupplierSchema = new Schema({
  supplierName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  },
  phone: { 
    type: String,
    trim: true,
    maxlength: 20
  },
  email: { 
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: { 
    type: String,
    trim: true,
    maxlength: 500
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90,
    default: 0
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180,
    default: 0
  },
  ccEmail: { 
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid CC email']
  },
 apiPayload: {
    type: Schema.Types.Mixed, // Allows any JSON object
    default: {}
  }
}, {
  timestamps: true
});

// Index for better query performance
SupplierSchema.index({ supplierName: 1 });
SupplierSchema.index({ email: 1 });
SupplierSchema.index({ phone: 1 });

// Compound index for location-based queries
SupplierSchema.index({ latitude: 1, longitude: 1 });

// Pre-save middleware to validate coordinates
SupplierSchema.pre('save', function(next) {
  // If latitude or longitude is provided, both should be valid
  if ((this.latitude && this.latitude !== 0) || (this.longitude && this.longitude !== 0)) {
    if (!this.latitude || !this.longitude) {
      const error = new Error('Both latitude and longitude must be provided if location is specified');
      return next(error);
    }
  }
  next();
});

export const Supplier = mongoose.model<ISupplier>("Supplier", SupplierSchema);