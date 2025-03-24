import { Request, Response } from "express";
import { ActivityDetail } from "../models/ActivityDetails";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";

// Get activity detail by activity ID
export const getActivityDetail = async (req: Request, res: Response): Promise<any>  => {
  try {
    const { activityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Find the activity first to ensure it exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Find the activity details
    const activityDetail = await ActivityDetail.findOne({ activityId });
    if (!activityDetail) {
      return res.status(404).json({ success: false, message: "Activity details not found" });
    }

    // Return both activity and its details
    res.status(200).json({
      success: true,
      data: {
        activity,
        details: activityDetail
      }
    });
  } catch (error) {
    console.error("Error fetching activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Create new activity detail
export const createActivityDetail = async (req: Request, res: Response): Promise<any>  => {
  try {
    const { activityId } = req.params;
    const detailData = req.body;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Check if details already exist
    const existingDetail = await ActivityDetail.findOne({ activityId });
    if (existingDetail) {
      return res.status(400).json({ success: false, message: "Activity details already exist" });
    }

    // Create new activity detail
    const newActivityDetail = new ActivityDetail({
      activityId,
      ...detailData
    });

    await newActivityDetail.save();

    res.status(201).json({
      success: true,
      data: newActivityDetail,
      message: "Activity details created successfully"
    });
  } catch (error) {
    console.error("Error creating activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Update activity detail
export const updateActivityDetail = async (req: Request, res: Response): Promise<any>  => {
  try {
    const { activityId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
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

    res.status(200).json({
      success: true,
      data: updatedDetail,
      message: "Activity details updated successfully"
    });
  } catch (error) {
    console.error("Error updating activity detail:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};