// src/routes/cityRoutes.ts
import express from "express";
import { getAllCities, addCity,getCityById } from "../controllers/CityController";
import { getActivitiesByCity } from "../controllers/ActivityController";
import upload from "../middleware/uploadMiddleware";
const router = express.Router();

// @route   GET /api/cities
// @desc    Get all cities
// @access  Public
router.get("/", getAllCities);
router.get("/:id", getCityById);

// @route   POST /api/cities
// @desc    Add a new city
// @access  Private/Admin
router.post("/", upload.single("file"), addCity);

// @route   GET /api/cities/:cityId/activities
// @desc    Get all activities in a city with filtering
// @access  Public
router.get("/:cityId/activities", getActivitiesByCity);

export default router;
