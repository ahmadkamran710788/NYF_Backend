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
export const getAllActivities = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Basic filter from query parameters
    const filter = buildActivityFilter(req.query);
    const { countryName, cityName, continentName } = req.query;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Location-based filtering
    if (continentName || countryName || cityName) {
      let cityQuery = {};

      if (continentName) {
        // Find cities through continent -> country -> city hierarchy
        const continents = await Continent.find({
          name: { $regex: new RegExp(String(continentName), "i") },
        });

        if (continents.length > 0) {
          const continentIds = continents.map((continent) => continent._id);

          const countries = await Country.find({
            continent: { $in: continentIds },
          });

          if (countries.length > 0) {
            const countryIds = countries.map((country) => country._id);
            cityQuery = { country: { $in: countryIds } };
          } else {
            // No matching countries found, return empty result
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
        } else {
          // No matching continents found, return empty result
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
      } else if (countryName) {
        // Find cities through country -> city hierarchy
        const countries = await Country.find({
          name: { $regex: new RegExp(String(countryName), "i") },
        });

        if (countries.length > 0) {
          const countryIds = countries.map((country) => country._id);
          cityQuery = { country: { $in: countryIds } };
        } else {
          // No matching countries found, return empty result
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
      } else if (cityName) {
        // Direct city filter
        cityQuery = { name: { $regex: new RegExp(String(cityName), "i") } };
      }

      // Get matching city IDs
      const cities = await City.find(cityQuery);

      if (cities.length > 0) {
        const cityIds = cities.map((city) => city._id);
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

    // Add city filter
    filter.city = new mongoose.Types.ObjectId(cityId);

    const activities = await Activity.find(filter);

    res.status(200).json({
      success: true,
      count: activities.length,
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

    // Get all cities for this country
    const cities = await City.find({ country: countryId });
    const cityIds = cities.map((city) => city._id);

    // Add cities filter
    filter.city = { $in: cityIds };

    const activities = await Activity.find(filter).populate("city", "name");

    res.status(200).json({
      success: true,
      count: activities.length,
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

    // Get countries in this continent
    const countries = await Country.find({ continent: continentId });

    // Get cities in these countries
    const cities = await City.find({
      country: { $in: countries.map((country) => country._id) },
    });

    // Add cities filter
    filter.city = { $in: cities.map((city) => city._id) };

    const activities = await Activity.find(filter).populate({
      path: "city",
      select: "name country",
      populate: {
        path: "country",
        select: "name",
      },
    });

    res.status(200).json({
      success: true,
      count: activities.length,
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

    const activities = await Activity.find(filter).populate({
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

    res.status(200).json({
      success: true,
      count: activities.length,
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
