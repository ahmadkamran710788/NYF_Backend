import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Deal, IDeal } from '../models/Deal';
import { Activity } from '../models/Activity';
import { uploadToCloudinary } from "../utils/CloudinaryHelper";

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

    // Validate activity ID
    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    // Find deals and populate activity details
    const deals = await Deal.find({ activity: activityId })
      .populate('activity', 'name category city');

    res.status(200).json({
      message: 'Deals retrieved successfully',
      deals,
      count: deals.length
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

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Find deal and populate activity details
    const deal = await Deal.findById(dealId)
      .populate('activity', 'name category description images');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.status(200).json({
      message: 'Deal retrieved successfully',
      deal
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving deal');
  }
};



export const getAllDeals = async (req: Request, res: Response): Promise<any> => {
  try {
    

    // Find deal and populate activity details
    const deals = await Deal.find()
      .populate('activity', 'name category description images');

   

    res.status(200).json({
      message: 'Deals retrieved successfully',
      deals:deals
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving deal');
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


export const getDealsPricingByActivityAndDate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const { date } = req.query;

    // Validate activity ID
    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
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
        pricing: { $first: '$pricing' }
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

    // If no deals match the exact date (or no deal is found at all), return "No deals available"
    if (deals.length === 0) {
      return res.status(404).json({ message: 'No deals available for the exact date' });
    }

    // Transform the result to a more readable format
    const formattedDeals = deals.map(deal => ({
      _id: deal._id,
      title: deal.title,
      description: deal.description,
      includes: deal.includes,
      highlights: deal.highlights,
      pricing: {
        date: deal.pricing.date,
        adultPrice: deal.pricing.adultPrice,
        childPrice: deal.pricing.childPrice
      },
      activityDetails: deal.activityDetails ? {
        name: deal.activityDetails.name,
        category: deal.activityDetails.category
      } : null
    }));

    // Respond with the deals
    res.status(200).json({
      message: 'Deals retrieved successfully',
      deals: formattedDeals,
      count: formattedDeals.length,
      searchDate
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
    const { date } = req.query;

    // Validate deal ID
    if (!isValidObjectId(dealId)) {
      return res.status(400).json({ message: 'Invalid deal ID' });
    }

    // Validate date
    const searchDate = date ? new Date(date as string) : new Date();
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    // Find the best pricing for the deal
    const dealPricing = await Deal.aggregate([
      // Match the specific deal
      { $match: { _id: new mongoose.Types.ObjectId(dealId) } },
      
      // Unwind pricing array
      { $unwind: '$pricing' },
      
      // Filter pricing entries up to the search date
      { $match: { 
        'pricing.date': { $lte: searchDate } 
      }},
      
      // Sort to get the most recent pricing
      { $sort: { 'pricing.date': -1 } },
      
      // Take the first (most recent) pricing entry
      { $limit: 1 },
      
      // Project the desired fields
      { $project: {
        title: 1,
        description: 1,
        date: '$pricing.date',
        adultPrice: '$pricing.adultPrice',
        childPrice: '$pricing.childPrice'
      }}
    ]);

    // Check if pricing was found
    if (dealPricing.length === 0) {
      return res.status(404).json({ 
        message: 'No pricing found for the deal on the specified date' 
      });
    }

    // Respond with the best pricing
    res.status(200).json({
      message: 'Deal pricing retrieved successfully',
      pricing: dealPricing[0],
      searchDate
    });

  } catch (error) {
    handleError(res, error, 'Error retrieving deal pricing');
  }
};
