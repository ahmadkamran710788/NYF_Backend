// models/Booking.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  activityId: mongoose.Types.ObjectId;
  bookingDate: Date;
  numberOfAdults: number;
  numberOfChildren: number;
  totalPrice: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  bookingReference: string;
  status: string;
  createdAt: Date;
}

const BookingSchema = new Schema({
  activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  bookingDate: { type: Date, required: true },
  numberOfAdults: { type: Number, required: true, min: 1 },
  numberOfChildren: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  bookingReference: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "cancelled"], 
    default: "pending" 
  },
  createdAt: { type: Date, default: Date.now }
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
