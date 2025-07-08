// src/models/Hotel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IHotel extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country: mongoose.Types.ObjectId;
  city: mongoose.Types.ObjectId;
  zip?: string;
  website?: string;
  netRatePerNight: number;
  sellRatePerNight: number;
  commission: number;
  commissionAmount: number;
  tax: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  stars: number;
  note?: string;
  amenities?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const HotelSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String,
    trim: true 
  },
  address: { 
    type: String,
    trim: true 
  },
  country: { 
    type: Schema.Types.ObjectId, 
    ref: "Country", 
    required: true 
  },
  city: { 
    type: Schema.Types.ObjectId, 
    ref: "City", 
    required: true 
  },
  zip: { 
    type: String,
    trim: true 
  },
  website: { 
    type: String,
    trim: true 
  },
  netRatePerNight: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  sellRatePerNight: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  commission: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  commissionAmount: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  tax: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  taxAmount: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
   
    default: 'AED',
    enum: ['AED', 'USD', 'EUR', 'GBP', 'PKR', 'INR', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD'],
    uppercase: true
  },
  stars: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  note: { 
    type: String,
    trim: true 
  },
  amenities: [{ 
    type: String,
    trim: true 
  }]
}, {
  timestamps: true
});

// Index for better query performance
HotelSchema.index({ name: 1, city: 1 });
HotelSchema.index({ country: 1, city: 1 });
HotelSchema.index({ stars: 1 });

// Pre-save middleware to calculate amounts
HotelSchema.pre('save', function(next) {
  if (this.isModified('sellRatePerNight') || this.isModified('commission') || this.isModified('tax')) {
    // Calculate commission amount
    this.commissionAmount = (this.sellRatePerNight * this.commission) / 100;
    
    // Calculate tax amount
    this.taxAmount = (this.sellRatePerNight * this.tax) / 100;
    
    // Calculate total amount
    this.totalAmount = this.sellRatePerNight + this.commissionAmount + this.taxAmount;
  }
  next();
});

export const Hotel = mongoose.model<IHotel>("Hotel", HotelSchema);