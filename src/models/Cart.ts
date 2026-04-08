
import mongoose, { Schema, Document } from "mongoose";

// Interface for cart item
export interface ICartItem {
  activity: mongoose.Types.ObjectId;
  deal: mongoose.Types.ObjectId;
  bookingDate: Date;
  numberOfAdults: number;
  numberOfChildren: number;
  adultPrice: number;
  childPrice: number;
  subtotal: number;
  isFixedPrice: boolean;
  withTransport: boolean;
  transportPrice: number;
  quantity: number;
}

// Interface for cart
export interface ICart extends Document {
  cartId: string;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// Cart schema
const CartSchema = new Schema({
  cartId: { 
    type: String, 
    required: true, 
    unique: true 
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
    isFixedPrice: {
      type: Boolean,
      default: false
    },
    withTransport: {
      type: Boolean,
      default: false
    },
    transportPrice: {
      type: Number,
      default: 0
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  totalAmount: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
});

// Index to automatically expire carts
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Before saving, update the total amount
CartSchema.pre('save', function(next) {
  // Calculate total amount
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  } else {
    this.totalAmount = 0;
  }
  
  // Update updatedAt
  this.updatedAt = new Date();
  
  next();
});

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
 