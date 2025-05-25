import mongoose, { Schema, Document } from "mongoose";

export enum BookingStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected"
}

export interface IBooking extends Document {
  activity?: mongoose.Types.ObjectId; // Made optional
  deal?: mongoose.Types.ObjectId; // Made optional
  cart?: mongoose.Types.ObjectId; // Optional cart reference
  bookingDate?: Date; // Made optional
  numberOfChildren?: number; // Made optional
  numberOfAdults?: number; // Made optional
  totalPrice: number;
  email?: string; // Made optional
  phoneNumber?: string; // Made optional
  bookingReference: string;
  status: BookingStatus;
}

const BookingSchema = new Schema({
  activity: { 
    type: Schema.Types.ObjectId, 
    ref: "Activity", 
    required: false // Made optional
  },
  deal: { 
    type: Schema.Types.ObjectId, 
    ref: "Deal", 
    required: false // Made optional
  },
  cart: { 
    type: Schema.Types.ObjectId, 
    ref: "Cart", 
    required: false // Optional cart reference
  },
  items: [{
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
    numberOfAdults: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    numberOfChildren: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    adultPrice: { 
      type: Number, 
      required: true 
    },
    childPrice: { 
      type: Number, 
      required: true 
    },
    subtotal: { 
      type: Number, 
      required: true 
    },
    activityName: { 
      type: String, 
      required: false 
    },
    dealTitle: { 
      type: String, 
      required: false 
    }
  }],
  bookingDate: { 
    type: Date, 
    required: false // Made optional
  },
  numberOfChildren: { 
    type: Number, 
    required: false, // Made optional
    min: 0 
  },
  numberOfAdults: { 
    type: Number, 
    required: false, // Made optional
    min: 1 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  email: { 
    type: String, 
    required: false, // Made optional
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phoneNumber: { 
    type: String, 
    required: false, // Made optional
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