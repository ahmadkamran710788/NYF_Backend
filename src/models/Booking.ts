import mongoose, { Schema, Document } from "mongoose";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  REFUNDED = "refunded",
}

interface IBooking extends Document {
  activity: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  bookingDate: Date;
  activityDate: Date;
  timeSlot: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: BookingStatus;
  bookingReference: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  paymentStatus: "pending" | "completed" | "failed";
  paymentMethod?: string;
  cancellationReason?: string;
}

const BookingSchema = new Schema({
  activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bookingDate: { type: Date, default: Date.now },
  activityDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING,
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true,
  },
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  specialRequests: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentMethod: { type: String },
  cancellationReason: { type: String },
});

// Generate unique booking reference
BookingSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.bookingReference = `BK${year}${month}-${random}`;
  }
  next();
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
