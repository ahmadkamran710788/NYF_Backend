// src/controllers/cityController.ts
import { Request, Response } from "express";
import { City } from "../models/City";
import { Country } from "../models/Country";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";

// Define interface to extend Express Request with file property

// Get all cities across countries
export const getAllCities = async (req: Request, res: Response) => {
  try {

     const { country: countryId } = req.query;
        
        // Build filter based on continent query
        const filter: any = {};
        if (countryId) {
          filter.country = countryId;
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
