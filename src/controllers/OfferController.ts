import { Request, Response } from "express";
import { ComboOffer, IComboOffer } from "../models/Offer";
import { Activity } from "../models/Activity";
import {
  convertComboOfferWithCleanResponse,
  convertComboOffersWithCleanResponse,
  formatComboOfferPricing,
  isValidCurrency,
} from "../services/offerExchangeService";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";

/**
 * Get all combo offers with pagination and filtering
 */
export const getAllComboOffers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      country,
      city,
      category,
      isActive = true,
      isPopular,
      currency = "AED",
    } = req.query;

    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (isPopular !== undefined) {
      filter.isPopular = isPopular === "true";
    }
    if (country) {
      filter.country = country;
    }
    if (city) {
      filter.city = city;
    }
    if (category) {
      filter.category = { $in: Array.isArray(category) ? category : [category] };
    }

    const isValidCurr = await isValidCurrency(currency as string);
    if (!isValidCurr) {
      res.status(400).json({ error: `Invalid currency: ${currency}` });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await ComboOffer.countDocuments(filter);

    const comboOffers = await ComboOffer.find(filter)
      .populate("activities.tour", "name category description images")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const convertedOffers = await convertComboOffersWithCleanResponse(
      comboOffers,
      currency as string,
      "AED"
    );

    res.status(200).json({
      success: true,
      data: convertedOffers.data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
      currencyInfo: convertedOffers.currencyInfo,
    });
  } catch (error: any) {
    console.error("Error fetching combo offers:", error);
    res.status(500).json({
      error: "Failed to fetch combo offers",
      message: error.message,
    });
  }
};

/**
 * Get a single combo offer by ID
 */
export const getComboOfferById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { currency = "AED" } = req.query;

    const isValidCurr = await isValidCurrency(currency as string);
    if (!isValidCurr) {
      res.status(400).json({ error: `Invalid currency: ${currency}` });
      return;
    }

    const comboOffer = await ComboOffer.findById(id).populate(
      "activities.tour",
      "name category description images"
    );

    if (!comboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    const convertedOffer = await convertComboOfferWithCleanResponse(
      comboOffer,
      currency as string,
      comboOffer.baseCurrency
    );

    res.status(200).json({
      success: true,
      data: convertedOffer,
    });
  } catch (error: any) {
    console.error("Error fetching combo offer:", error);
    res.status(500).json({
      error: "Failed to fetch combo offer",
      message: error.message,
    });
  }
};

/**
 * Get combo offer by permalink
 */
export const getComboOfferByPermalink = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { permalink } = req.params;
    const { currency = "AED" } = req.query;

    const isValidCurr = await isValidCurrency(currency as string);
    if (!isValidCurr) {
      res.status(400).json({ error: `Invalid currency: ${currency}` });
      return;
    }

    const comboOffer = await ComboOffer.findOne({ permalink }).populate(
      "activities.tour",
      "name category description images"
    );

    if (!comboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    const convertedOffer = await convertComboOfferWithCleanResponse(
      comboOffer,
      currency as string,
      comboOffer.baseCurrency
    );

    res.status(200).json({
      success: true,
      data: convertedOffer,
    });
  } catch (error: any) {
    console.error("Error fetching combo offer:", error);
    res.status(500).json({
      error: "Failed to fetch combo offer",
      message: error.message,
    });
  }
};

/**
 * Create a new combo offer
 */
