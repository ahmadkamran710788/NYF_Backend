// // models/Booking.ts
// import mongoose, { Schema, Document } from "mongoose";

// export interface IBooking extends Document {
//   activityId: mongoose.Types.ObjectId;
//   bookingDate: Date;
//   numberOfAdults: number;
//   numberOfChildren: number;
//   totalPrice: number;
//   customerEmail: string;
//   customerName: string;
//   customerPhone: string;
//   bookingReference: string;
//   status: string;
//   createdAt: Date;
// }

// const BookingSchema = new Schema({
//   activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
//   bookingDate: { type: Date, required: true },
//   numberOfAdults: { type: Number, required: true, min: 1 },
//   numberOfChildren: { type: Number, default: 0 },
//   totalPrice: { type: Number, required: true },
//   customerEmail: { type: String, required: true },
//   customerName: { type: String, required: true },
//   customerPhone: { type: String, required: true },
//   bookingReference: { type: String, required: true, unique: true },
//   status: { 
//     type: String, 
//     enum: ["pending", "confirmed", "cancelled"], 
//     default: "pending" 
//   },
//   createdAt: { type: Date, default: Date.now }
// });

// export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);



import mongoose, { Schema, Document } from "mongoose";
export enum BookingStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected"
}

export interface IBooking extends Document {
  activity: mongoose.Types.ObjectId;
  deal: mongoose.Types.ObjectId;
  bookingDate: Date;
  numberOfChildren: number;
  numberOfAdults: number;
  totalPrice: number;
  email: string;
  phoneNumber: string;
  bookingReference: string;
  status: BookingStatus;
}

const BookingSchema = new Schema({
  activity: { 
    type: Schema.Types.ObjectId, 
    ref: "Activity", 
    required: true 
  },
  deal: { 
    type: Schema.Types.ObjectId, 
    ref: "Deal", 
    required: true 
  },
  bookingDate: { 
    type: Date, 
    required: true 
  },
  numberOfChildren: { 
    type: Number, 
    required: true,
    min: 0 
  },
  numberOfAdults: { 
    type: Number, 
    required: true,
    min: 1 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phoneNumber: { 
    type: String, 
    required: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  bookingReference: { 
    type: String, 
    required: true,
    unique: true 
  },
  status: { 
    type: String, 
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING 
  }
}, {
  timestamps: true
});

// Generate unique booking reference
BookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    // Generate a unique booking reference (e.g., prefix + timestamp + random string)
    this.bookingReference = `BOOKING-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }
  next();
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);