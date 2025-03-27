// import { Request, Response } from "express";
// import { Booking } from "../models/Booking";
// import { Activity } from "../models/Activity";
// import { Cart } from "../models/Cart";
// import mongoose from "mongoose";
// import { v4 as uuidv4 } from "uuid";

// // Create booking directly (without cart)
// export const createBooking = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const {
//       activityId,
//       bookingDate,
//       numberOfAdults,
//       numberOfChildren,
//       customerEmail,
//       customerName,
//       customerPhone
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(activityId)) {
//       return res.status(400).json({ success: false, message: "Invalid activity ID format" });
//     }

//     // Validate required fields
//     if (!bookingDate || !numberOfAdults || !customerEmail || !customerName || !customerPhone) {
//       return res.status(400).json({ success: false, message: "Missing required booking information" });
//     }

//     // Check if activity exists
//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: "Activity not found" });
//     }

//     // Calculate total price
//     const pricePerAdult = activity.discountPrice || activity.originalPrice;
//     const pricePerChild = (activity.discountPrice || activity.originalPrice) * 0.7; // Assume 30% discount for children
//     const totalPrice = (numberOfAdults * pricePerAdult) + ((numberOfChildren || 0) * pricePerChild);

//     // Generate unique booking reference
//     const bookingReference = `BK-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`.toUpperCase();

//     // Create booking
//     const newBooking = new Booking({
//       activityId,
//       bookingDate: new Date(bookingDate),
//       numberOfAdults,
//       numberOfChildren: numberOfChildren || 0,
//       totalPrice,
//       customerEmail,
//       customerName,
//       customerPhone,
//       bookingReference,
//       status: "pending" // Or "pending" if you want to implement payment processing
//     });

//     await newBooking.save();

//     res.status(201).json({
//       success: true,
//       data: newBooking,
//       message: "Booking created successfully"
//     });
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
//   }
// };

// // Create booking from cart
// export const createBookingFromCart = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const sessionId = req.query.sessionid as string;
//     const { customerEmail, customerName, customerPhone } = req.body;

//     if (!sessionId) {
//       return res.status(400).json({ success: false, message: "Session ID is required" });
//     }

//     // Validate customer information
//     if (!customerEmail || !customerName || !customerPhone) {
//       return res.status(400).json({ success: false, message: "Customer information is required" });
//     }

//     // Find cart
//     const cart = await Cart.findOne({ sessionId });
    
//     if (!cart || cart.items.length === 0) {
//       return res.status(404).json({ success: false, message: "Cart not found or empty" });
//     }

//     // Create bookings for each cart item
//     const bookings = [];
    
//     for (const item of cart.items) {
//       // Generate unique booking reference
//       const bookingReference = `BK-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`.toUpperCase();
      
//       const newBooking = new Booking({
//         activityId: item.activityId,
//         bookingDate: item.bookingDate,
//         numberOfAdults: item.numberOfAdults,
//         numberOfChildren: item.numberOfChildren,
//         totalPrice: item.totalPrice,
//         customerEmail,
//         customerName,
//         customerPhone,
//         bookingReference,
//         status: "confirmed" // Or "pending" if implementing payment processing
//       });
      
//       await newBooking.save();
//       bookings.push(newBooking);
//     }

//     // Clear cart after successful booking
//     cart.items = [];
//     cart.totalAmount = 0;
//     cart.updatedAt = new Date();
//     await cart.save();

//     res.status(201).json({
//       success: true,
//       data: bookings,
//       message: "Bookings created successfully"
//     });
//   } catch (error) {
//     console.error("Error creating bookings from cart:", error);
//     res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
//   }
// };

// // Get booking by reference
// export const getBookingByReference = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { reference } = req.params;

//     const booking = await Booking.findOne({ bookingReference: reference })
//       .populate({
//         path: 'activityId',
//         model: 'Activity',
//         select: 'name images duration category'
//       });

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     res.status(200).json({
//       success: true,
//       data: booking
//     });
//   } catch (error) {
//     console.error("Error fetching booking:", error);
//     res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
//   }
// };

// // Get bookings by email
// export const getBookingsByEmail = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.params;

//     const bookings = await Booking.find({ customerEmail: email })
//       .populate({
//         path: 'activityId',
//         model: 'Activity',
//         select: 'name images duration category'
//       })
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings
//     });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
//   }
// };

// // Cancel booking
// export const cancelBooking = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { reference } = req.params;

//     const booking = await Booking.findOne({ bookingReference: reference });

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     booking.status = "cancelled";
//     await booking.save();

//     res.status(200).json({
//       success: true,
//       data: booking,
//       message: "Booking cancelled successfully"
//     });
//   } catch (error) {
//     console.error("Error cancelling booking:", error);
//     res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
//   }
// };


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking, BookingStatus, IBooking } from '../models/Booking';
import { Deal } from '../models/Deal';
import { Activity } from '../models/Activity';

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
 * Generate unique booking reference
 * @returns Unique booking reference string
 */
const generateBookingReference = (): string => {
  return `BOOK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

/**
 * Calculate total price for a booking
 * @param deal Deal object
 * @param bookingDate Booking date
 * @param numberOfAdults Number of adults
 * @param numberOfChildren Number of children
 * @returns Total price for the booking
 */
const calculateTotalPrice = (
  deal: any, 
  bookingDate: Date, 
  numberOfAdults: number, 
  numberOfChildren: number
): number => {
  // Find the most recent pricing for the booking date
  const pricing = deal.pricing
    .filter((p: any) => p.date <= bookingDate)
    .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())[0];

  if (!pricing) {
    throw new Error('No pricing found for the selected date');
  }

  // Calculate total price
  const adultPrice = pricing.adultPrice;
  const childPrice = pricing.childPrice;

  return (numberOfAdults * adultPrice) + (numberOfChildren * childPrice);
};

/**
 * Create a new booking
 * @param req Express request object
 * @param res Express response object
 */
export const createBooking = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  
  try {
    // Start a database transaction
    session.startTransaction();

    const { 
      activity, 
      deal, 
      bookingDate, 
      numberOfChildren, 
      numberOfAdults, 
      email, 
      phoneNumber 
    } = req.body;

    // Validate IDs
    if (!isValidObjectId(activity) || !isValidObjectId(deal)) {
      return res.status(400).json({ message: 'Invalid activity or deal ID' });
    }

    // Validate activity and deal exist
    const [existingActivity, existingDeal] = await Promise.all([
      Activity.findById(activity),
      Deal.findById(deal)
    ]);

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (!existingDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Calculate total price
    const totalPrice = calculateTotalPrice(
      existingDeal, 
      new Date(bookingDate), 
      numberOfAdults, 
      numberOfChildren
    );

    // Create new booking
    const newBooking = new Booking({
      activity,
      deal,
      bookingDate: new Date(bookingDate),
      numberOfChildren,
      numberOfAdults,
      totalPrice,
      email,
      phoneNumber,
      bookingReference: generateBookingReference(),
      status: BookingStatus.COMPLETED
    });

    // Save booking with transaction
    await newBooking.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (error) {
    // Abort transaction
    await session.abortTransaction();
    handleError(res, error, 'Error creating booking');
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Get bookings by activity
 * @param req Express request object
 * @param res Express response object
 */
export const getBookingsByActivity = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activityId } = req.params;

    // Validate activity ID
    if (!isValidObjectId(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    // Find bookings and populate related details
    const bookings = await Booking.find({ activity: activityId })
      .populate('activity', 'name')
      .populate('deal', 'title');

    res.status(200).json({
      message: 'Bookings retrieved successfully',
      bookings,
      count: bookings.length
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving bookings');
  }
};

/**
 * Get booking by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getBookingById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;

    // Validate booking ID
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    // Find booking and populate related details
    const booking = await Booking.findById(bookingId)
      .populate('activity', 'name description')
      .populate('deal', 'title description');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking retrieved successfully',
      booking
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving booking');
  }
};

/**
 * Update booking status
 * @param req Express request object
 * @param res Express response object
 */
export const updateBookingStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    // Validate booking ID
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    // Validate status
    if (!Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    // Update booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    handleError(res, error, 'Error updating booking status');
  }
};

/**
 * Cancel a booking
 * @param req Express request object
 * @param res Express response object
 */
export const cancelBooking = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();

  try {
    // Start a database transaction
    session.startTransaction();

    const { bookingId } = req.params;

    // Validate booking ID
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    // Find and update booking status to cancelled
    const cancelledBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: BookingStatus.REJECTED },
      { new: true, session }
    );

    if (!cancelledBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Commit transaction
    await session.commitTransaction();

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    });
  } catch (error) {
    // Abort transaction
    await session.abortTransaction();
    handleError(res, error, 'Error cancelling booking');
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Get bookings by email
 * @param req Express request object
 * @param res Express response object
 */
export const getBookingsByEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.query;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid email provided' });
    }

    // Find bookings for the email
    const bookings = await Booking.find({ email })
      .populate('activity', 'name')
      .populate('deal', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Bookings retrieved successfully',
      bookings,
      count: bookings.length
    });
  } catch (error) {
    handleError(res, error, 'Error retrieving bookings');
  }
};