export const createComboOffer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      permalink,
      headerCaption,
      isPopular,
      isActive,
      shortDescription,
      description,
      highlights,
      inclusions,
      exclusions,
      addonExtra,
      childAdultPolicy,
      notSuitableFor,
      pickupTimeDropOffTime,
      openingHours,
      location,
      startingEndPoint,
      termsConditions,
      thingsToKnow,
      dressCode,
      howTo,
      bookingCutOffTime,
      howToRedeem,
      cancellationPolicy,
      attributes,
      seoContent,
      category,
      comboCurrency,
      baseCurrency,
      comboDiscount,
      comboDiscountType,
      country,
      city,
      activities,
      actualPrice,
      discountedPrice,
      costPrice,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !permalink ||
      !country ||
      !city ||
      !activities ||
      activities.length === 0 ||
      actualPrice === undefined ||
      discountedPrice === undefined
    ) {
      res.status(400).json({
        error:
          "Missing required fields: name, permalink, country, city, actualPrice, discountedPrice, and at least one activity",
      });
      return;
    }

    // Validate price logic
    if (parseFloat(discountedPrice) > parseFloat(actualPrice)) {
      res.status(400).json({
        error: "Discounted price cannot be greater than actual price",
      });
      return;
    }

    // Validate activities
    let validActivities = activities;
    if (typeof activities === "string") {
      try {
        validActivities = JSON.parse(activities);
      } catch (e) {
        res.status(400).json({ error: "Invalid activities format" });
        return;
      }
    }

    await Promise.all(
      validActivities.map(async (activity: any) => {
        const tourExists = await Activity.findById(activity.tour);
        if (!tourExists) {
          throw new Error(`Activity with ID ${activity.tour} does not exist`);
        }
      })
    );

    // Handle multiple image uploads
    const uploadedImages: string[] = [];
    let featuredImage = undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
        const uploadResult = await uploadToCloudinary(
          imageFile.path,
          "combo-offers"
        );
        uploadedImages.push(uploadResult.url);

        if (i === 0) {
          featuredImage = uploadResult.url;
        }
      }
    }

    // Parse arrays if they're strings
    let parsedHighlights = highlights;
    let parsedInclusions = inclusions;
    let parsedExclusions = exclusions;
    let parsedCategory = category;
    let parsedAttributes = attributes;

    if (typeof highlights === "string") {
      try {
        parsedHighlights = JSON.parse(highlights);
      } catch (e) {
        parsedHighlights = [];
      }
    }
    if (typeof inclusions === "string") {
      try {
        parsedInclusions = JSON.parse(inclusions);
      } catch (e) {
        parsedInclusions = [];
      }
    }
    if (typeof exclusions === "string") {
      try {
        parsedExclusions = JSON.parse(exclusions);
      } catch (e) {
        parsedExclusions = [];
      }
    }
    if (typeof category === "string") {
      try {
        parsedCategory = JSON.parse(category);
      } catch (e) {
        parsedCategory = [];
      }
    }
    if (typeof attributes === "string") {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (e) {
        parsedAttributes = [];
      }
    }

    // Parse SEO content if it's a string
    let parsedSeoContent = seoContent;
    if (typeof seoContent === "string") {
      try {
        parsedSeoContent = JSON.parse(seoContent);
      } catch (e) {
        parsedSeoContent = undefined;
      }
    }

    // Create new combo offer
    const newComboOffer = new ComboOffer({
      name,
      permalink: permalink.toLowerCase().trim(),
      headerCaption,
      isPopular: isPopular === "true" || isPopular === true,
      isActive: isActive !== "false" && isActive !== false,
      shortDescription,
      description,
      highlights: parsedHighlights || [],
      inclusions: parsedInclusions || [],
      exclusions: parsedExclusions || [],
      addonExtra,
      childAdultPolicy,
      notSuitableFor,
      pickupTimeDropOffTime,
      openingHours,
      location,
      startingEndPoint,
      termsConditions,
      thingsToKnow,
      dressCode,
      howTo,
      bookingCutOffTime,
      howToRedeem,
      cancellationPolicy,
      attributes: parsedAttributes || [],
      seoContent: parsedSeoContent,
      category: parsedCategory || [],
      comboCurrency: (comboCurrency || "AED").toUpperCase(),
      baseCurrency: (baseCurrency || "AED").toUpperCase(),
      comboDiscount: parseFloat(comboDiscount) || 0,
      comboDiscountType: comboDiscountType || "percentage",
      country,
      city,
      activities: validActivities,
      actualPrice: parseFloat(actualPrice),
      discountedPrice: parseFloat(discountedPrice),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      featuredImage,
      images: uploadedImages,
    });

    // Save to database
    const savedComboOffer = await newComboOffer.save();
    await savedComboOffer.populate("activities.tour", "name category description");

    // Convert to clean response
    const convertedOffer = await convertComboOfferWithCleanResponse(
      savedComboOffer,
      baseCurrency || "AED"
    );

    res.status(201).json({
      success: true,
      message: "Combo offer created successfully",
      data: convertedOffer,
    });
  } catch (error: any) {
    console.error("Error creating combo offer:", error);
    res.status(400).json({
      error: "Failed to create combo offer",
      message: error.message,
    });
  }
};

