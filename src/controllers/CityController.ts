// src/controllers/cityController.ts
import { Request, Response } from "express";
import { City } from "../models/City";
import { Country } from "../models/Country";

// Get all cities across countries
export const getAllCities = async (req: Request, res: Response) => {
  try {
    const cities = await City.find().populate({
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
export const addCity = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, countryId, description, image } = req.body;

    // Validate country exists
    const country = await Country.findById(countryId);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    // Create new city
    const city = new City({
      name,
      country: countryId,
      description,
      image,
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
    res.status(500).json({
      success: false,
      message: "Error adding city",
      error: error.message,
    });
  }
};
