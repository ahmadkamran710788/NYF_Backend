// import express from "express";
// import {
//   createBooking,
//   createBookingFromCart,
//   getBookingByReference,
//   getBookingsByEmail,
//   cancelBooking
// } from "../controllers/BookingController";

// const router = express.Router();

// router.post("/", createBooking);
// router.post("/from-cart", createBookingFromCart);
// router.get("/reference/:reference", getBookingByReference);
// router.get("/email/:email", getBookingsByEmail);
// router.put("/cancel/:reference", cancelBooking);

// export default router;


import express from 'express';
import { 
  createBooking,
  getBookingsByActivity,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingsByEmail,
  getAllBookingsWithPagination,
  getAllBookings
} from '../controllers/BookingController';

const router = express.Router();

router.post('/', createBooking);
router.get('/all/', getAllBookingsWithPagination);
router.get('/all-bookings', getAllBookings);
router.get('/activity/:activityId', getBookingsByActivity);
router.get('/:bookingId', getBookingById);
router.patch('/:bookingId/status', updateBookingStatus);
router.delete('/:bookingId', cancelBooking);
router.get('/email', getBookingsByEmail);

export default router;