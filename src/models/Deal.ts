import mongoose, { Schema, Document } from "mongoose";
export interface IDealPricing {
  date: Date;
  adultPrice: number;
  childPrice: number;
}

export interface IPrivateDealPricing {
  totalPrice: number;
  numberOfPeople: number;
  numberOfAdults: number;
  numberOfChildren: number;
}

// Interface for Deal
export interface IDeal extends Document {
  activity: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dealType: "public" | "private";
  pricing: IDealPricing[] | IPrivateDealPricing;
  includes: string[];
  highlights: string[];
  restrictions?: string[];
  image: string;
}


const DealSchema = new Schema({
  activity: {
    type: Schema.Types.ObjectId,
    ref: "Activity",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  dealType: {
    type: String,
    enum: ["public", "private"],
    default: "public",
    required: true,
  },
  pricing: {
    type: Schema.Types.Mixed,
    required: true,
  },
  includes: [{
    type: String
  }],
  highlights: [{
    type: String
  }],
  restrictions: [{
    type: String
  }]
}, {
  timestamps: true
});
export const Deal = mongoose.model<IDeal>("Deal", DealSchema);  