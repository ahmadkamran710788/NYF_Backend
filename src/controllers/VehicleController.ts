import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle';
import { uploadToCloudinary } from '../utils/CloudinaryHelper';
import fs from 'fs';

// Create new vehicle
export const createVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { vehicleModel, number, color, ratePerKm } = req.body;
    
    // Check if a vehicle with the same number already exists
    const existingVehicle = await Vehicle.findOne({ number });
    if (existingVehicle) {
      return res.status(400).json({
        message: 'A vehicle with this number already exists'
      });
    }
    
    // Handle file upload to Cloudinary if file exists
    let pictureUrl = '';
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.path, 
          'vehicles'
        );
        pictureUrl = uploadResult.url;
      } catch (uploadError: any) {
        return res.status(400).json({
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    } else {
      return res.status(400).json({
        message: 'Vehicle picture is required'
      });
    }
    
    // Create new vehicle
    const newVehicle = new Vehicle({
      vehicleModel,
      number,
      color,
      picture: pictureUrl,
      ratePerKm,
      isAvailable: true
    });
    
    // Save vehicle
    const savedVehicle = await newVehicle.save();
    
    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: savedVehicle
    });
  } catch (error: any) {
    // Clean up the file if it exists and there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file after error', unlinkError);
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Error creating vehicle',
      error: error.message
    });
  }
};

// Get all vehicles
export const getAllVehicles = async (req: Request, res: Response): Promise<any> => {
  try {
    const vehicles = await Vehicle.find();
    
    res.status(200).json({
      count: vehicles.length,
      vehicles
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
};

// Get vehicle by ID
export const getVehicleById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json({
      vehicle
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
};

// Update vehicle
export const updateVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { vehicleModel, number, color, ratePerKm, isAvailable } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    // Find the existing vehicle
    const existingVehicle = await Vehicle.findById(id);
    if (!existingVehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }
    
    // Check if number is being changed and if it already exists
    if (number && number !== existingVehicle.number) {
      const duplicateVehicle = await Vehicle.findOne({ number, _id: { $ne: id } });
      if (duplicateVehicle) {
        return res.status(400).json({
          message: 'A vehicle with this number already exists'
        });
      }
    }
    
    // Handle file upload to Cloudinary if file exists
    let pictureUrl = existingVehicle.picture;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.path, 
          'vehicles'
        );
        pictureUrl = uploadResult.url;
      } catch (uploadError: any) {
        return res.status(400).json({
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }
    
    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { 
        vehicleModel, 
        number, 
        color, 
        picture: pictureUrl, 
        ratePerKm, 
        isAvailable 
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error: any) {
    // Clean up the file if it exists and there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file after error', unlinkError);
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Error updating vehicle',
      error: error.message
    });
  }
};

// Delete vehicle
export const deleteVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);
    
    if (!deletedVehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error deleting vehicle',
      error: error.message
    });
  }
};