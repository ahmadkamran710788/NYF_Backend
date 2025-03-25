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
  phoneCountryCode: { type: String, required: true, default: '+92' },
  phoneNumber: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9]{10}$/.test(v);
      },
      message: (props: { value: string }) => `${props.value} is not a valid phone number!`
    }
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
  childAge: { 
    type: Number,
    validate: {
        validator: function (this: IEnquiry) {
          return this.children > 0 ? this.childAge !== undefined : true;
        },
        message: 'Child age is required if children count is greater than 0',
      },
    min: [0, 'Child age cannot be negative'],
    max: [17, 'Maximum child age is 17']
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