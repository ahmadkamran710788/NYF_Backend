import express from "express";
import {
  createBooking,
  createBookingFromCart,
  getBookingByReference,
  getBookingsByEmail,
  cancelBooking
} from "../controllers/BookingController";

const router = express.Router();

router.post("/", createBooking);
router.post("/from-cart", createBookingFromCart);
router.get("/reference/:reference", getBookingByReference);
router.get("/email/:email", getBookingsByEmail);
router.put("/cancel/:reference", cancelBooking);

export default router;
