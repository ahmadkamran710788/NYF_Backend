// src/controllers/activityController.ts
import { Request, Response } from "express";
import { Activity, ActivityCategory } from "../models/Activity";
import { City } from "../models/City";
import { Country } from "../models/Country";
import { Continent } from "../models/Continent";
import {Deal} from '../models/Deal'
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
import {convertActivities,convertActivity} from "../services/currencyService"
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
    let { countryName, cityName, continentName, currency } = req.query;

    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';

    // Process comma-separated values for location parameters
    const countries = countryName ? String(countryName).split(',').filter(Boolean) : [];
    const cities = cityName ? String(cityName).split(',').filter(Boolean) : [];
    const continents = continentName ? String(continentName).split(',').filter(Boolean) : [];

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Location-based filtering
    if (continents.length > 0 || countries.length > 0 || cities.length > 0) {
      let cityIds: any[] = [];

      // Handle continent-based filtering
      if (continents.length > 0) {
        const regexPatterns = continents.map(
          name => new RegExp(String(name), "i")
        );
        
        const foundContinents = await Continent.find({
          name: { $in: regexPatterns },
        });

        if (foundContinents.length > 0) {
          const continentIds = foundContinents.map((continent) => continent._id);

          const foundCountries = await Country.find({
            continent: { $in: continentIds },
          });

          if (foundCountries.length > 0) {
            const countryIds = foundCountries.map((country) => country._id);
            
            const citiesFromContinents = await City.find({
              country: { $in: countryIds },
            });
            
            // Add found city IDs to our collection
            cityIds = [...cityIds, ...citiesFromContinents.map(city => city._id)];
          }
        }
      }

      // Handle country-based filtering
      if (countries.length > 0) {
        const regexPatterns = countries.map(
          name => new RegExp(String(name), "i")
        );
        
        const foundCountries = await Country.find({
          name: { $in: regexPatterns },
        });

        if (foundCountries.length > 0) {
          const countryIds = foundCountries.map((country) => country._id);
          
          const citiesFromCountries = await City.find({
            country: { $in: countryIds },
          });
          
          // Add found city IDs to our collection
          cityIds = [...cityIds, ...citiesFromCountries.map(city => city._id)];
        }
      }

      // Handle city-based filtering
      if (cities.length > 0) {
        const regexPatterns = cities.map(
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
          currency: targetCurrency.toUpperCase(),
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

    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalActivities / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      count: convertedActivities.length,
      data: convertedActivities,
      currency: targetCurrency.toUpperCase(),
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

export const getActivitiesWithoutPagination = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Basic filter from query parameters
    const filter = buildActivityFilter(req.query);
    let { countryName, cityName, continentName, currency } = req.query;

    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';

    // Process comma-separated values for location parameters
    const countries = countryName ? String(countryName).split(',').filter(Boolean) : [];
    const cities = cityName ? String(cityName).split(',').filter(Boolean) : [];
    const continents = continentName ? String(continentName).split(',').filter(Boolean) : [];

    // Location-based filtering
    if (continents.length > 0 || countries.length > 0 || cities.length > 0) {
      let cityIds: any[] = [];

      // Handle continent-based filtering
      if (continents.length > 0) {
        const regexPatterns = continents.map(
          name => new RegExp(String(name), "i")
        );
        
        const foundContinents = await Continent.find({
          name: { $in: regexPatterns },
        });

        if (foundContinents.length > 0) {
          const continentIds = foundContinents.map((continent) => continent._id);

          const foundCountries = await Country.find({
            continent: { $in: continentIds },
          });

          if (foundCountries.length > 0) {
            const countryIds = foundCountries.map((country) => country._id);
            
            const citiesFromContinents = await City.find({
              country: { $in: countryIds },
            });
            
            // Add found city IDs to our collection
            cityIds = [...cityIds, ...citiesFromContinents.map(city => city._id)];
          }
        }
      }

      // Handle country-based filtering
      if (countries.length > 0) {
        const regexPatterns = countries.map(
          name => new RegExp(String(name), "i")
        );
        
        const foundCountries = await Country.find({
          name: { $in: regexPatterns },
        });

        if (foundCountries.length > 0) {
          const countryIds = foundCountries.map((country) => country._id);
          
          const citiesFromCountries = await City.find({
            country: { $in: countryIds },
          });
          
          // Add found city IDs to our collection
          cityIds = [...cityIds, ...citiesFromCountries.map(city => city._id)];
        }
      }

      // Handle city-based filtering
      if (cities.length > 0) {
        const regexPatterns = cities.map(
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
          currency: targetCurrency.toUpperCase(),
        });
      }
    }

    // Get all activities with populated data without pagination
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
      .lean(); // Using lean() for better performance on read-only data

      console.log('Activities before conversation :', activities[8]);
    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);
       console.log('Activities after conversation :', convertedActivities[8]);
    return res.status(200).json({
      success: true,
      count: convertedActivities.length,
      data: convertedActivities,
      // currency: targetCurrency.toUpperCase(),
    });
  } catch (error: any) {
    console.error("Error in getActivitiesWithoutPagination:", error);
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
    const { currency } = req.query;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';
    
    // Add city filter
    filter.city = new mongoose.Types.ObjectId(cityId);

    const activities = await Activity.find(filter).skip(skip).limit(limit).lean();
    const total = await Activity.countDocuments(filter);

    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);

    res.status(200).json({
      success: true,
      count: convertedActivities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      currency: targetCurrency.toUpperCase(),
      data: convertedActivities,
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
    const { currency } = req.query;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';

    // Get all cities for this country
    const cities = await City.find({ country: countryId });
    const cityIds = cities.map((city) => city._id);

    // Add cities filter
    filter.city = { $in: cityIds };

    const activities = await Activity.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("city", "name")
      .lean();
    const total = await Activity.countDocuments(filter);

    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);

    res.status(200).json({
      success: true,
      count: convertedActivities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      currency: targetCurrency.toUpperCase(),
      data: convertedActivities,
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
    const { currency } = req.query;
    const filter = buildActivityFilter(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';
    
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
      })
      .lean();
    const total = await Activity.countDocuments(filter);

    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);
    
    res.status(200).json({
      success: true,
      count: convertedActivities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      currency: targetCurrency.toUpperCase(),
      data: convertedActivities,
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
    const { currency } = req.query;
    const filter = buildActivityFilter(req.query);

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';

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
      })
      .lean();

    const total = await Activity.countDocuments(filter);

    // Convert activities to target currency
    const convertedActivities = await convertActivities(activities, targetCurrency);

    res.status(200).json({
      success: true,
      count: convertedActivities.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      currency: targetCurrency.toUpperCase(),
      data: convertedActivities,
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
//       includes, // Array field for 'includes'
//       highlights, // Array field for 'highlights'
//       isInstantConfirmation,
//       isMobileTicket,
//       isRefundable,
//       costPrice, 
//       baseCurrency
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

//     // Make sure 'includes' and 'highlights' are arrays (if passed as strings, parse them)
//     const includesArray = Array.isArray(includes)
//       ? includes
//       : JSON.parse(includes || "[]");
//     const highlightsArray = Array.isArray(highlights)
//       ? highlights
//       : JSON.parse(highlights || "[]");

//     // Handle file uploads if present
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

//     // Create new activity (prices stored in AED)
//     const activity = new Activity({
//       name,
//       category,
//       city: cityId,
//       description,
//       images: imageUrls || [],
//       originalPrice,
//       discountPrice,
//       duration,
//       includes: includesArray, // Save as array
//       highlights: highlightsArray, // Save as array
//       isInstantConfirmation,
//       isMobileTicket,
//       isRefundable,
//       baseCurrency: baseCurrency || "AED",
//       costPrice: costPrice // Always store in AED
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
      includes, // Now a string field
      highlights, // Array field for 'highlights'
      isInstantConfirmation,
      isMobileTicket,
      isRefundable,
      costPrice, 
      baseCurrency
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

    // Make sure 'highlights' is an array (if passed as string, parse it)
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

    // Create new activity (prices stored in AED)
    const activity = new Activity({
      name,
      category,
      city: cityId,
      description,
      images: imageUrls || [],
      originalPrice,
      discountPrice,
      duration,
      includes: includes, // Save as string
      highlights: highlightsArray, // Save as array
      isInstantConfirmation,
      isMobileTicket,
      isRefundable,
      baseCurrency: baseCurrency || "AED",
      costPrice: costPrice // Always store in AED
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

// export const editActivity = async (
//   req: MulterRequest,
//   res: Response
// ): Promise<any> => {
//   console.log(1)
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
//       removeImages, // Array of image URLs to remove
//       costPrice,
//       baseCurrency
//     } = req.body;
//     const activityId = req.params.id;

//     // Check if the activity exists
//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found",
//       });
//     }

    
// console.log(req.body)
//     // If changing city, validate that the new city exists
//     let city;
//     if (cityId && cityId !== activity.city.toString()) {
//       city = await City.findById(cityId);
//       if (!city) {
//         return res.status(404).json({
//           success: false,
//           message: "City not found",
//         });
//       }
//     }

//     // Validate category if provided
//     if (
//       category &&
//       !Object.values(ActivityCategory).includes(category as ActivityCategory)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category",
//       });
//     }

//     // Parse arrays if they come as strings
//     const includesArray = includes
//       ? Array.isArray(includes)
//         ? includes
//         : JSON.parse(includes)
//       : undefined;

//     const highlightsArray = highlights
//       ? Array.isArray(highlights)
//         ? highlights
//         : JSON.parse(highlights)
//       : undefined;

//     const removeImagesArray = removeImages
//       ? Array.isArray(removeImages)
//         ? removeImages
//         : JSON.parse(removeImages)
//       : [];

//     // Current images excluding the ones marked for removal
//     let currentImages = activity.images.filter(
//       (img) => !removeImagesArray.includes(img)
//     );

//     // Handle new file uploads if present
//     if (req.files && Array.isArray(req.files)) {
//       for (const file of req.files as Express.Multer.File[]) {
//         try {
//           const uploadResult = await uploadToCloudinary(
//             file.path,
//             "activity_images"
//           );
//           currentImages.push(uploadResult.url);
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

//     // Prepare update object with only the fields that are provided
//     const updateData: any = {};
//     if (name !== undefined) updateData.name = name;
//     if (category !== undefined) updateData.category = category;
//     if (cityId !== undefined) updateData.city = cityId;
//     if (description !== undefined) updateData.description = description;
//     if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
//     if (discountPrice !== undefined) updateData.discountPrice = discountPrice;
//     if (duration !== undefined) updateData.duration = duration;
//     if (includesArray !== undefined) updateData.includes = includesArray;
//     if (highlightsArray !== undefined) updateData.highlights = highlightsArray;
//     if (isInstantConfirmation !== undefined) updateData.isInstantConfirmation = isInstantConfirmation;
//     if (isMobileTicket !== undefined) updateData.isMobileTicket = isMobileTicket;
//     if (isRefundable !== undefined) updateData.isRefundable = isRefundable;
//     if (costPrice !== undefined) updateData.costPrice = costPrice;
//     if(baseCurrency !== undefined) updateData.baseCurrency = baseCurrency
    
//     // Always update images if we processed any add/remove operations
//     updateData.images = currentImages;

//     // Update the activity with the new data
//     const updatedActivity = await Activity.findByIdAndUpdate(
//       activityId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     // If city changed, update city references
//     if (cityId && cityId !== activity.city.toString()) {
//       // Remove activity from old city
//       await City.findByIdAndUpdate(activity.city, {
//         $pull: { activities: activity._id },
//       });

//       // Add activity to new city
//       await City.findByIdAndUpdate(cityId, {
//         $push: { activities: activity._id },
//       });
//     }

//     // Return the updated activity
//     res.status(200).json({
//       success: true,
//       data: updatedActivity,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: "Error updating activity",
//       error: error.message,
//     });
//   }
// };




export const editActivity = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  console.log(1)
  try {
    const {
      name,
      category,
      cityId,
      description,
      originalPrice,
      discountPrice,
      duration,
      includes,
      highlights,
      isInstantConfirmation,
      isMobileTicket,
      isRefundable,
      removeImages, // Array of image URLs to remove
      costPrice,
      baseCurrency
    } = req.body;
    const activityId = req.params.id;

    // Check if the activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    
console.log(req.body)
    // If changing city, validate that the new city exists
    let city;
    if (cityId && cityId !== activity.city.toString()) {
      city = await City.findById(cityId);
      if (!city) {
        return res.status(404).json({
          success: false,
          message: "City not found",
        });
      }
    }

    // Validate category if provided
    if (
      category &&
      !Object.values(ActivityCategory).includes(category as ActivityCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Parse highlights array if it comes as string
    const highlightsArray = highlights
      ? Array.isArray(highlights)
        ? highlights
        : JSON.parse(highlights)
      : undefined;

    const removeImagesArray = removeImages
      ? Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages)
      : [];

    // Current images excluding the ones marked for removal
    let currentImages = activity.images.filter(
      (img) => !removeImagesArray.includes(img)
    );

    // Handle new file uploads if present
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const uploadResult = await uploadToCloudinary(
            file.path,
            "activity_images"
          );
          currentImages.push(uploadResult.url);
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

    // Prepare update object with only the fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (cityId !== undefined) updateData.city = cityId;
    if (description !== undefined) updateData.description = description;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice;
    if (duration !== undefined) updateData.duration = duration;
    if (includes !== undefined) updateData.includes = includes;
    if (highlightsArray !== undefined) updateData.highlights = highlightsArray;
    if (isInstantConfirmation !== undefined) updateData.isInstantConfirmation = isInstantConfirmation;
    if (isMobileTicket !== undefined) updateData.isMobileTicket = isMobileTicket;
    if (isRefundable !== undefined) updateData.isRefundable = isRefundable;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if(baseCurrency !== undefined) updateData.baseCurrency = baseCurrency
    
    // Always update images if we processed any add/remove operations
    updateData.images = currentImages;

    // Update the activity with the new data
    const updatedActivity = await Activity.findByIdAndUpdate(
      activityId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If city changed, update city references
    if (cityId && cityId !== activity.city.toString()) {
      // Remove activity from old city
      await City.findByIdAndUpdate(activity.city, {
        $pull: { activities: activity._id },
      });

      // Add activity to new city
      await City.findByIdAndUpdate(cityId, {
        $push: { activities: activity._id },
      });
    }

    // Return the updated activity
    res.status(200).json({
      success: true,
      data: updatedActivity,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating activity",
      error: error.message,
    });
  }
};
// export const editActivity = async (

//   req: MulterRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const activityId = req.params.id;
//     console.log("Request to edit activity:", activityId);
//     console.log("Request body:", req.body); // Log the complete request body
    
//     // Check if the activity exists
//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found",
//       });
//     }
   
//     // Extract fields from request body with explicit checks for existence
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
//       removeImages,
//     } = req.body;
    
//     console.log( name,category,
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
//       removeImages)
//     console.log("Name from request:", name);
//     console.log("Type of name:", typeof name);
    
//     // Initialize update object
//     const updateData: any = {};
    
//     // Handle text fields with strict checks
//     if (name !== undefined && name !== null) {
//       console.log("Setting name to:", name);
//       updateData.name = name.toString(); // Ensure it's a string
//     }
    
//     if (category !== undefined && category !== null) updateData.category = category;
//     if (cityId !== undefined && cityId !== null) updateData.city = cityId;
//     if (description !== undefined && description !== null) updateData.description = description;
    
//     // Handle numeric fields
//     if (originalPrice !== undefined && originalPrice !== null) {
//       updateData.originalPrice = Number(originalPrice);
//     }
    
//     if (discountPrice !== undefined && discountPrice !== null) {
//       updateData.discountPrice = Number(discountPrice);
//     }
    
//     if (duration !== undefined && duration !== null) updateData.duration = duration;
    
//     // Handle boolean fields
//     if (isInstantConfirmation !== undefined && isInstantConfirmation !== null) {
//       updateData.isInstantConfirmation = isInstantConfirmation === 'true' || isInstantConfirmation === true;
//     }
    
//     if (isMobileTicket !== undefined && isMobileTicket !== null) {
//       updateData.isMobileTicket = isMobileTicket === 'true' || isMobileTicket === true;
//     }
    
//     if (isRefundable !== undefined && isRefundable !== null) {
//       updateData.isRefundable = isRefundable === 'true' || isRefundable === true;
//     }
    
//     // Handle array fields
//     if (includes !== undefined && includes !== null) {
//       try {
//         updateData.includes = Array.isArray(includes) ? includes : JSON.parse(includes || "[]");
//       } catch (e) {
//         console.error("Error parsing includes:", e);
//         return res.status(400).json({
//           success: false,
//           message: "Error parsing includes array",
//         });
//       }
//     }
    
//     if (highlights !== undefined && highlights !== null) {
//       try {
//         updateData.highlights = Array.isArray(highlights) ? highlights : JSON.parse(highlights || "[]");
//       } catch (e) {
//         console.error("Error parsing highlights:", e);
//         return res.status(400).json({
//           success: false,
//           message: "Error parsing highlights array",
//         });
//       }
//     }
    
//     // Handle image updates
//     let currentImages = [...activity.images];
//     let imagesChanged = false;
    
//     if (removeImages !== undefined && removeImages !== null) {
//       try {
//         const removeImagesArray = Array.isArray(removeImages) 
//           ? removeImages 
//           : JSON.parse(removeImages);
        
//         currentImages = currentImages.filter(img => !removeImagesArray.includes(img));
//         imagesChanged = true;
//       } catch (e) {
//         console.error("Error parsing removeImages:", e);
//         return res.status(400).json({
//           success: false,
//           message: "Error parsing removeImages array",
//         });
//       }
//     }
    
//     // Handle file uploads
//     if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//       for (const file of req.files as Express.Multer.File[]) {
//         try {
//           const uploadResult = await uploadToCloudinary(
//             file.path,
//             "activity_images"
//           );
//           currentImages.push(uploadResult.url);
//           imagesChanged = true;
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
    
//     if (imagesChanged) {
//       updateData.images = currentImages;
//     }
    
//     console.log("Final update data:", updateData);
//     console.log("Update data keys:", Object.keys(updateData));
    
//     // Check if there's anything to update
//     if (Object.keys(updateData).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No fields provided for update",
//       });
//     }
    
//     // Validate category if it's being updated
//     if (updateData.category && !Object.values(ActivityCategory).includes(updateData.category as ActivityCategory)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category",
//       });
//     }
    
//     // Validate city if it's being updated
//     if (updateData.city && updateData.city !== activity.city.toString()) {
//       const city = await City.findById(updateData.city);
//       if (!city) {
//         return res.status(404).json({
//           success: false,
//           message: "City not found",
//         });
//       }
//     }
    
//     // Update the activity
//     console.log(`Attempting to update activity ${activityId} with data:`, updateData);
    
//     const updatedActivity = await Activity.findByIdAndUpdate(
//       activityId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );
    
//     if (!updatedActivity) {
//       console.log("Update operation returned null");
//       return res.status(500).json({
//         success: false,
//         message: "Activity update failed",
//       });
//     }
    
//     console.log("Updated activity:", updatedActivity);
    
//     // Update city references if city changed
//     if (updateData.city && updateData.city !== activity.city.toString()) {
//       // Remove activity from old city
//       await City.findByIdAndUpdate(activity.city, {
//         $pull: { activities: activity._id },
//       });
      
//       // Add activity to new city
//       await City.findByIdAndUpdate(updateData.city, {
//         $push: { activities: activity._id },
//       });
//     }
    
//     // Return the updated activity
//     res.status(200).json({
//       success: true,
//       data: updatedActivity,
//       message: "Activity updated successfully",
//     });
//   } catch (error: any) {
//     console.error("Error in editActivity:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating activity",
//       error: error.message,
//       stack: error.stack,
//     });
//   }
// };

export const getActivityById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const activityId = req.params.id;
    const { currency } = req.query;

    // Get target currency (default to AED)
    const targetCurrency = (currency as string) || 'AED';

    const activity = await Activity.findById(activityId)
      .populate("city")
      .lean(); // Using lean() for better performance

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Convert activity to target currency
    const convertedActivity = await convertActivity(activity, targetCurrency);

    res.status(200).json({
      success: true,
      data: convertedActivity,
      currency: targetCurrency.toUpperCase(),
    });
  } catch (error: any) {
    console.error("Error in getActivityById:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity",
      error: error.message,
    });
  }
};

export const deleteActivityById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const activityId = req.params.id;

    // Find the activity
    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const deletedDeals = await Deal.deleteMany({ activity: activityId });
    console.log(`Deleted ${deletedDeals.deletedCount} deals associated with activity ${activityId}`);

    // Delete the activity
    await Activity.findByIdAndDelete(activityId);

    // Remove reference from the city
    await City.findByIdAndUpdate(activity.city, {
      $pull: { activities: activity._id },
    });

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting activity",
      error: error.message,
    });
  }
};

