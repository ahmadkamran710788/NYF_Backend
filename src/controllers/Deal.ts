import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Deal, IDeal } from '../models/Deal';
import { Activity } from '../models/Activity';
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
import {
  convertDealsWithCleanResponse,
  getDealsWithCurrencyConversion,
  convertDealWithCleanResponse,
  convertDealPricingForDate,
  isValidCurrency,
  getSupportedCurrencies,
  formatPrice
} from '../services/currencyExchangeDeals';
// Helper function for error handling
const handleError = (res: Response, error: unknown, message: string = 'An error occurred') => {
  console.error(message, error);
  res.status(500).json({ 
    message, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  });
};

// Validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Create a new deal
 * @param req Express request object
 * @param res Express response object
 */
export const createDeal = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      activity, 
      title, 
      description, 
      pricing, 
      includes, 
      highlights, 
      restrictions 
    } = req.body;

    // Validate activity exists
    const existingActivity = await Activity.findById(activity);
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Create new deal object (without saving it yet)
    const newDeal = new Deal({
      activity,
      title,
      description,
      pricing: JSON.parse(pricing),
      includes: JSON.parse(includes),
      highlights: JSON.parse(highlights),
      restrictions: restrictions ? JSON.parse(restrictions) : []
    });

    // Handle image upload if a file was provided
    if (req.file) {
      try {
        // Upload the file to Cloudinary
        const uploadResult = await uploadToCloudinary(
          req.file.path,
          "deals"  // folder name in Cloudinary
        );
        
        // Add the image URL to the deal
        newDeal.image = uploadResult.url;
      } catch (error) {
        return res.status(400).json({ 
          message: 'Error uploading image', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Save the deal
    await newDeal.save();

    res.status(201).json({
      message: 'Deal created successfully',
      deal: newDeal
    });
  } catch (error) {
    handleError(res, error, 'Error creating deal');
  }
};


/**
 * Get deals by activity
 * @param req Express request object
 * @param res Express response object
 */
export const getDealsByActivity = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const { currency, date } = req.query;

    // Validate activity ID
    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    // Validate currency if provided
    const targetCurrency = currency as string || 'AED';
    if (currency && !(await isValidCurrency(targetCurrency))) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Parse date if provided
    let filterDate: Date | undefined;
    if (date) {
      filterDate = new Date(date as string);
      if (isNaN(filterDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date provided' });
      }
    }

    // Find deals and populate activity details
    const deals = await Deal.find({ activity: activityId })
      .populate('activity', 'name category city');

    // if (deals.length === 0) {
    //   return res.status(200).json({
    //     message: 'No deals found for this activity',
    //     deals: [],
    //     count: 0
    //   });
    // }

    // Convert deals with currency conversion
    const convertedResponse = await getDealsWithCurrencyConversion(
      deals,
      targetCurrency,
      'AED', // assuming base currency is AED
      filterDate
    );

    res.status(200).json({
      message: 'Deals retrieved successfully',
      ...convertedResponse,
      count: convertedResponse.data.length
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving deals');
  }
};


/**
 * Get deal by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getDealById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const { currency } = req.query;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate currency if provided
    const targetCurrency = currency as string || 'AED';
    if (currency && !(await isValidCurrency(targetCurrency))) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Find deal and populate activity details
    const deal = await Deal.findById(dealId)
      .populate('activity', 'name category description images');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Convert deal with currency conversion
    const convertedDeal = await convertDealWithCleanResponse(
      deal,
      targetCurrency,
      'AED' // assuming base currency is AED
    );

    res.status(200).json({
      message: 'Deal retrieved successfully',
      deal: convertedDeal,
      currencyInfo: {
        currency: targetCurrency
      }
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving deal');
  }
};




export const getAllDeals = async (req: Request, res: Response): Promise<any> => {
  try {
    const { currency, date } = req.query;

    // Validate currency if provided
    const targetCurrency = currency as string || 'AED';
    if (currency && !(await isValidCurrency(targetCurrency))) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Parse date if provided
    let filterDate: Date | undefined;
    if (date) {
      filterDate = new Date(date as string);
      if (isNaN(filterDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date provided' });
      }
    }

    // Find all deals and populate activity details
    const deals = await Deal.find()
      .populate('activity', 'name category description images');

    if (deals.length === 0) {
      return res.status(200).json({
        message: 'No deals found',
        deals: [],
        count: 0
      });
    }

    // Convert deals with currency conversion
    const convertedResponse = await getDealsWithCurrencyConversion(
      deals,
      targetCurrency,
      'AED', // assuming base currency is AED
      filterDate
    );

    res.status(200).json({
      message: 'Deals retrieved successfully',
      ...convertedResponse
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving deals');
  }
};

/**
 * Update a deal
 * @param req Express request object
 * @param res Express response object
 */
export const updateDeal = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const updateData = req.body;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // If activity is being updated, validate it exists
    if (updateData.activity) {
      const existingActivity = await Activity.findById(updateData.activity);
      if (!existingActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
    }

    // Update deal
    const updatedDeal = await Deal.findByIdAndUpdate(
      dealId, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.status(200).json({
      message: 'Deal updated successfully',
      deal: updatedDeal
    });
  } catch (error) {
    handleError(res, error, 'Error updating deal');
  }
};

/**
 * Delete a deal
 * @param req Express request object
 * @param res Express response object
 */
export const deleteDeal = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Delete the deal
    const deletedDeal = await Deal.findByIdAndDelete(dealId);

    if (!deletedDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.status(200).json({
      message: 'Deal deleted successfully',
      deal: deletedDeal
    });
  } catch (error) {
    handleError(res, error, 'Error deleting deal');
  }
};

/**
 * Get deals pricing by activity and date
 * @param req Express request object
 * @param res Express response object
 */
// export const getDealsPricingByActivityAndDate = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { activityId } = req.params;
//     const { date } = req.query;

//     // Validate activity ID
//     if (!isValidObjectId(activityId)) {
//       return res.status(400).json({ message: 'Invalid activity ID' });
//     }

//     // Validate date
//     const searchDate = date ? new Date(date as string) : new Date();
//     if (isNaN(searchDate.getTime())) {
//       return res.status(400).json({ message: 'Invalid date provided' });
//     }

//     // Check if activity exists
//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ message: 'Activity not found' });
//     }

//     // Find deals with pricing for the specific activity and date
//     const deals = await Deal.aggregate([
//       // Match deals for the specific activity
//       { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
      
//       // Unwind the pricing array
//       { $unwind: '$pricing' },
      
//       // Filter pricing entries up to the search date
//       { $match: { 
//         'pricing.date': { $lte: searchDate } 
//       }},
      
//       // Sort to get the most recent pricing
//       { $sort: { 'pricing.date': -1 } },
      
//       // Group back to preserve deal structure with the most recent pricing
//       { $group: {
//         _id: '$_id',
//         title: { $first: '$title' },
//         description: { $first: '$description' },
//         activity: { $first: '$activity' },
//         includes: { $first: '$includes' },
//         highlights: { $first: '$highlights' },
//         pricing: { $first: '$pricing' }
//       }},
      
//       // Optionally populate activity details
//       { $lookup: {
//         from: 'activities',
//         localField: 'activity',
//         foreignField: '_id',
//         as: 'activityDetails'
//       }},
      
//       // Unwind activity details
//       { $unwind: { 
//         path: '$activityDetails', 
//         preserveNullAndEmptyArrays: true 
//       }}
//     ]);

//     // Transform the result to a more readable format
//     const formattedDeals = deals.map(deal => ({
//       _id: deal._id,
//       title: deal.title,
//       description: deal.description,
//       includes: deal.includes,
//       highlights: deal.highlights,
//       pricing: {
//         date: deal.pricing.date,
//         adultPrice: deal.pricing.adultPrice,
//         childPrice: deal.pricing.childPrice
//       },
//       activityDetails: deal.activityDetails ? {
//         name: deal.activityDetails.name,
//         category: deal.activityDetails.category
//       } : null
//     }));

//     // Respond with the deals
//     res.status(200).json({
//       message: 'Deals retrieved successfully',
//       deals: formattedDeals,
//       count: formattedDeals.length,
//       searchDate
//     });

//   } catch (error) {
//     handleError(res, error, 'Error retrieving deals pricing');
//   }
// };


// export const getDealsPricingByActivityAndDate = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { activityId } = req.params;
//     const { date } = req.query;

//     // Validate activity ID
//     if (!isValidObjectId(activityId)) {
//       return res.status(400).json({ message: 'Invalid activity ID' });
//     }

//     // Normalize the search date (if date is provided)
//     let searchDate: Date | null = null;
//     if (date) {
//       searchDate = new Date(date as string);
//       if (isNaN(searchDate.getTime())) {
//         return res.status(400).json({ message: 'Invalid date provided' });
//       }
//     }

//     // Check if activity exists
//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ message: 'Activity not found' });
//     }

//     // Find deals for the specific activity
//     const deals = await Deal.aggregate([
//       // Match deals for the specific activity
//       { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
      
//       // Unwind the pricing array
//       { $unwind: '$pricing' },
      
//       // If a date is provided, match the pricing date to the exact search date
//       ...(searchDate ? [
//         { $match: { 
//           'pricing.date': { 
//             $gte: new Date(searchDate.setHours(0, 0, 0, 0)), 
//             $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) 
//           } 
//         }}
//       ] : []),

//       // Sort to get the earliest available pricing if no date is provided
//       { $sort: { 'pricing.date': 1 } },
      
//       // Group back to preserve deal structure with the earliest pricing
//       { $group: {
//         _id: '$_id',
//         title: { $first: '$title' },
//         description: { $first: '$description' },
//         activity: { $first: '$activity' },
//         includes: { $first: '$includes' },
//         highlights: { $first: '$highlights' },
//         pricing: { $first: '$pricing' }
//       }},
      
//       // Optionally populate activity details
//       { $lookup: {
//         from: 'activities',
//         localField: 'activity',
//         foreignField: '_id',
//         as: 'activityDetails'
//       }},
      
//       // Unwind activity details
//       { $unwind: { 
//         path: '$activityDetails', 
//         preserveNullAndEmptyArrays: true 
//       }}
//     ]);

//     // If no deals match the exact date (or no deal is found at all), return "No deals available"
//     if (deals.length === 0) {
//       return res.status(201).json({ message: 'No deals available for the exact date' });
//     }

//     // Transform the result to a more readable format
//     const formattedDeals = deals.map(deal => ({
//       _id: deal._id,
//       title: deal.title,
//       description: deal.description,
//       includes: deal.includes,
//       highlights: deal.highlights,
//       pricing: {
//         date: deal.pricing.date,
//         adultPrice: deal.pricing.adultPrice,
//         childPrice: deal.pricing.childPrice
//       },
//       activityDetails: deal.activityDetails ? {
//         name: deal.activityDetails.name,
//         category: deal.activityDetails.category
//       } : null
//     }));

//     // Respond with the deals
//     res.status(200).json({
//       message: 'Deals retrieved successfully',
//       deals: formattedDeals,
//       count: formattedDeals.length,
//       searchDate
//     });

//   } catch (error) {
//     handleError(res, error, 'Error retrieving deals pricing');
//   }
// };

export const getDealsPricingByActivityAndDate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const { date, currency } = req.query;

    // Validate activity ID
    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    // Validate currency if provided
    const targetCurrency = currency as string || 'AED';
    if (currency && !(await isValidCurrency(targetCurrency))) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Normalize the search date (if date is provided)
    let searchDate: Date | null = null;
    if (date) {
      searchDate = new Date(date as string);
      if (isNaN(searchDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date provided' });
      }
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Find deals for the specific activity
    const deals = await Deal.aggregate([
      // Match deals for the specific activity
      { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
      
      // Unwind the pricing array
      { $unwind: '$pricing' },
      
      // If a date is provided, match the pricing date to the exact search date
      ...(searchDate ? [
        { $match: { 
          'pricing.date': { 
            $gte: new Date(searchDate.setHours(0, 0, 0, 0)), 
            $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) 
          } 
        }}
      ] : []),

      // Sort to get the earliest available pricing if no date is provided
      { $sort: { 'pricing.date': 1 } },
      
      // Group back to preserve deal structure with the earliest pricing
      { $group: {
        _id: '$_id',
        title: { $first: '$title' },
        description: { $first: '$description' },
        activity: { $first: '$activity' },
        includes: { $first: '$includes' },
        highlights: { $first: '$highlights' },
        image: { $first: '$image' },
        pricing: { $first: '$pricing' },
        restrictions: { $first: '$restrictions' },
        baseCurrency: { $first: '$baseCurrency' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' }
      }},
      
      // Optionally populate activity details
      { $lookup: {
        from: 'activities',
        localField: 'activity',
        foreignField: '_id',
        as: 'activityDetails'
      }},
      
      // Unwind activity details
      { $unwind: { 
        path: '$activityDetails', 
        preserveNullAndEmptyArrays: true 
      }}
    ]);

    if (deals.length === 0) {
      return res.status(200).json({
        message: 'No deals found',
        deals: [],
        count: 0,
        searchDate,
        currency: targetCurrency
      });
    }


    // Transform deals to include activity details in the right format
    const transformedDeals = deals.map(deal => ({
      _id: deal._id,
      title: deal.title,
      description: deal.description,
      includes: deal.includes,
      highlights: deal.highlights,
      restrictions: deal.restrictions || [],
      image: deal.image,
      pricing: [deal.pricing], // Convert single pricing back to array for service
      activity: deal.activityDetails ? {
        _id: deal.activityDetails._id,
        name: deal.activityDetails.name,
        category: deal.activityDetails.category,
        description: deal.activityDetails.description,
        images: deal.activityDetails.images || []
      } : null,
      baseCurrency: deal.baseCurrency || 'AED',
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    }));

    // Convert deals with currency conversion using the service
    const convertedResponse = await convertDealsWithCleanResponse(
      transformedDeals,
      targetCurrency,
      'AED' // assuming base currency is AED
    );

    // Transform the result to match the original expected format
    const formattedDeals = convertedResponse.data.map(deal => ({
      _id: deal._id,
      title: deal.title,
      description: deal.description,
      includes: deal.includes,
      highlights: deal.highlights,
      image: deal.image,
      pricing: deal.pricing && deal.pricing.length > 0 ? {
        date: deal.pricing[0].date,
        adultPrice: deal.pricing[0].adultPrice,
        childPrice: deal.pricing[0].childPrice
      } : null,
      activityDetails: deal.activity ? {
        name: deal.activity.name,
        category: deal.activity.category
      } : null
    }));

    // Respond with the deals
    res.status(200).json({
      message: deals.length > 0 ? 'Deals retrieved successfully' : 'No deals found',
      deals: formattedDeals,
      count: formattedDeals.length,
      searchDate,
      currencyInfo: convertedResponse.currencyInfo
    });

  } catch (error) {
    handleError(res, error, 'Error retrieving deals pricing');
  }
};




/**
 * Get best pricing for a specific deal
 * @param req Express request object
 * @param res Express response object
 */
export const getBestDealPricing = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const { date, currency } = req.query;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate currency if provided
    const targetCurrency = currency as string || 'AED';
    if (currency && !(await isValidCurrency(targetCurrency))) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Validate date
    const searchDate = date ? new Date(date as string) : new Date();
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    // Find the deal first
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Get pricing for the specific date using the service
    const convertedPricing = await convertDealPricingForDate(
      deal,
      searchDate,
      targetCurrency,
      'AED' // assuming base currency is AED
    );

    // Check if pricing was found
    if (!convertedPricing) {
      return res.status(404).json({ 
        message: 'No pricing found for the deal on the specified date' 
      });
    }

    // Respond with the best pricing
    res.status(200).json({
      message: 'Deal pricing retrieved successfully',
      pricing: {
        title: deal.title,
        description: deal.description,
        date: convertedPricing.date,
        adultPrice: convertedPricing.adultPrice,
        childPrice: convertedPricing.childPrice,
        formattedAdultPrice: formatPrice(convertedPricing.adultPrice, targetCurrency),
        formattedChildPrice: formatPrice(convertedPricing.childPrice, targetCurrency)
      },
      searchDate,
      currency: targetCurrency
    });

  } catch (error) {
    handleError(res, error, 'Error retrieving deal pricing');
  }
};
export const getSupportedCurrenciesEndpoint = async (req: Request, res: Response): Promise<any> => {
  try {
    const currencies = await getSupportedCurrencies();
    
    res.status(200).json({
      message: 'Supported currencies retrieved successfully',
      currencies,
      count: currencies.length
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving supported currencies');
  }
};

/**
 * Add bulk pricing for a deal across multiple consecutive dates
 * @param req Express request object
 * @param res Express response object
 */
export const addBulkDealPricing = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const { startDate, endDate, adultPrice, childPrice } = req.body;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate required fields
    if (!startDate || !endDate || adultPrice === undefined || childPrice === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: startDate, endDate, adultPrice, childPrice' 
      });
    }

    // Validate and parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Ensure start date is not after end date
    if (start > end) {
      return res.status(400).json({ 
        message: 'Start date cannot be after end date' 
      });
    }

    // Validate pricing values
    if (adultPrice < 0 || childPrice < 0) {
      return res.status(400).json({ 
        message: 'Pricing values cannot be negative' 
      });
    }

    // Check if deal exists
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Generate array of dates between start and end date (inclusive)
    const dates: Date[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create pricing entries for each date
    const pricingEntries = dates.map(date => ({
      date: new Date(date.setHours(0, 0, 0, 0)), // Normalize to start of day
      adultPrice: Number(adultPrice),
      childPrice: Number(childPrice)
    }));

    // Check for existing pricing on these dates
    const existingDates = deal.pricing
      .filter(p => {
        const pricingDate = new Date(p.date);
        return dates.some(d => 
          pricingDate.getTime() === d.getTime()
        );
      })
      .map(p => p.date.toISOString().split('T')[0]);

    if (existingDates.length > 0) {
      return res.status(400).json({ 
        message: 'Pricing already exists for some dates',
        existingDates: existingDates,
        suggestion: 'Use update endpoint to modify existing pricing or choose different dates'
      });
    }

    // Add new pricing entries to the deal
    deal.pricing.push(...pricingEntries);

    // Sort pricing by date to maintain order
    deal.pricing.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Save the updated deal
    await deal.save();

    res.status(200).json({
      message: 'Bulk pricing added successfully',
      dealId: dealId,
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        totalDays: dates.length
      },
      pricing: {
        adultPrice: adultPrice,
        childPrice: childPrice
      },
      addedDates: dates.map(date => date.toISOString().split('T')[0])
    });

  } catch (error) {
    handleError(res, error, 'Error adding bulk deal pricing');
  }
};

