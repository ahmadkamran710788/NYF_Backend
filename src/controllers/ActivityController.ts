// src/controllers/activityController.ts
import { Request, Response } from "express";
import { Activity, ActivityCategory } from "../models/Activity";
import { City } from "../models/City";
import { Country } from "../models/Country";
import { Continent } from "../models/Continent";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
// Helper function to build filter based on query params
const buildActivityFilter = (query: any) => {
  const filter: any = {};

  // Category filter
  if (query.categories) {
    const categories = Array.isArray(query.categories)
      ? query.categories
      : [query.categories];

    filter.category = { $in: categories };
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filter.discountPrice = {};

    if (query.minPrice) {
      filter.discountPrice.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filter.discountPrice.$lte = Number(query.maxPrice);
    }
  }

  return filter;
};

export const getAllCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Get all categories as an array from the enum
    const categories = Object.values(ActivityCategory);

    // Return the categories
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
export const getAllActivities = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Basic filter from query parameters
    const filter = buildActivityFilter(req.query);
    let { countryName, cityName, continentName } = req.query;

    // Convert single value params to arrays for consistent handling
    if (countryName && !Array.isArray(countryName)) countryName = [countryName as string];
    if (cityName && !Array.isArray(cityName)) cityName = [cityName as string];
    if (continentName && !Array.isArray(continentName)) continentName = [continentName as string];

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Location-based filtering
    if (continentName || countryName || cityName) {
      let cityQuery: any = {};
      let cityIds: any[] = [];

      // Handle continent-based filtering
      if (continentName && Array.isArray(continentName) && continentName.length > 0) {
        const regexPatterns = (continentName as string[]).map(
          name => new RegExp(String(name), "i")
        );
        
        const continents = await Continent.find({
          name: { $in: regexPatterns },
        });

        if (continents.length > 0) {
          const continentIds = continents.map((continent) => continent._id);

          const countries = await Country.find({
            continent: { $in: continentIds },
          });

          if (countries.length > 0) {
            const countryIds = countries.map((country) => country._id);
            
            const citiesFromContinents = await City.find({
              country: { $in: countryIds },
            });
            
            // Add found city IDs to our collection
            cityIds = [...cityIds, ...citiesFromContinents.map(city => city._id)];
          }
        }
      }

      // Handle country-based filtering
      if (countryName && Array.isArray(countryName) && countryName.length > 0) {
        const regexPatterns = (countryName as string[]).map(
          name => new RegExp(String(name), "i")
        );
        
        const countries = await Country.find({
          name: { $in: regexPatterns },
        });

        if (countries.length > 0) {
          const countryIds = countries.map((country) => country._id);
          
          const citiesFromCountries = await City.find({
            country: { $in: countryIds },
          });
          
          // Add found city IDs to our collection
          cityIds = [...cityIds, ...citiesFromCountries.map(city => city._id)];
        }
      }

      // Handle city-based filtering
      if (cityName && Array.isArray(cityName) && cityName.length > 0) {
        const regexPatterns = (cityName as string[]).map(
          name => new RegExp(String(name), "i")
        );
        
        const citiesDirectMatch = await City.find({
          name: { $in: regexPatterns },
        });
        
        // Add found city IDs to our collection
        cityIds = [...cityIds, ...citiesDirectMatch.map(city => city._id)];
      }

      // Remove duplicates from cityIds
      cityIds = [...new Set(cityIds)];

      // If we have matching cities, add to filter
      if (cityIds.length > 0) {
        filter.city = { $in: cityIds };
      } else {
        // No matching cities found, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }
    }

    // Get total count for pagination metadata
    const totalActivities = await Activity.countDocuments(filter);

    // Get paginated results with populated data
    const activities = await Activity.find(filter)
      .populate({
        path: "city",
        select: "name country",
        populate: {
          path: "country",
          select: "name continent",
          populate: {
            path: "continent",
            select: "name",
          },
        },
      })
      .skip(skip)
      .limit(limit)
      .lean(); // Using lean() for better performance on read-only data

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalActivities / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
      pagination: {
        totalItems: totalActivities,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error: any) {
    console.error("Error in getAllActivities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching activities",
      error: error.message,
    });
  }
};
// Get activities by city with filtering
export const getActivitiesByCity = async (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    // Add city filter
    filter.city = new mongoose.Types.ObjectId(cityId);

    const activities = await Activity.find(filter).skip(skip).limit(limit);

    const total = await Activity.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: activities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching activities by city",
      error: error.message,
    });
  }
};

// Get activities by country with filtering
export const getActivitiesByCountry = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.params;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all cities for this country
    const cities = await City.find({ country: countryId });
    const cityIds = cities.map((city) => city._id);

    // Add cities filter
    filter.city = { $in: cityIds };

    const activities = await Activity.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("city", "name");
    const total = await Activity.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: activities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching activities by country",
      error: error.message,
    });
  }
};

