import mongoose, { Schema, Document, Model } from "mongoose";

// Define the vehicle document properties without conflicting with Document
interface IVehicleAttributes {
  vehicleModel: string; // Renamed from 'model' to avoid conflict
  number: string;
  color: string;
  picture: string;
  ratePerKm: number;
  isAvailable: boolean;
}

// Define the document type combining Document and our attributes
export interface IVehicle extends Document, IVehicleAttributes {}

// Define the model type
export interface IVehicleModel extends Model<IVehicle> {}

const VehicleSchema = new Schema({
  vehicleModel: { // Changed field name in schema
    type: String, 
    required: [true, 'Vehicle model is required'] 
  },
  number: { 
    type: String, 
    required: [true, 'Vehicle number is required'],
    unique: true
  },
  color: { 
    type: String, 
    required: [true, 'Vehicle color is required'] 
  },
  picture: { 
    type: String, 
    required: [true, 'Vehicle picture is required'] 
  },
  ratePerKm: { 
    type: Number, 
    required: [true, 'Rate per km is required'],
    min: [0, 'Rate per km cannot be negative']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Vehicle = mongoose.model<IVehicle, IVehicleModel>('Vehicle', VehicleSchema);