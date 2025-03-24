import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  activityId: mongoose.Types.ObjectId;
  numberOfAdults: number;
  numberOfChildren: number;
  bookingDate: Date;
  pricePerAdult: number;
  pricePerChild: number;
  totalPrice: number;
}

export interface ICart extends Document {
  sessionId: string;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  numberOfAdults: { type: Number, required: true, min: 1 },
  numberOfChildren: { type: Number, default: 0 },
  bookingDate: { type: Date, required: true },
  pricePerAdult: { type: Number, required: true },
  pricePerChild: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const CartSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  items: [CartItemSchema],
  totalAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