/**
 * Update combo offer
 */
// export const updateComboOffer = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Find combo offer
//     const comboOffer = await ComboOffer.findById(id);
//     if (!comboOffer) {
//       res.status(404).json({ error: "Combo offer not found" });
//       return;
//     }

//     // Validate price logic if prices are being updated
//     if (
//       updateData.discountedPrice !== undefined &&
//       updateData.actualPrice !== undefined
//     ) {
//       if (parseFloat(updateData.discountedPrice) > parseFloat(updateData.actualPrice)) {
//         res.status(400).json({
//           error: "Discounted price cannot be greater than actual price",
//         });
//         return;
//       }
//     } else if (updateData.discountedPrice !== undefined) {
//       const actualPrice = parseFloat(updateData.actualPrice || comboOffer.actualPrice);
//       if (parseFloat(updateData.discountedPrice) > actualPrice) {
//         res.status(400).json({
//           error: "Discounted price cannot be greater than actual price",
//         });
//         return;
//       }
//     }

//     // Validate activities if provided
//     if (updateData.activities && Array.isArray(updateData.activities)) {
//       await Promise.all(
//         updateData.activities.map(async (activity: any) => {
//           const tourExists = await Activity.findById(activity.tour);
//           if (!tourExists) {
//             throw new Error(`Activity with ID ${activity.tour} does not exist`);
//           }
//         })
//       );
//     }

//     // Handle multiple image uploads
//     if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//       const uploadedImages: string[] = [];

//       for (let i = 0; i < req.files.length; i++) {
//         const imageFile = req.files[i];
//         const uploadResult = await uploadToCloudinary(
//           imageFile.path,
//           "combo-offers"
//         );
//         uploadedImages.push(uploadResult.url);

//         if (i === 0) {
//           updateData.featuredImage = uploadResult.url;
//         }
//       }

//       updateData.images = uploadedImages;
//     }

//     // Normalize currency codes
//     if (updateData.comboCurrency) {
//       updateData.comboCurrency = updateData.comboCurrency.toUpperCase();
//     }
//     if (updateData.baseCurrency) {
//       updateData.baseCurrency = updateData.baseCurrency.toUpperCase();
//     }

//     // Parse numeric fields if provided
//     if (updateData.actualPrice !== undefined) {
//       updateData.actualPrice = parseFloat(updateData.actualPrice);
//     }
//     if (updateData.discountedPrice !== undefined) {
//       updateData.discountedPrice = parseFloat(updateData.discountedPrice);
//     }
//     if (updateData.costPrice !== undefined) {
//       updateData.costPrice = parseFloat(updateData.costPrice);
//     }

//     // Update combo offer
//     const updatedComboOffer = await ComboOffer.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     }).populate("activities.tour", "name category description");

//     if (!updatedComboOffer) {
//       res.status(404).json({ error: "Combo offer not found" });
//       return;
//     }

//     // Convert to clean response
//     const convertedOffer = await convertComboOfferWithCleanResponse(
//       updatedComboOffer,
//       updatedComboOffer.baseCurrency
//     );

//     res.status(200).json({
//       success: true,
//       message: "Combo offer updated successfully",
//       data: convertedOffer,
//     });
//   } catch (error: any) {
//     console.error("Error updating combo offer:", error);
//     res.status(400).json({
//       error: "Failed to update combo offer",
//       message: error.message,
//     });
//   }
// };


// export const updateComboOffer = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Find combo offer
//     const comboOffer = await ComboOffer.findById(id);
//     if (!comboOffer) {
//       res.status(404).json({ error: "Combo offer not found" });
//       return;
//     }

