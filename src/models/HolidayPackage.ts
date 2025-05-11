// import mongoose, { Schema, Document } from "mongoose";
// import { ActivityCategory } from "./Activity";

// // Enum for package types
// export enum PackageType {
//   HOLIDAY = "holiday",
//   HONEYMOON = "honeymoon",
// }

// // Interface for day-by-day itinerary
// export interface IDayItinerary {
//   day: number;
//   title: string;
//   description: string;
//   activities: mongoose.Types.ObjectId[];
//   includedMeals: string[];
//   transport: string;
// }

// // Interface for the holiday package
// export interface IHolidayPackage extends Document {
//   name: string;
//   type: PackageType;
//   destination: mongoose.Types.ObjectId;
//   nights: number;
//   days: number;
//   description: string;
//   images: string[];
//   originalPrice: number;
//   discountPrice: number;
//   includes: string[];
//   excludes: string[];
//   highlights: string[];
//   itinerary: IDayItinerary[];
//   hotelStars: number;
//   hasTransport: boolean;
//   hasAccommodation: boolean;
//   hasActivities: boolean;
//   terms: string[];
//   notes: string[];
//   paymentPolicy: string;
//   isRefundable: boolean;
// }

// const DayItinerarySchema = new Schema({
//   day: { type: Number, required: true },
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
//   includedMeals: [{ type: String }],
//   transport: { type: String }
// });

// const HolidayPackageSchema = new Schema({
//   name: { type: String, required: true },
//   type: { 
//     type: String, 
//     enum: Object.values(PackageType),
//     required: true 
//   },
//   destination: { type: Schema.Types.ObjectId, ref: "City", required: true },
//   nights: { type: Number, required: true },
//   days: { type: Number, required: true },
//   description: { type: String, required: true },
//   images: [{ type: String, required: false }],
//   originalPrice: { type: Number, required: true },
//   discountPrice: { type: Number, required: true },
//   includes: [{ type: String }],
//   excludes: [{ type: String }],
//   highlights: [{ type: String }],
//   itinerary: [DayItinerarySchema],
//   hotelStars: { type: Number, default: 3 },
//   hasTransport: { type: Boolean, default: true },
//   hasAccommodation: { type: Boolean, default: true },
//   hasActivities: { type: Boolean, default: true },
//   terms: [{ type: String }],
//   notes: [{ type: String }],
//   paymentPolicy: { type: String },
//   isRefundable: { type: Boolean, default: false },
// }, {
//   timestamps: true
// });

// export const HolidayPackage = mongoose.model<IHolidayPackage>("HolidayPackage", HolidayPackageSchema);
import mongoose, { Schema, Document } from "mongoose";
import { ActivityCategory } from "./Activity";

// Enum for package types
export enum PackageType {
  HOLIDAY = "holiday",
  HONEYMOON = "honeymoon",
}

// Interface for day-by-day itinerary
export interface IDayItinerary {
  day: number;
  title: string;
  description: string;
  activities: mongoose.Types.ObjectId[];
  includedMeals: string[];
  transport: string;
}

// Interface for the holiday package
export interface IHolidayPackage extends Document {
  name: string;
  type: PackageType;
  destination: mongoose.Types.ObjectId;
  destinationType: string;
  nights: number;
  days: number;
  description: string;
  images: string[];
  originalPrice: number;
  discountPrice: number;
  includes: string[];
  excludes: string[];
  highlights: string[];
  itinerary: IDayItinerary[];
  hotelStars: number;
  hasTransport: boolean;
  hasAccommodation: boolean;
  hasActivities: boolean;
  terms: string[];
  notes: string[];
  paymentPolicy: string;
  isRefundable: boolean;
}

const DayItinerarySchema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
  includedMeals: [{ type: String }],
  transport: { type: String }
});

const HolidayPackageSchema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: Object.values(PackageType),
    required: true 
  },
  destination: { 
    type: Schema.Types.ObjectId, 
    required: true,
    // Use refPath to dynamically determine the referenced model
    refPath: 'destinationType'
  },
  // Field to determine whether destination refers to a City or Country
  destinationType: { 
    type: String, 
    required: true, 
    enum: ['City', 'Country'] 
  },
  nights: { type: Number, required: true },
  days: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: false }],
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  includes: [{ type: String }],
  excludes: [{ type: String }],
  highlights: [{ type: String }],
  itinerary: [DayItinerarySchema],
  hotelStars: { type: Number, default: 3 },
  hasTransport: { type: Boolean, default: true },
  hasAccommodation: { type: Boolean, default: true },
  hasActivities: { type: Boolean, default: true },
  terms: [{ type: String }],
  notes: [{ type: String }],
  paymentPolicy: { type: String },
  isRefundable: { type: Boolean, default: false },
}, {
  timestamps: true
});

export const HolidayPackage = mongoose.model<IHolidayPackage>("HolidayPackage", HolidayPackageSchema);