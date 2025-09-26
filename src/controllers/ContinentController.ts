import { Request, Response } from "express";
import { Continent } from "../models/Continent";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
import { HolidayPackage, IHolidayPackage } from "../models/HolidayPackage";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import { Deal, IDeal } from '../models/Deal';
import { City } from "../models/City";
import { Country } from "../models/Country";
import mongoose from "mongoose";
export const getAllContinents = async (req: Request, res: Response) => {
  try {
    console.log("get  in ");
    const continents = await Continent.find().populate("countries");
    res.status(200).json({
      success: true,
      data: continents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching continents",
      error: error.message,
    });
  }
};

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const addContinent = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, description } = req.body;
    let image_url: string | undefined;

    // Validate continent exists
    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: "Name and description are required fields",
      });
      return;
    }

    const existingContinent = await Continent.findOne({ name });
    if (existingContinent) {
      return res.status(400).json({
        success: false,
        message: "Continent already exists",
      });
    }

    // Handle image upload if file is present
    if (req.file) {
      try {
        const filePath = req.file.path;
        const uploadResult = await uploadToCloudinary(
          filePath,
          "continent_images"
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

    const continent = new Continent({
      name,
      description,
      image: image_url,
      countries: [],
    });

    await continent.save();

    res.status(201).json({
      success: true,
      data: continent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error adding continent",
      error: error.message,
    });
  }
};

export const editContinent = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    let image_url: string | undefined;

    // Validate continent ID
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Continent ID is required",
      });
      return;
    }

    // Find the continent
    const continent = await Continent.findById(id);
    if (!continent) {
      res.status(404).json({
        success: false,
        message: "Continent not found",
      });
      return;
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== continent.name) {
      const existingContinent = await Continent.findOne({ name });
      if (existingContinent) {
        res.status(400).json({
          success: false,
          message: "Continent with this name already exists",
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
          "continent_images"
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

    // Update fields only if provided
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (image_url) updateData.image = image_url;

    // Update the continent
    const updatedContinent = await Continent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedContinent,
      message: "Continent updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating continent",
      error: error.message,
    });
  }
};
export const deleteContinentById = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Continent ID is required",
      });
    }

    // Find the continent first to check if it exists
    const continent = await Continent.findById(id).session(session);
    
    if (!continent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Continent not found",
      });
    }

    // Find all countries in this continent
    const countries = await Country.find({ continent: id }).session(session);
    const countryIds = countries.map(country => country._id);
    
    // Find all cities in these countries
    const cities = await City.find({ country: { $in: countryIds } }).session(session);
    const cityIds = cities.map(city => city._id);
    
    // Find all activities in these cities
    const activities = await Activity.find({ city: { $in: cityIds } }).session(session);
    const activityIds = activities.map(activity => activity._id);
    
    // Delete all activity details related to these activities
    await ActivityDetail.deleteMany({ activityId: { $in: activityIds } }).session(session);
    
    // Delete all deals related to these activities
    await Deal.deleteMany({ activity: { $in: activityIds } }).session(session);
    
    // Delete all activities in these cities
    await Activity.deleteMany({ city: { $in: cityIds } }).session(session);
    
    // Delete all holiday packages with these cities as destinations
    await HolidayPackage.deleteMany({ destination: { $in: cityIds } }).session(session);
    
    // Delete all cities in these countries
    await City.deleteMany({ country: { $in: countryIds } }).session(session);
    
    // Delete all countries in this continent
    await Country.deleteMany({ continent: id }).session(session);
    
    // Finally delete the continent itself
    const deletedContinent = await Continent.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Continent and all related data successfully deleted",
      data: {
        continent: deletedContinent,
        deletedCounts: {
          countries: countryIds.length,
          cities: cityIds.length,
          activities: activityIds.length,
          activityDetails: await ActivityDetail.countDocuments({ activityId: { $in: activityIds } }),
          deals: await Deal.countDocuments({ activity: { $in: activityIds } }),
          holidayPackages: await HolidayPackage.countDocuments({ destination: { $in: cityIds } })
        }
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting continent",
      error: error.message,
    });
  }
};


export const getContinentById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Continent ID is required",
      });
    }

    const continent = await Continent.findById(id).populate({
      path: "countries",
      select: "name ",
    });
    
    if (!continent) {
      return res.status(404).json({
        success: false,
        message: "Continent not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: continent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching continent",
      error: error.message,
    });
  }
};