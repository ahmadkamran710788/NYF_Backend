// src/controllers/bookingController.ts
import { Request, Response } from "express";
import { Booking, BookingStatus } from "../models/Booking";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";

export const createBooking = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      activityId,
      userId,
      activityDate,
      timeSlot,
      adults,
      children,
      contactInfo,
      specialRequests,
      paymentMethod,
    } = req.body;

    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Calculate total amount
    const totalAmount =
      adults * activity.discountPrice +
      (children || 0) * (activity.discountPrice * 0.7); // 30% discount for children

    const booking = new Booking({
      activity: activityId,
      user: userId,
      activityDate: new Date(activityDate),
      timeSlot,
      adults,
      children: children || 0,
      totalAmount,
      contactInfo,
      specialRequests,
      paymentMethod,
      paymentStatus: "pending",
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
};

export const getBookingsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ user: userId })
      .populate("activity")
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

export const updateBookingStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { bookingId } = req.params;
    const { status, cancellationReason } = req.body;

    // Validate status
    if (!Object.values(BookingStatus).includes(status as BookingStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const updateData: any = { status };

    // Add cancellation reason if provided and status is cancelled
    if (status === BookingStatus.CANCELLED && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    const booking = await Booking.findByIdAndUpdate(bookingId, updateData, {
      new: true,
    }).populate("activity");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.message,
    });
  }
};