/**
 * Update bulk pricing for a deal across multiple consecutive dates
 * @param req Express request object
 * @param res Express response object
 */
export const updateBulkDealPricing = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const { startDate, endDate, adultPrice, childPrice, overwrite = false } = req.body;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate required fields
    if (!startDate || !endDate || adultPrice === undefined || childPrice === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: startDate, endDate, adultPrice, childPrice' 
      });
    }

    // Validate and parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Ensure start date is not after end date
    if (start > end) {
      return res.status(400).json({ 
        message: 'Start date cannot be after end date' 
      });
    }

    // Validate pricing values
    if (adultPrice < 0 || childPrice < 0) {
      return res.status(400).json({ 
        message: 'Pricing values cannot be negative' 
      });
    }

    // Check if deal exists
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Generate array of dates between start and end date (inclusive)
    const dates: Date[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let updatedCount = 0;
    let addedCount = 0;

    // Process each date
    dates.forEach(date => {
      const normalizedDate = new Date(date.setHours(0, 0, 0, 0));
      
      // Find existing pricing entry for this date
      const existingIndex = deal.pricing.findIndex(p => 
        new Date(p.date).getTime() === normalizedDate.getTime()
      );

      if (existingIndex !== -1) {
        // Update existing pricing
        if (overwrite) {
          deal.pricing[existingIndex].adultPrice = Number(adultPrice);
          deal.pricing[existingIndex].childPrice = Number(childPrice);
          updatedCount++;
        }
      } else {
        // Add new pricing entry
        deal.pricing.push({
          date: normalizedDate,
          adultPrice: Number(adultPrice),
          childPrice: Number(childPrice)
        });
        addedCount++;
      }
    });

    // Sort pricing by date to maintain order
    deal.pricing.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Save the updated deal
    await deal.save();

    res.status(200).json({
      message: 'Bulk pricing updated successfully',
      dealId: dealId,
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        totalDays: dates.length
      },
      pricing: {
        adultPrice: adultPrice,
        childPrice: childPrice
      },
      results: {
        updatedCount,
        addedCount,
        totalProcessed: dates.length
      },
      processedDates: dates.map(date => date.toISOString().split('T')[0])
    });

  } catch (error) {
    handleError(res, error, 'Error updating bulk deal pricing');
  }
};

