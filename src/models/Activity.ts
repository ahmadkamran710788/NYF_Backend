


// import mongoose, { Schema, Document } from "mongoose";
// import axios from "axios";

// export enum ActivityCategory {
//   DESERT_SAFARI = "desert safari",
//   DHOW_CRUISE = "dhow cruise",
//   CITY_TOURS = "city tours",
//   WATER_PARK = "water park",
//   THEME_PARK = "theme park",
//   SIGHT_SEEING = "sight seeing tour",
//   HELICOPTER_TOUR = "helicoptour",
//   MUSEUM = "museum",
//   ZOO_AQUARIUM = "zoo and Aquarium",
//   INDOOR_ACTIVITIES = "indoor activities",
//   CULTURAL = "cultural activity",
// }

// export interface IActivity extends Document {
//   name: string;
//   category: ActivityCategory;
//   city: mongoose.Types.ObjectId;
//   description: string;
//   images: string[];
//   originalPrice: number; // Always stored in USD
//   discountPrice: number; // Always stored in USD
//   baseCurrency: string; // Always "USD" for storage
//   duration: string;
//   includes: string[];
//   highlights: string[];
//   isInstantConfirmation: boolean;
//   isMobileTicket: boolean;
//   isRefundable: boolean;
//   ratings: number;
//   reviewCount: number;
// }

// const ActivitySchema = new Schema({
//   name: { type: String, required: true },
//   category: {
//     type: String,
//     enum: Object.values(ActivityCategory),
//     required: true,
//   },
//   city: { type: Schema.Types.ObjectId, ref: "City", required: true },
//   description: { type: String, required: true },
//   images: [{ type: String }],
//   originalPrice: { type: Number, required: true }, // Stored in USD
//   discountPrice: { type: Number, required: true }, // Stored in USD
//   baseCurrency: { type: String, default: "USD" }, // Always USD for storage
//   duration: { type: String },
//   includes: [{ type: String }],
//   highlights: [{ type: String }],
//   isInstantConfirmation: { type: Boolean, default: false },
//   isMobileTicket: { type: Boolean, default: false },
//   isRefundable: { type: Boolean, default: false },
//   ratings: { type: Number, default: 0 },
//   reviewCount: { type: Number, default: 0 },
// });

// export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);

import mongoose, { Schema, Document } from "mongoose";
import axios from "axios";

export enum ActivityCategory {
  DESERT_SAFARI = "desert safari",
  DHOW_CRUISE = "dhow cruise",
  CITY_TOURS = "city tours",
  WATER_PARK = "water park",
  THEME_PARK = "theme park",
  SIGHT_SEEING = "sight seeing tour",
  HELICOPTER_TOUR = "helicoptour",
  MUSEUM = "museum",
  ZOO_AQUARIUM = "zoo and Aquarium",
  INDOOR_ACTIVITIES = "indoor activities",
  CULTURAL = "cultural activity",
}

export interface IActivity extends Document {
  name: string;
  category: ActivityCategory;
  city: mongoose.Types.ObjectId;
  description: string;
  images: string[];
  originalPrice: number; // Always stored in AED
  discountPrice: number; // Always stored in AED
  baseCurrency: string; // Always "AED" for storage
  duration: string;
  includes: string;
  highlights: string[];
  isInstantConfirmation: boolean;
  isMobileTicket: boolean;
  isRefundable: boolean;
  ratings: number;
  reviewCount: number;
  costPrice:number;
}

const ActivitySchema = new Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: Object.values(ActivityCategory),
    required: true,
  },
  city: { type: Schema.Types.ObjectId, ref: "City", required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  originalPrice: { type: Number, required: true }, // Stored in AED
  discountPrice: { type: Number, required: true }, // Stored in AED
  baseCurrency: { type: String, default: "AED" }, // Always AED for storage
  duration: { type: String },
  includes: { type: String },
  highlights: [{ type: String }],
  isInstantConfirmation: { type: Boolean, default: false },
  isMobileTicket: { type: Boolean, default: false },
  isRefundable: { type: Boolean, default: false },
  ratings: { type: Number, default: 5 },
  reviewCount: { type: Number, default: 0 },
  costPrice: { type: Number, required: true }, // Stored in AED
});

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);