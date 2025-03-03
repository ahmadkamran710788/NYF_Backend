import { Request, Response } from "express";
import { Country } from "../models/Country";
import { Continent } from "../models/Continent";
import mongoose from "mongoose";

// Get all countries across continents
export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.find()
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

// Add a new country
export const addCountry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, continentId, description, image } = req.body;

    // Validate continent exists
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
      image,
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
