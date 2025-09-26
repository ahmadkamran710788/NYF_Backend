import { Request, Response } from "express";
import { Country } from "../models/Country";
import { Continent } from "../models/Continent";
import { HolidayPackage, IHolidayPackage } from "../models/HolidayPackage";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import { Deal, IDeal } from '../models/Deal';
import { City } from "../models/City";
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

export const editCountry = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, continentId, description } = req.body;
    let image_url: string | undefined;

    // Validate country ID
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Country ID is required",
      });
      return;
    }

    console.log(id,"Country id ")
    // Find the country
    const country = await Country.findById(id);
    if (!country) {
      res.status(404).json({
        success: false,
        message: "Country not found",
      });
      return;
    }

    // If continentId is provided, validate it exists
    if (continentId) {
      const continent = await Continent.findById(continentId);
      if (!continent) {
        res.status(404).json({
          success: false,
          message: "Continent not found",
        });
        return;
      }
    }

    // Check if name is being changed and if new name already exists in the target continent
    const targetContinentId = continentId || country.continent;
    if (name && (name !== country.name || continentId)) {
      const existingCountry = await Country.findOne({
        name,
        continent: targetContinentId,
        _id: { $ne: id } // Exclude current country from search
      });
      if (existingCountry) {
        res.status(400).json({
          success: false,
          message: "Country with this name already exists in the target continent",
        });
        return;
      }
    }

    // Handle image upload if file is present
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

    // Handle continent change
    const oldContinentId = country.continent;
    const newContinentId = continentId;

    if (newContinentId && newContinentId.toString() !== oldContinentId.toString()) {
      // Remove country from old continent
      await Continent.findByIdAndUpdate(oldContinentId, {
        $pull: { countries: id }
      });

      // Add country to new continent
      await Continent.findByIdAndUpdate(newContinentId, {
        $push: { countries: id }
      });
    }

    // Update fields only if provided
    const updateData: any = {};
    if (name) updateData.name = name;
    if (continentId) updateData.continent = continentId;
    if (description !== undefined) updateData.description = description;
    if (image_url) updateData.image = image_url;

    // Update the country
    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('continent');

    res.status(200).json({
      success: true,
      data: updatedCountry,
      message: "Country updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating country",
      error: error.message,
    });
  }
};
// Get country by ID
export const getCountryById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Country ID is required",
      });
    }

    const country = await Country.findById(id).populate({
      path: "continent",
      select: "name"
    }).populate({
      path: "cities",
      select: "name"
    });
    
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching country",
      error: error.message,
    });
  }
};

// Delete country by ID with cascade deletion
export const deleteCountryById = async (req: Request, res: Response): Promise<any> => {
  // Use a session to ensure transaction consistency
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Country ID is required",
      });
    }

    // First check if the country exists
    const country = await Country.findById(id).session(session);
    if (!country) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    // Get all cities in this country
    const cities = await City.find({ country: id }).session(session);
    const cityIds = cities.map(city => city._id);

    // For each city, find all activities
    const activities = await Activity.find({ city: { $in: cityIds } }).session(session);
    const activityIds = activities.map(activity => activity._id);

    // Delete all deals related to these activities
    const deletedDeals = await Deal.deleteMany({ activity: { $in: activityIds } }).session(session);

    // Delete all activity details related to these activities
    const deletedActivityDetails = await ActivityDetail.deleteMany({ 
      activityId: { $in: activityIds } 
    }).session(session);
    
    // Delete all activities
    const deletedActivities = await Activity.deleteMany({ 
      city: { $in: cityIds } 
    }).session(session);
    
    // Delete all holiday packages related to these cities
    const deletedPackages = await HolidayPackage.deleteMany({ 
      destination: { $in: cityIds } 
    }).session(session);
    
    // Delete all cities in this country
    const deletedCities = await City.deleteMany({ country: id }).session(session);
    
    // Remove the country reference from the continent
    await Continent.updateOne(
      { _id: country.continent },
      { $pull: { countries: id } }
    ).session(session);

    // Finally delete the country
    const deletedCountry = await Country.findByIdAndDelete(id).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Country and all related data successfully deleted",
      data: {
        country: deletedCountry,
        deletedCitiesCount: deletedCities.deletedCount,
        deletedActivitiesCount: deletedActivities.deletedCount,
        deletedActivityDetailsCount: deletedActivityDetails.deletedCount,
        deletedPackagesCount: deletedPackages.deletedCount,
        deletedDealsCount: deletedDeals.deletedCount
      },
    });
  } catch (error: any) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting country and related data",
      error: error.message,
    });
  }
};