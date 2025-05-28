
import { Request, Response } from "express";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";
import { 
  convertActivity, 
  convertActivities, 
  getSupportedCurrencies, 
  formatPrice,
  ConvertedActivity 
} from "../services/currencyService";
// Validate ObjectId

interface ActivityDetailResponse {
  _id: any;
  activityId: any;
  [key: string]: any;
  currencyInfo?: {
    convertedTo: string;
    convertedAt: string;
    originalCurrency: string;
  };
}
const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// Get activity detail by activity ID
export const getActivityDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const { currency } = req.query; // Optional currency parameter

    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid activity ID format" 
      });
    }

    // Validate currency if provided
    if (currency && typeof currency === 'string') {
      const supportedCurrencies = await getSupportedCurrencies();
      if (!supportedCurrencies.includes(currency.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Unsupported currency: ${currency}. Supported currencies: ${supportedCurrencies.join(', ')}`
        });
      }
    }

    // Fetch activity details with populated activity data
    const activityDetail = await ActivityDetail.findOne({ activityId }).populate({
      path: "activityId",
      select: "name description category images originalPrice discountPrice city duration includes highlights isInstantConfirmation isMobileTicket isRefundable ratings reviewCount"
    });

    if (!activityDetail) {
      return res.status(404).json({ 
        success: false, 
        message: "Activity details not found" 
      });
    }

    // Create response object with proper typing
    let responseData: ActivityDetailResponse = {
      ...activityDetail.toObject()
    };

    // Convert currency if requested
    if (currency && typeof currency === 'string' && currency.toUpperCase() !== 'USD') {
      try {
        // Assuming the populated activity data has price information
        if (responseData.activityId && typeof responseData.activityId === 'object') {
          const convertedActivity = await convertActivity(responseData.activityId, currency);
          responseData.activityId = convertedActivity;
          
          // Add currency conversion info to response
          responseData.currencyInfo = {
            convertedTo: currency.toUpperCase(),
            convertedAt: new Date().toISOString(),
            originalCurrency: 'USD'
          };
        }
      } catch (conversionError) {
        console.error("Currency conversion error:", conversionError);
        return res.status(500).json({
          success: false,
          message: "Failed to convert currency",
          error: (conversionError as Error).message
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      data: responseData 
    });
  } catch (error) {
    console.error("Error fetching activity detail:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: (error as Error).message 
    });
  }
};

// Create new activity detail
export const createActivityDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const detailData = req.body;

    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Check if details already exist
    const existingDetail = await ActivityDetail.findOne({ activityId });
    if (existingDetail) {
      return res.status(400).json({ success: false, message: "Activity details already exist" });
    }

    // Ensure activity exists before proceeding
    const activityExists = await Activity.exists({ _id: activityId });
    if (!activityExists) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Create new activity detail
    const newActivityDetail = new ActivityDetail({ activityId, ...detailData });
    await newActivityDetail.save();

    res.status(201).json({ success: true, data: newActivityDetail, message: "Activity details created successfully" });
  } catch (error) {
    console.error("Error creating activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Update activity detail
export const updateActivityDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;
    const updateData = req.body;

    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Find and update the activity detail
    const updatedDetail = await ActivityDetail.findOneAndUpdate(
      { activityId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedDetail) {
      return res.status(404).json({ success: false, message: "Activity details not found" });
    }

    res.status(200).json({ success: true, data: updatedDetail, message: "Activity details updated successfully" });
  } catch (error) {
    console.error("Error updating activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};