// Get activities by continent with filtering
export const getActivitiesByContinent = async (req: Request, res: Response) => {
  try {
    const { continentId } = req.params;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    // Get countries in this continent
    const countries = await Country.find({ continent: continentId });

    // Get cities in these countries
    const cities = await City.find({
      country: { $in: countries.map((country) => country._id) },
    });

    // Add cities filter
    filter.city = { $in: cities.map((city) => city._id) };

    const activities = await Activity.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "city",
        select: "name country",
        populate: {
          path: "country",
          select: "name",
        },
      });
    const total = await Activity.countDocuments(filter);
    res.status(200).json({
      success: true,
      count: activities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: activities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching activities by continent",
      error: error.message,
    });
  }
};

// Get activities by category with filtering
export const getActivitiesByCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { category } = req.params;
    const filter = buildActivityFilter(req.query);

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Validate category
    if (
      !Object.values(ActivityCategory).includes(category as ActivityCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Add category filter
    filter.category = category;

    const activities = await Activity.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "city",
        select: "name country",
        populate: {
          path: "country",
          select: "name continent",
          populate: {
            path: "continent",
            select: "name",
          },
        },
      });

    const total = await Activity.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: activities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching activities by category",
      error: error.message,
    });
  }
};

// Add a new activity
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
// export const addActivity = async (
//   req: MulterRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const {
//       name,
//       category,
//       cityId,
//       description,
//       originalPrice,
//       discountPrice,
//       duration,
//       includes,
//       highlights,
//       isInstantConfirmation,
//       isMobileTicket,
//       isRefundable,
//     } = req.body;

//     // Validate city exists
//     const city = await City.findById(cityId);

//     if (!city) {
//       return res.status(404).json({
//         success: false,
//         message: "City not found",
//       });
//     }

//     let imageUrls: string[] = [];

//     // Validate category
//     if (
//       !Object.values(ActivityCategory).includes(category as ActivityCategory)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category",
//       });
//     }

//     if (req.files && Array.isArray(req.files)) {
//       for (const file of req.files as Express.Multer.File[]) {
//         try {
//           const uploadResult = await uploadToCloudinary(
//             file.path,
//             "activity_images"
//           );
//           imageUrls.push(uploadResult.url);
//         } catch (uploadError: any) {
//           console.error("Error uploading image:", uploadError);
//           return res.status(400).json({
//             success: false,
//             message: "Error uploading image",
//             error: uploadError.message,
//           });
//         }
//       }
//     }

//     // Create new activity
//     const activity = new Activity({
//       name,
//       category,
//       city: cityId,
//       description,
//       images: imageUrls || [],
//       originalPrice,
//       discountPrice,
//       duration,
//       includes: includes || [],
//       highlights: highlights || [],
//       isInstantConfirmation: isInstantConfirmation || false,
//       isMobileTicket: isMobileTicket || false,
//       isRefundable: isRefundable || false,
//     });

//     await activity.save();

//     // Update city with the new activity
//     await City.findByIdAndUpdate(cityId, {
//       $push: { activities: activity._id },
//     });

//     res.status(201).json({
//       success: true,
//       data: activity,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: "Error adding activity",
//       error: error.message,
//     });
//   }
// };

export const addActivity = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const {
      name,
      category,
      cityId,
      description,
      originalPrice,
      discountPrice,
      duration,
      includes, // Array field for 'includes'
      highlights, // Array field for 'highlights'
      isInstantConfirmation,
      isMobileTicket,
      isRefundable,
    } = req.body;

    // Validate city exists
    const city = await City.findById(cityId);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    let imageUrls: string[] = [];

    // Validate category
    if (
      !Object.values(ActivityCategory).includes(category as ActivityCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Make sure 'includes' and 'highlights' are arrays (if passed as strings, parse them)
    const includesArray = Array.isArray(includes)
      ? includes
      : JSON.parse(includes || "[]");
    const highlightsArray = Array.isArray(highlights)
      ? highlights
      : JSON.parse(highlights || "[]");

    // Handle file uploads if present
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const uploadResult = await uploadToCloudinary(
            file.path,
            "activity_images"
          );
          imageUrls.push(uploadResult.url);
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError);
          return res.status(400).json({
            success: false,
            message: "Error uploading image",
            error: uploadError.message,
          });
        }
      }
    }

    // Create new activity
    const activity = new Activity({
      name,
      category,
      city: cityId,
      description,
      images: imageUrls || [],
      originalPrice,
      discountPrice,
      duration,
      includes: includesArray, // Save as array
      highlights: highlightsArray, // Save as array
      isInstantConfirmation,
      isMobileTicket,
      isRefundable,
    });

    await activity.save();

    // Update city with the new activity
    await City.findByIdAndUpdate(cityId, {
      $push: { activities: activity._id },
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error adding activity",
      error: error.message,
    });
  }
};
