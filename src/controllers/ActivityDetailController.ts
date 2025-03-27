
import { Request, Response } from "express";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";

// Validate ObjectId
const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// Get activity detail by activity ID
export const getActivityDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;

    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Fetch activity details directly
    const activityDetail = await ActivityDetail.findOne({ activityId }).populate({
      path: "activityId", // Assuming `activityId` is a reference field
      // select: "name description category images", // Select relevant fields
    });
    if (!activityDetail) {
      return res.status(404).json({ success: false, message: "Activity details not found" });
    }

    res.status(200).json({ success: true, data: activityDetail });
  } catch (error) {
    console.error("Error fetching activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
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
