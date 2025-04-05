import mongoose, { Schema, Document } from "mongoose";

export interface IEnquiry extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  travelDate: Date;
  adults: number;
  children: number;
  childAge?: number;
  budget?: number;
  message?: string;
  packageId: mongoose.Types.ObjectId;
  status?: 'Pending' | 'Contacted' | 'Booked' | 'Cancelled';
}

const EnquirySchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  // phoneCountryCode: { type: String, required: true, default: '+92' },
  phoneNumber: { 
    type: String, 
    required: true,
    // validate: {
    //   validator: function(v: string) {
    //     return /^[0-9]{10}$/.test(v);
    //   },
    //   message: (props: { value: string }) => `${props.value} is not a valid phone number!`
    // }
  },
  travelDate: { type: Date, required: true },
  adults: { 
    type: Number, 
    required: true,
    min: [1, 'Adults must be at least 1'],
    max: [10, 'Maximum 10 adults allowed']
  },
  children: { 
    type: Number, 
    required: true,
    default: 0,    
    min: [0, 'Children cannot be negative'],
    max: [10, 'Maximum 10 children allowed']
  },
  childAges: { 
    type: [Number], // Changed to array of numbers
    validate: {
      validator: function(this: IEnquiry, childAges: number[]) {
        // If there are children, childAges must be an array with the same length
        if (this.children > 0) {
          if (!childAges || !Array.isArray(childAges) || childAges.length !== this.children) {
            return false;
          }
          // Each age must be between 0 and 17
          return childAges.every(age => age >= 0 && age <= 17);
        }
        // If no children, childAges should be undefined or empty
        return !childAges || childAges.length === 0;
      },
      message: 'Child ages must be provided for each child and each age must be between 0 and 17'
    }
  },
  budget: { type: Number },
  message: { type: String },
  packageId: { 
    type: Schema.Types.ObjectId, 
    ref: 'HolidayPackage',
    required: true
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Contacted', 'Booked', 'Cancelled'], 
    default: 'Pending' 
  }
}, {
  timestamps: true
});

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);