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
  staycation?: boolean;
  packageId: mongoose.Types.ObjectId;
  dealId: mongoose.Types.ObjectId;
  status?: 'Pending' | 'Contacted' | 'Booked' | 'Cancelled';
  enquiryType: 'holidayPackage' | 'carService' | 'honeymoonPackage' | 'deals';
//deal
nights?: number;
hotelStars?: number;
  //vehicle 
  pickupLocation?: string;
  dropoffLocation?: string;
  numberOfGuests?: number;
  numberOfLuggageBags?: number;
  vehicleId?: mongoose.Types.ObjectId;
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
    required: true
  },
  travelDate: { type: Date, required: true },
  budget: { type: Number },
  message: { type: String },
  staycation: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['Pending', 'Contacted', 'Booked', 'Cancelled'], 
    default: 'Pending' 
  },
  
  // Field to differentiate between enquiry types
  enquiryType: {
    type: String,
    enum: ['holidayPackage', 'carService','honeymoonPackage','deals'],
    required: true
  },
  
  // Holiday package specific fields
  adults: { 
    type: Number, 
    min: [1, 'Adults must be at least 1'],
    max: [10, 'Maximum 10 adults allowed'],
    validate: {
      validator: function(this: IEnquiry, adults: number) {
        // Only required if enquiry type is holidayPackage
        return this.enquiryType !== 'holidayPackage' || adults >= 1;
      },
      message: 'Adults count is required for holiday package enquiries'
    }
  },
  children: { 
    type: Number, 
    default: 0,    
    min: [0, 'Children cannot be negative'],
    max: [10, 'Maximum 10 children allowed']
  },
  childAges: { 
    type: [Number],
    validate: {
      validator: function(this: IEnquiry, childAges: number[]) {
        // If enquiry type is not holidayPackage, no validation needed
        if (this.enquiryType !== 'holidayPackage') {
          return true;
        }
        
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
  packageId: { 
    type: Schema.Types.ObjectId, 
    ref: 'HolidayPackage',
    validate: {
      validator: function(this: IEnquiry, packageId: mongoose.Types.ObjectId) {
        // Only required if enquiry type is holidayPackage
        return this.enquiryType !== 'holidayPackage' || packageId;
      },
      message: 'Package ID is required for holiday package enquiries'
    }
  },
  dealId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Deal',
    validate: {
      validator: function(this: IEnquiry, dealId: mongoose.Types.ObjectId) {
        // Only required if enquiry type is holidayPackage
        return this.enquiryType !== 'deals' || dealId;
      },
      message: 'deaks ID is required for deals enquiries'
    }
  },
  
  // Car service specific fields
  pickupLocation: {
    type: String,
    validate: {
      validator: function(this: IEnquiry, pickupLocation: string) {
        // Only required if enquiry type is carService
        return this.enquiryType !== 'carService' || !!pickupLocation;
      },
      message: 'Pickup location is required for car service enquiries'
    }
  },
  dropoffLocation: {
    type: String,
    validate: {
      validator: function(this: IEnquiry, dropoffLocation: string) {
        // Only required if enquiry type is carService
        return this.enquiryType !== 'carService' || !!dropoffLocation;
      },
      message: 'Dropoff location is required for car service enquiries'
    }
  },
  numberOfGuests: {
    type: Number,
    min: [1, 'Number of guests must be at least 1'],
    validate: {
      validator: function(this: IEnquiry, numberOfGuests: number) {
        // Only required if enquiry type is carService
        return this.enquiryType !== 'carService' || numberOfGuests >= 1;
      },
      message: 'Number of guests is required for car service enquiries'
    }
  },
  nights: {
    type: Number,
    min: [1, 'Number of night must be at least 1'],
    validate: {
      validator: function(this: IEnquiry, nights: number) {
        // Only required if enquiry type is carService
        return this.enquiryType !== 'deals' || nights >= 1;
      },
      message: 'Number of nights is required for deals service enquiries'
    }
  },
  hotelStars:{
    type: Number,
    min: [1, 'Number of guests must be at least 1'],
    validate: {
      validator: function(this: IEnquiry, hotelStars: number) {
        // Only required if enquiry type is deals
        return this.enquiryType !== 'deals' || hotelStars >= 3;
      },
      message: 'Number of hotel stars is required for deals service enquiries'
    }
  },
  numberOfLuggageBags: {
    type: Number,
    min: [0, 'Number of luggage bags cannot be negative'],
    default: 0
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    validate: {
      validator: function(this: IEnquiry, vehicleId: mongoose.Types.ObjectId) {
        // Only required if enquiry type is carService
        return this.enquiryType !== 'carService' || vehicleId;
      },
      message: 'Vehicle ID is required for car service enquiries'
    }
  }
}, {
  timestamps: true
});

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);