import express from "express";
import {
  createBooking,
  getBookingsByUser,
  updateBookingStatus,
} from "../controllers/BookingController";

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post("/", createBooking);

// @route   GET /api/bookings/user/:userId
// @desc    Get all bookings for a user
// @access  Private
router.get("/user/:userId", getBookingsByUser);

// @route   PATCH /api/bookings/:bookingId/status
// @desc    Update booking status
// @access  Private
router.patch("/:bookingId/status", updateBookingStatus);

export default router;
