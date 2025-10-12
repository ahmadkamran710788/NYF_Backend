import mongoose, { Schema, Document } from "mongoose";

// Interface for FAQ
export interface IFAQ {
  question: string;
  answer: string;
}

// Interface for SEO Contents
export interface ISEOContent {
  metaTitle?: string;
  metaDescription?: string;
  oldURL?: string;
  faqs?: IFAQ[];
}

// Interface for Combo Activity/Tour
export interface IComboActivity {
  tour: mongoose.Types.ObjectId;
  tourOption: string;
  activityDiscount: number;
  tourLowestPrice: number;
}

// Interface for Combo Offer
export interface IComboOffer extends Document {
  // Basic Information (English tab)
  name: string;
  permalink: string;
  headerCaption?: string;
  
  // Status
  isPopular: boolean;
  isActive: boolean;
  
  // Content Sections
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  addonExtra?: string;
  childAdultPolicy?: string;
  notSuitableFor?: string;
  pickupTimeDropOffTime?: string;
  openingHours?: string;
  location?: string;
  startingEndPoint?: string;
  termsConditions?: string;
  thingsToKnow?: string;
  dressCode?: string;
  howTo?: string;
  bookingCutOffTime?: string;
  howToRedeem?: string;
  cancellationPolicy?: string;
  attributes?: string[];
  
  // SEO Contents
  seoContent?: ISEOContent;
  
  // Category
  category?: string[];
  
  // Featured Media
  featuredImage?: string;
  images?: string[]; // Multiple images support
  featuredVideo?: string;
  
  // Combo Pricing - New fields
  actualPrice: number; // Original/list price
  discountedPrice: number; // Discounted price
  costPrice?: number; // Cost price
  
  // Combo Details
  comboCurrency: string;
  baseCurrency: string;
  comboDiscount: number;
  comboDiscountType: "percentage" | "fixed";
  
  // Location
  country: string;
  city: string;
  
  // Combo Activities
  activities: IComboActivity[];
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// FAQ Sub-schema
const FAQSchema = new Schema({
  question: { 
    type: String, 
    required: true 
  },
  answer: { 
    type: String, 
    required: true 
  }
}, { _id: false });

// SEO Content Sub-schema
const SEOContentSchema = new Schema({
  metaTitle: { 
    type: String 
  },
  metaDescription: { 
    type: String 
  },
  oldURL: { 
    type: String 
  },
  faqs: [FAQSchema]
}, { _id: false });

// Combo Activity Sub-schema
const ComboActivitySchema = new Schema({
  tour: { 
    type: Schema.Types.ObjectId, 
    ref: "Activity", 
    required: true 
  },
  tourOption: { 
    type: String, 
    required: true 
  },
  activityDiscount: { 
    type: Number, 
    required: true,
    default: 0 
  },
  tourLowestPrice: { 
    type: Number, 
    required: true 
  }
}, { _id: false });

// Main Combo Offer Schema
const ComboOfferSchema = new Schema({
  // Basic Information
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  permalink: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  headerCaption: { 
    type: String,
    trim: true
  },
  
  // Status
  isPopular: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Content Sections
  shortDescription: { 
    type: String 
  },
  description: { 
    type: String 
  },
  highlights: [{ 
    type: String 
  }],
  inclusions: [{ 
    type: String 
  }],
  exclusions: [{ 
    type: String 
  }],
  addonExtra: { 
    type: String 
  },
  childAdultPolicy: { 
    type: String 
  },
  notSuitableFor: { 
    type: String 
  },
  pickupTimeDropOffTime: { 
    type: String 
  },
  openingHours: { 
    type: String 
  },
  location: { 
    type: String 
  },
  startingEndPoint: { 
    type: String 
  },
  termsConditions: { 
    type: String 
  },
  thingsToKnow: { 
    type: String 
  },
  dressCode: { 
    type: String 
  },
  howTo: { 
    type: String 
  },
  bookingCutOffTime: { 
    type: String 
  },
  howToRedeem: { 
    type: String 
  },
  cancellationPolicy: { 
    type: String 
  },
  attributes: [{ 
    type: String 
  }],
  
  // SEO Contents
  seoContent: SEOContentSchema,
  
  // Category
  category: [{ 
    type: String 
  }],
  
  // Featured Media
  featuredImage: { 
    type: String 
  },
  images: [{ 
    type: String 
  }],
  featuredVideo: { 
    type: String 
  },
  
  // Combo Pricing - New fields
  actualPrice: { 
    type: Number, 
    required: true,
    min: 0,
    description: "Original/list price"
  },
  discountedPrice: { 
    type: Number, 
    required: true,
    min: 0,
    description: "Discounted price"
  },
  costPrice: { 
    type: Number,
    min: 0,
    description: "Cost price"
  },
  
  // Combo Details
  comboCurrency: { 
    type: String, 
    required: true,
    default: "AED",
    uppercase: true
  },
  baseCurrency: { 
    type: String, 
    required: true,
    default: "AED",
    uppercase: true
  },
  comboDiscount: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  comboDiscountType: { 
    type: String, 
    enum: ["percentage", "fixed"],
    required: true,
    default: "percentage"
  },
  
  // Location
  country: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  
  // Combo Activities
  activities: {
    type: [ComboActivitySchema],
    validate: {
      validator: function(v: IComboActivity[]) {
        return v && v.length > 0;
      },
      message: "At least one activity is required for a combo offer"
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// ComboOfferSchema.index({ permalink: 1 });
// ComboOfferSchema.index({ country: 1, city: 1 });
// ComboOfferSchema.index({ isActive: 1, isPopular: 1 });
// ComboOfferSchema.index({ category: 1 });
// ComboOfferSchema.index({ createdAt: -1 });

// Virtual for calculating savings
ComboOfferSchema.virtual('totalSavings').get(function() {
  return Math.round((this.actualPrice - this.discountedPrice) * 100) / 100;
});

// Virtual for discount percentage
ComboOfferSchema.virtual('discountPercentage').get(function() {
  if (this.actualPrice === 0) return 0;
  return Math.round(((this.actualPrice - this.discountedPrice) / this.actualPrice) * 100 * 100) / 100;
});

// Virtual for profit (if cost price is provided)
ComboOfferSchema.virtual('profit').get(function() {
  if (!this.costPrice) return null;
  return Math.round((this.discountedPrice - this.costPrice) * 100) / 100;
});

// Ensure virtuals are included in JSON
ComboOfferSchema.set('toJSON', { virtuals: true });
ComboOfferSchema.set('toObject', { virtuals: true });

export const ComboOffer = mongoose.model<IComboOffer>("ComboOffer", ComboOfferSchema);