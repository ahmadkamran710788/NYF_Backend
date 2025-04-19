// src/controllers/cityController.ts
import { Request, Response } from "express";
import { City } from "../models/City";
import { Country } from "../models/Country";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
import { HolidayPackage, IHolidayPackage } from "../models/HolidayPackage";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";
import { Deal, IDeal } from '../models/Deal';
// Define interface to extend Express Request with file property

// Get all cities across countries
export const getAllCities = async (req: Request, res: Response): Promise<any> => {
  try {
    const countryParam = req.query.country;
    
    // Build filter based on country query
    const filter: any = {};
    
    if (countryParam) {
      // Handle both comma-separated string and array of strings from req.query
      const countryIds = Array.isArray(countryParam) 
        ? countryParam.join(',').split(',') 
        : String(countryParam).split(',');
      
      // Only add to filter if we have valid country IDs
      if (countryIds.length > 0) {
        filter.country = { $in: countryIds };
      }
    }
    
    const cities = await City.find(filter).populate({
      path: "country",
      select: "name continent",
      populate: {
        path: "continent",
        select: "name",
      },
    });
    
    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};
export const getCityById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    const city = await City.findById(id).populate({
      path: "country",
      select: "name continent",
      populate: {
        path: "continent",
        select: "name",
      },
    });
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: city,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching city",
      error: error.message,
    });
  }
};

export const deleteCityById = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    // Find the city first to check if it exists
    const city = await City.findById(id).session(session);
    
    if (!city) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    // Find all activities in this city
    const activities = await Activity.find({ city: id }).session(session);
    const activityIds = activities.map(activity => activity._id);
    
    // Delete all activity details related to these activities
    await ActivityDetail.deleteMany({ activityId: { $in: activityIds } }).session(session);
    
    // Delete all deals related to these activities
    await Deal.deleteMany({ activity: { $in: activityIds } }).session(session);
    
    // Delete all activities in this city
    await Activity.deleteMany({ city: id }).session(session);
    
    // Delete all holiday packages with this city as destination
    await HolidayPackage.deleteMany({ destination: id }).session(session);
    
    // Finally delete the city itself
    const deletedCity = await City.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "City and all related data successfully deleted",
      data: {
        city: deletedCity,
        deletedCounts: {
          activities: activityIds.length,
          activityDetails: await ActivityDetail.countDocuments({ activityId: { $in: activityIds } }),
          deals: await Deal.countDocuments({ activity: { $in: activityIds } }),
          holidayPackages: await HolidayPackage.countDocuments({ destination: id })
        }
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting city",
      error: error.message,
    });
  }
};
// Add a new city

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const addCity = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, countryId, description } = req.body;
    let image_url: string | undefined;

    // Check required fields
    if (!name || !countryId) {
      res.status(400).json({
        success: false,
        message: "Name and countryId are required fields",
      });
      return;
    }
    const existingCity = await City.findOne({ name, country: countryId });
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: "City already exists in this Country",
      });
    }
    // Handle file upload if present
    if (req.file) {
      try {
        const filePath = req.file.path;
        const uploadResult = await uploadToCloudinary(filePath, "city_images");
        image_url = uploadResult.url;

        // Optional: Clean up the temporary file
        // await fs.unlink(filePath);
      } catch (uploadError: any) {
        res.status(400).json({
          success: false,
          message: "Error uploading image",
          error: uploadError.message,
        });
        return;
      }
    }

    // Validate country exists
    const country = await Country.findById(countryId);
    if (!country) {
      res.status(404).json({
        success: false,
        message: "Country not found",
      });
      return;
    }

    // Create new city
    const city = new City({
      name,
      country: countryId,
      description,
      image: image_url,
      activities: [],
    });

    await city.save();

    // Update country with the new city
    await Country.findByIdAndUpdate(countryId, { $push: { cities: city._id } });

    res.status(201).json({
      success: true,
      data: city,
    });
  } catch (error: any) {
    console.error("Error adding city:", error);
    res.status(500).json({
      success: false,
      message: "Error adding city",
      error: error.message,
    });
  }
};
