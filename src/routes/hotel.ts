// src/routes/hotelRoutes.ts
import { Router } from "express";
import {
  getAllHotels,
  getAllHotelsNoPagination,
  getHotelById,
  addHotel,
  updateHotel,
  deleteHotel,
  getHotelsByCity,
} from "../controllers/HotelController";

const router = Router();

// GET /api/hotels - Get all hotels with pagination
router.get("/", getAllHotels);

// GET /api/hotels/all - Get all hotels without pagination
router.get("/all", getAllHotelsNoPagination);

// GET /api/hotels/:id - Get hotel by ID
router.get("/:id", getHotelById);

// POST /api/hotels - Add new hotel
router.post("/", addHotel);

// PUT /api/hotels/:id - Update hotel
router.put("/:id", updateHotel);

// DELETE /api/hotels/:id - Delete hotel
router.delete("/:id", deleteHotel);

// GET /api/hotels/city/:cityId - Get hotels by city
router.get("/city/:cityId", getHotelsByCity);

export default router;