// src/routes/countryRoutes.ts
import express from "express";
import { getAllCountries, addCountry } from "../controllers/CountryController";
import { getActivitiesByCountry } from "../controllers/ActivityController";

const router = express.Router();

// @route   GET /api/countries
// @desc    Get all countries
// @access  Public
router.get("/", getAllCountries);

// @route   POST /api/countries
// @desc    Add a new country
// @access  Private/Admin
router.post("/", addCountry);

// @route   GET /api/countries/:countryId/activities
// @desc    Get all activities in a country with filtering
// @access  Public
router.get("/:countryId/activities", getActivitiesByCountry);

export default router;