//     // Validate price logic if prices are being updated
//     if (
//       updateData.discountedPrice !== undefined &&
//       updateData.actualPrice !== undefined
//     ) {
//       if (
//         parseFloat(updateData.discountedPrice) >
//         parseFloat(updateData.actualPrice)
//       ) {
//         res.status(400).json({
//           error: "Discounted price cannot be greater than actual price",
//         });
//         return;
//       }
//     } else if (updateData.discountedPrice !== undefined) {
//       const actualPrice = parseFloat(
//         updateData.actualPrice || comboOffer.actualPrice
//       );
//       if (parseFloat(updateData.discountedPrice) > actualPrice) {
//         res.status(400).json({
//           error: "Discounted price cannot be greater than actual price",
//         });
//         return;
//       }
//     }

//     // Validate activities if provided
//     if (updateData.activities && Array.isArray(updateData.activities)) {
//       let parsedActivities = updateData.activities;
//       if (typeof updateData.activities === "string") {
//         try {
//           parsedActivities = JSON.parse(updateData.activities);
//         } catch (e) {
//           res.status(400).json({ error: "Invalid activities format" });
//           return;
//         }
//       }

//       await Promise.all(
//         parsedActivities.map(async (activity: any) => {
//           const tourExists = await Activity.findById(activity.tour);
//           if (!tourExists) {
//             throw new Error(
//               `Activity with ID ${activity.tour} does not exist`
//             );
//           }
//         })
//       );

//       updateData.activities = parsedActivities;
//     }

//     // Handle multiple image uploads
//     if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//       const uploadedImages: string[] = [];

//       for (let i = 0; i < req.files.length; i++) {
//         const imageFile = req.files[i];
//         const uploadResult = await uploadToCloudinary(
//           imageFile.path,
//           "combo-offers"
//         );
//         uploadedImages.push(uploadResult.url);

//         if (i === 0) {
//           updateData.featuredImage = uploadResult.url;
//         }
//       }

//       updateData.images = uploadedImages;
//     }

//     // Normalize currency codes
//     if (updateData.comboCurrency) {
//       updateData.comboCurrency = updateData.comboCurrency.toUpperCase();
//     }
//     if (updateData.baseCurrency) {
//       updateData.baseCurrency = updateData.baseCurrency.toUpperCase();
//     }

//     // Parse numeric fields if provided
//     if (updateData.actualPrice !== undefined) {
//       updateData.actualPrice = parseFloat(updateData.actualPrice);
//     }
//     if (updateData.discountedPrice !== undefined) {
//       updateData.discountedPrice = parseFloat(updateData.discountedPrice);
//     }
//     if (updateData.costPrice !== undefined) {
//       updateData.costPrice = parseFloat(updateData.costPrice);
//     }
//     if (updateData.comboDiscount !== undefined) {
//       updateData.comboDiscount = parseFloat(updateData.comboDiscount);
//     }

//     // Parse array fields if they're strings
//     const arrayFields = [
//       "highlights",
//       "inclusions",
//       "exclusions",
//       "category",
//       "attributes",
//     ];
//     for (const field of arrayFields) {
//       if (updateData[field] && typeof updateData[field] === "string") {
//         try {
//           updateData[field] = JSON.parse(updateData[field]);
//         } catch (e) {
//           updateData[field] = [];
//         }
//       }
//     }

//     // Parse SEO content if it's a string
//     if (updateData.seoContent && typeof updateData.seoContent === "string") {
//       try {
//         updateData.seoContent = JSON.parse(updateData.seoContent);
//       } catch (e) {
//         delete updateData.seoContent;
//       }
//     }

//     // Parse boolean fields
//     if (updateData.isActive !== undefined) {
//       updateData.isActive =
//         updateData.isActive === "true" || updateData.isActive === true;
//     }
//     if (updateData.isPopular !== undefined) {
//       updateData.isPopular =
//         updateData.isPopular === "true" || updateData.isPopular === true;
//     }

