import { Request, Response } from "express";
import { HolidayPackage, IHolidayPackage } from "../models/HolidayPackage";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
import { City } from "../models/City";
// Get all holiday packages
export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packages = await HolidayPackage.find().populate('destination').populate('itinerary.activities') // Populating activities within each day's itinerary
    .exec();
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
};

// Get package by ID
export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const packageId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      res.status(400).json({ success: false, error: "Invalid package ID format" });
      return;
    }
    
    const holidayPackage = await HolidayPackage.findById(packageId)
      .populate('destination')
      .populate({
        path: 'itinerary.activities',
        model: 'Activity'
      });
    
    if (!holidayPackage) {
      res.status(404).json({ success: false, error: "Package not found" });
      return;
    }
    
    res.status(200).json({ success: true, data: holidayPackage });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
};

// Create new package
// Create new package
export const createPackage = async (req: Request, res: Response): Promise<any> => {
    try {
      const packageData: IHolidayPackage = req.body;
      

      const existingPackage = await HolidayPackage.findOne({ name: packageData.name });

    if (existingPackage) {
      return  res.status(400).json({
        success: false,
        message: "A holiday package with this name already exists",
      });
    }
      // Handle image uploads
      let imageUrls: string[] = [];
      
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            const uploadResult = await uploadToCloudinary(
              file.path,
              "holiday_package_images"
            );
            imageUrls.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error("Error uploading image:", uploadError);
             res.status(400).json({
              success: false,
              message: "Error uploading image",
              error: uploadError.message,
            });
          }
        }
      }
      
      // Merge uploaded image URLs with any existing ones provided in the request
      packageData.images = [...imageUrls, ...(packageData.images || [])];
      
      const newPackage = await HolidayPackage.create(packageData);
      res.status(201).json({ success: true, data: newPackage });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: "Failed to create holiday package",
        error: error.message || String(error) 
      });
    }
  };


  // Update package images 
  // Add images to an existing holiday package
export const addPackageImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        res.status(400).json({ success: false, error: "Invalid package ID format" });
        return;
      }
      
      // Find the package first to make sure it exists
      const holidayPackage = await HolidayPackage.findById(packageId);
      
      if (!holidayPackage) {
        res.status(404).json({ success: false, error: "Holiday package not found" });
        return;
      }
      
      // Handle image uploads
      let imageUrls: string[] = [];
      
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            const uploadResult = await uploadToCloudinary(
              file.path,
              "holiday_package_images"
            );
            imageUrls.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error("Error uploading image:", uploadError);
             res.status(400).json({
              success: false,
              message: "Error uploading image",
              error: uploadError.message,
            });
          }
        }
      }
      
      if (imageUrls.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: "No images were uploaded or all uploads failed" 
        });
        return;
      }
      
      // Add new image URLs to the existing ones
      const updatedPackage = await HolidayPackage.findByIdAndUpdate(
        packageId,
        { 
          $push: { images: { $each: imageUrls } } 
        },
        { new: true }
      );
      
      res.status(200).json({ 
        success: true, 
        message: `Successfully added ${imageUrls.length} images`,
        data: updatedPackage 
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to add images to holiday package",
        error: error.message || String(error) 
      });
    }
  };
// Update package
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const packageId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      res.status(400).json({ success: false, error: "Invalid package ID format" });
      return;
    }
    
    const updatedPackage = await HolidayPackage.findByIdAndUpdate(
      packageId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedPackage) {
      res.status(404).json({ success: false, error: "Package not found" });
      return;
    }
    
    res.status(200).json({ success: true, data: updatedPackage });
  } catch (error) {
    res.status(400).json({ success: false, error: error });
  }
};

// Delete package
export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const packageId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      res.status(400).json({ success: false, error: "Invalid package ID format" });
      return;
    }
    
    const deletedPackage = await HolidayPackage.findByIdAndDelete(packageId);
    
    if (!deletedPackage) {
      res.status(404).json({ success: false, error: "Package not found" });
      return;
    }
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
};

// Get packages by destination
export const getPackagesByDestination = async (req: Request, res: Response): Promise<void> => {
    try {
      const destinationId = req.params.destinationId;
      const packageType = req.query.type as string;
      
      if (!mongoose.Types.ObjectId.isValid(destinationId)) {
        res.status(400).json({ success: false, error: "Invalid destination ID format" });
        return;
      }
      
      // Base query object
      const query: any = { destination: destinationId };
      
      // Add type filter if provided in query
      if (packageType) {
        // Handle comma-separated types (e.g., type=holiday,honeymoon)
        const types = packageType.split(',');
        if (types.length > 1) {
          query.type = { $in: types };
        } else {
          query.type = packageType;
        }
      }
      
      const packages = await HolidayPackage.find(query)
        .populate('destination')
        .populate({
          path: 'itinerary.activities',
          model: 'Activity'
        });
      
      res.status(200).json({ 
        success: true, 
        count: packages.length,
        data: packages 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || String(error) 
      });
    }
  };


export const getPackagesByDestinationName = async (req: Request, res: Response): Promise<void> => {
    try {
      const destinationName = req.params.destinationName;
      const packageType = req.query.type as string;
      
      // Find the destination by name first
      const destination = await City.findOne({ 
        name: { $regex: new RegExp(destinationName, 'i') } 
      });
      
      if (!destination) {
        res.status(404).json({ success: false, error: "Destination not found" });
        return;
      }
      
      // Base query object
      const query: any = { destination: destination._id };
      
      // Add type filter if provided in query
      if (packageType) {
        // Handle comma-separated types (e.g., type=holiday,honeymoon)
        const types = packageType.split(',');
        if (types.length > 1) {
          query.type = { $in: types };
        } else {
          query.type = packageType;
        }
      }
      
      const packages = await HolidayPackage.find(query)
        .populate('destination')
        .populate({
          path: 'itinerary.activities',
          model: 'Activity'
        });
      
      res.status(200).json({
        success: true,
        count: packages.length,
        data: packages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || String(error)
      });
    }
};  

// Get packages by type
export const getPackagesByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.params.type;
    const packages = await HolidayPackage.find({ type })
      .populate('destination');
    
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
};