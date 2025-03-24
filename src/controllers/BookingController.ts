import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Activity } from "../models/Activity";
import { Cart } from "../models/Cart";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Create booking directly (without cart)
export const createBooking = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      activityId,
      bookingDate,
      numberOfAdults,
      numberOfChildren,
      customerEmail,
      customerName,
      customerPhone
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    // Validate required fields
    if (!bookingDate || !numberOfAdults || !customerEmail || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: "Missing required booking information" });
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Calculate total price
    const pricePerAdult = activity.discountPrice || activity.originalPrice;
    const pricePerChild = (activity.discountPrice || activity.originalPrice) * 0.7; // Assume 30% discount for children
    const totalPrice = (numberOfAdults * pricePerAdult) + ((numberOfChildren || 0) * pricePerChild);

    // Generate unique booking reference
    const bookingReference = `BK-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`.toUpperCase();

    // Create booking
    const newBooking = new Booking({
      activityId,
      bookingDate: new Date(bookingDate),
      numberOfAdults,
      numberOfChildren: numberOfChildren || 0,
      totalPrice,
      customerEmail,
      customerName,
      customerPhone,
      bookingReference,
      status: "confirmed" // Or "pending" if you want to implement payment processing
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      data: newBooking,
      message: "Booking created successfully"
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Create booking from cart
export const createBookingFromCart = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = req.query.sessionid as string;
    const { customerEmail, customerName, customerPhone } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    // Validate customer information
    if (!customerEmail || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: "Customer information is required" });
    }

    // Find cart
    const cart = await Cart.findOne({ sessionId });
    
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ success: false, message: "Cart not found or empty" });
    }

    // Create bookings for each cart item
    const bookings = [];
    
    for (const item of cart.items) {
      // Generate unique booking reference
      const bookingReference = `BK-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`.toUpperCase();
      
      const newBooking = new Booking({
        activityId: item.activityId,
        bookingDate: item.bookingDate,
        numberOfAdults: item.numberOfAdults,
        numberOfChildren: item.numberOfChildren,
        totalPrice: item.totalPrice,
        customerEmail,
        customerName,
        customerPhone,
        bookingReference,
        status: "confirmed" // Or "pending" if implementing payment processing
      });
      
      await newBooking.save();
      bookings.push(newBooking);
    }

    // Clear cart after successful booking
    cart.items = [];
    cart.totalAmount = 0;
    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({
      success: true,
      data: bookings,
      message: "Bookings created successfully"
    });
  } catch (error) {
    console.error("Error creating bookings from cart:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Get booking by reference
export const getBookingByReference = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reference } = req.params;

    const booking = await Booking.findOne({ bookingReference: reference })
      .populate({
        path: 'activityId',
        model: 'Activity',
        select: 'name images duration category'
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Get bookings by email
export const getBookingsByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const bookings = await Booking.find({ customerEmail: email })
      .populate({
        path: 'activityId',
        model: 'Activity',
        select: 'name images duration category'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reference } = req.params;

    const booking = await Booking.findOne({ bookingReference: reference });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};