//     // Update combo offer
//     const updatedComboOffer = await ComboOffer.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     }).populate("activities.tour", "name category description");

//     if (!updatedComboOffer) {
//       res.status(404).json({ error: "Combo offer not found" });
//       return;
//     }

//     // Convert to clean response
//     const convertedOffer = await convertComboOfferWithCleanResponse(
//       updatedComboOffer,
//       updatedComboOffer.baseCurrency
//     );

//     res.status(200).json({
//       success: true,
//       message: "Combo offer updated successfully",
//       data: convertedOffer,
//     });
//   } catch (error: any) {
//     console.error("Error updating combo offer:", error);
//     res.status(400).json({
//       error: "Failed to update combo offer",
//       message: error.message,
//     });
//   }
// };


export const updateComboOffer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    // Find combo offer
    const comboOffer = await ComboOffer.findById(id);
    if (!comboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    // Parse activities FIRST - convert string to object if needed
    if (updateData.activities) {
      if (typeof updateData.activities === "string") {
        try {
          updateData.activities = JSON.parse(updateData.activities);
        } catch (e) {
          res.status(400).json({
            error: "Invalid activities format",
            message: "Activities must be a valid JSON string or array",
          });
          return;
        }
      }

      // Ensure activities is an array
      if (!Array.isArray(updateData.activities)) {
        res.status(400).json({
          error: "Invalid activities format",
          message: "Activities must be an array",
        });
        return;
      }

      // Validate that each activity has required fields
      for (const activity of updateData.activities) {
        if (!activity.tour || !activity.tourOption) {
          res.status(400).json({
            error: "Invalid activity format",
            message: "Each activity must have 'tour' and 'tourOption' fields",
          });
          return;
        }

        // Validate activity exists in database
        const tourExists = await Activity.findById(activity.tour);
        if (!tourExists) {
          res.status(400).json({
            error: "Activity not found",
            message: `Activity with ID ${activity.tour} does not exist`,
          });
          return;
        }

        // Ensure numeric fields
        if (activity.tourLowestPrice !== undefined) {
          activity.tourLowestPrice = parseFloat(activity.tourLowestPrice);
        }
        if (activity.activityDiscount !== undefined) {
          activity.activityDiscount = parseFloat(activity.activityDiscount);
        }
      }
    }

    // Validate price logic if prices are being updated
    if (
      updateData.discountedPrice !== undefined &&
      updateData.actualPrice !== undefined
    ) {
      if (
        parseFloat(updateData.discountedPrice) >
        parseFloat(updateData.actualPrice)
      ) {
        res.status(400).json({
          error: "Discounted price cannot be greater than actual price",
        });
        return;
      }
    } else if (updateData.discountedPrice !== undefined) {
      const actualPrice = parseFloat(
        updateData.actualPrice || comboOffer.actualPrice
      );
      if (parseFloat(updateData.discountedPrice) > actualPrice) {
        res.status(400).json({
          error: "Discounted price cannot be greater than actual price",
        });
        return;
      }
    }

    // Handle multiple image uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedImages: string[] = [];

      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
        const uploadResult = await uploadToCloudinary(
          imageFile.path,
          "combo-offers"
        );
        uploadedImages.push(uploadResult.url);

        if (i === 0) {
          updateData.featuredImage = uploadResult.url;
        }
      }

      updateData.images = uploadedImages;
    }

    // Normalize currency codes
    if (updateData.comboCurrency) {
      updateData.comboCurrency = updateData.comboCurrency.toUpperCase();
    }
    if (updateData.baseCurrency) {
      updateData.baseCurrency = updateData.baseCurrency.toUpperCase();
    }

    // Parse numeric fields if provided
    if (updateData.actualPrice !== undefined) {
      updateData.actualPrice = parseFloat(updateData.actualPrice);
    }
    if (updateData.discountedPrice !== undefined) {
      updateData.discountedPrice = parseFloat(updateData.discountedPrice);
    }
    if (updateData.costPrice !== undefined) {
      updateData.costPrice = parseFloat(updateData.costPrice);
    }
    if (updateData.comboDiscount !== undefined) {
      updateData.comboDiscount = parseFloat(updateData.comboDiscount);
    }

    // Parse array fields if they're strings
    const arrayFields = [
      "highlights",
      "inclusions",
      "exclusions",
      "category",
      "attributes",
    ];
    
    for (const field of arrayFields) {
      if (updateData[field] && typeof updateData[field] === "string") {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field}, setting to empty array`);
          updateData[field] = [];
        }
      }
    }

    // Parse SEO content if it's a string
    if (updateData.seoContent && typeof updateData.seoContent === "string") {
      try {
        updateData.seoContent = JSON.parse(updateData.seoContent);
      } catch (e) {
        console.warn("Failed to parse seoContent");
        delete updateData.seoContent;
      }
    }

    // Parse boolean fields
    if (updateData.isActive !== undefined) {
      updateData.isActive =
        updateData.isActive === "true" || updateData.isActive === true;
    }
    if (updateData.isPopular !== undefined) {
      updateData.isPopular =
        updateData.isPopular === "true" || updateData.isPopular === true;
    }

    // Update combo offer
    const updatedComboOffer = await ComboOffer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("activities.tour", "name category description images");

    if (!updatedComboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    // Convert to clean response
    const convertedOffer = await convertComboOfferWithCleanResponse(
      updatedComboOffer,
      updatedComboOffer.baseCurrency
    );

    res.status(200).json({
      success: true,
      message: "Combo offer updated successfully",
      data: convertedOffer,
    });
  } catch (error: any) {
    console.error("Error updating combo offer:", error);
    res.status(400).json({
      error: "Failed to update combo offer",
      message: error.message,
    });
  }
};
export const deleteComboOfferImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { imageUrls } = req.body;

    // Validate input
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400).json({
        error: "Invalid request",
        message: "Please provide imageUrls as an array of image URLs to delete",
      });
      return;
    }

    // Find combo offer
    const comboOffer = await ComboOffer.findById(id);
    if (!comboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    // Track which images were removed
    const removedImages: string[] = [];
    const notFoundImages: string[] = [];

    // Remove images from the images array
    if (comboOffer.images && Array.isArray(comboOffer.images)) {
      comboOffer.images = comboOffer.images.filter((image: string) => {
        if (imageUrls.includes(image)) {
          removedImages.push(image);
          return false;
        }
        return true;
      });
    }

    // Check if any featured images need to be reset
    if (
      comboOffer.featuredImage &&
      imageUrls.includes(comboOffer.featuredImage)
    ) {
      removedImages.push(comboOffer.featuredImage);

      // Set new featured image to first remaining image
      if (comboOffer.images && comboOffer.images.length > 0) {
        comboOffer.featuredImage = comboOffer.images[0];
      } else {
        comboOffer.featuredImage = undefined;
      }
    }

    // Check for images that were not found
    for (const url of imageUrls) {
      if (!removedImages.includes(url)) {
        notFoundImages.push(url);
      }
    }

    // Save the updated combo offer
    await comboOffer.save();

    // Fetch updated offer
    // const updatedComboOffer = await ComboOffer.findById(id).populate(
    //   "activities.tour",
    //   "name category description"
    // );

    // // Convert to clean response
    // const convertedOffer = await convertComboOfferWithCleanResponse(
    //   updatedComboOffer,
    //   updatedComboOffer.baseCurrency
    // );


    const updatedComboOffer = await ComboOffer.findById(id).populate(
  "activities.tour",
  "name category description"
);

if (!updatedComboOffer) {
  // Handle the case when no document is found
  res.status(404).json({ error: "Combo offer not found" });
  return;
}

// Rest of your code that uses updatedComboOffer
const convertedOffer = await convertComboOfferWithCleanResponse(
  updatedComboOffer,
  updatedComboOffer.baseCurrency
);
    res.status(200).json({
      success: true,
      message: "Images deleted successfully",
      data: {
        offer: convertedOffer,
        deletedImages: removedImages,
        notFoundImages: notFoundImages,
        remainingImages: comboOffer.images || [],
        remainingFeaturedImage: comboOffer.featuredImage,
      },
    });
  } catch (error: any) {
    console.error("Error deleting combo offer images:", error);
    res.status(400).json({
      error: "Failed to delete images",
      message: error.message,
    });
  }
};
/**
 * Delete combo offer
 */
export const deleteComboOffer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const comboOffer = await ComboOffer.findByIdAndDelete(id);

    if (!comboOffer) {
      res.status(404).json({ error: "Combo offer not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Combo offer deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting combo offer:", error);
    res.status(500).json({
      error: "Failed to delete combo offer",
      message: error.message,
    });
  }
};

/**
 * Get combo offers by location
 */
export const getComboOffersByLocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { country, city } = req.params;
    const { currency = "AED", isActive = true } = req.query;

    const isValidCurr = await isValidCurrency(currency as string);
    if (!isValidCurr) {
      res.status(400).json({ error: `Invalid currency: ${currency}` });
      return;
    }

    const filter: any = { country, city };
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const comboOffers = await ComboOffer.find(filter)
      .populate("activities.tour", "name category description")
      .sort({ isPopular: -1, createdAt: -1 });

    const convertedOffers = await convertComboOffersWithCleanResponse(
      comboOffers,
      currency as string,
      "AED"
    );

    res.status(200).json({
      success: true,
      data: convertedOffers.data,
      total: convertedOffers.data.length,
      currencyInfo: convertedOffers.currencyInfo,
    });
  } catch (error: any) {
    console.error("Error fetching combo offers by location:", error);
    res.status(500).json({
      error: "Failed to fetch combo offers",
      message: error.message,
    });
  }
};

/**
 * Search combo offers
 */
export const searchComboOffers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q, currency = "AED", limit = 10 } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const isValidCurr = await isValidCurrency(currency as string);
    if (!isValidCurr) {
      res.status(400).json({ error: `Invalid currency: ${currency}` });
      return;
    }

    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
      isActive: true,
    };

    const comboOffers = await ComboOffer.find(searchQuery)
      .populate("activities.tour", "name category description")
      .limit(parseInt(limit as string) || 10);

    const convertedOffers = await convertComboOffersWithCleanResponse(
      comboOffers,
      currency as string,
      "AED"
    );

    res.status(200).json({
      success: true,
      data: convertedOffers.data,
      total: convertedOffers.data.length,
      currencyInfo: convertedOffers.currencyInfo,
    });
  } catch (error: any) {
    console.error("Error searching combo offers:", error);
    res.status(500).json({
      error: "Failed to search combo offers",
      message: error.message,
    });
  }
};

/**
 * Get pricing summary for combo offer
 */
// export const getComboOfferPricingSummary = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const { currency = "AED" } = req.query;

//     const isValidCurr = await isValidCurrency(currency as string);
//     if (!isValidCurr) {
//       res.status(400).json({ error: `Invalid currency: ${currency}` });
//       return;
//     }

//     const comboOffer = await ComboOffer.findById(id).populate(
//       "activities.tour"
//     );

//     if (!comboOffer) {
//       res.status(404).json({ error: "Combo offer not found" });
//       return;
//     }

//     const convertedOffer = await convertComboOfferWithCleanResponse(
//       comboOffer,
//       currency as string,
//       comboOffer.baseCurrency
//     );

//     const pricingSummary = formatComboOfferPricing(convertedOffer);

//     res.status(200).json({
//       success: true,
//       data: {
//         offerName: convertedOffer.name,
//         actualPrice: convertedOffer.actualPrice,
//         discountedPrice: convertedOffer.discountedPrice,
//         totalSavings: convertedOffer.totalSavings,
//         discountPercentage: convertedOffer.discountPercentage,
//         profit: convertedOffer.profit,
//         currency: convertedOffer.baseCurrency,
//         pricingSummary,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error fetching pricing summary:", error);
//     res.status(500).json({
//       error: "Failed to fetch pricing summary",
//       message: error.message,
//     });
//   }
// };