/**
 * Delete bulk pricing for a deal across multiple consecutive dates
 * @param req Express request object
 * @param res Express response object
 */
export const deleteBulkDealPricing = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dealId } = req.params;
    const { startDate, endDate } = req.body;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: startDate, endDate' 
      });
    }

    // Validate and parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Ensure start date is not after end date
    if (start > end) {
      return res.status(400).json({ 
        message: 'Start date cannot be after end date' 
      });
    }

    // Check if deal exists
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Generate array of dates between start and end date (inclusive)
    const dates: Date[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Remove pricing entries for the specified date range
    const originalLength = deal.pricing.length;
    deal.pricing = deal.pricing.filter(p => {
      const pricingDate = new Date(p.date);
      return !dates.some(d => 
        pricingDate.getTime() === new Date(d.setHours(0, 0, 0, 0)).getTime()
      );
    });

    const deletedCount = originalLength - deal.pricing.length;

    // Save the updated deal
    await deal.save();

    res.status(200).json({
      message: 'Bulk pricing deleted successfully',
      dealId: dealId,
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        totalDays: dates.length
      },
      results: {
        deletedCount,
        remainingPricingEntries: deal.pricing.length
      },
      deletedDates: dates.map(date => date.toISOString().split('T')[0])
    });

  } catch (error) {
    handleError(res, error, 'Error deleting bulk deal pricing');
  }
};