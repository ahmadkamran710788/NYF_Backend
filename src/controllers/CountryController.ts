import { Request, Response } from "express";
import { Country } from "../models/Country";
import { Continent } from "../models/Continent";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
// Get all countries across continents

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    // Extract continent query parameter
    const { continent: continentId } = req.query;
    
    // Build filter based on continent query
    const filter: any = {};
    if (continentId) {
      filter.continent = continentId;
    }
    
    const countries = await Country.find(filter)
      .populate("continent", "name")
      .populate("cities");

    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching countries",
      error: error.message,
    });
  }
};
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
// Add a new country
export const addCountry = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, continentId, description } = req.body;
    let image_url: string | undefined;
    // Validate continent exists
    if (!name || !continentId) {
      res.status(400).json({
        success: false,
        message: "Name and continentId are required fields",
      });
      return;
    }

    const existingCountry = await Country.findOne({
      name,
      continent: continentId,
    });
    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: "Country already exists in this continent",
      });
    }
    if (req.file) {
      try {
        const filePath = req.file.path;
        const uploadResult = await uploadToCloudinary(
          filePath,
          "country_images"
        );
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
    const continent = await Continent.findById(continentId);
    if (!continent) {
      return res.status(404).json({
        success: false,
        message: "Continent not found",
      });
    }

    // Create new country
    const country = new Country({
      name,
      continent: continentId,
      description,
      image: image_url,
      cities: [],
    });

    await country.save();

    // Update continent with the new country
    await Continent.findByIdAndUpdate(continentId, {
      $push: { countries: country._id },
    });

    res.status(201).json({
      success: true,
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error adding country",
      error: error.message,
    });
  }
};
