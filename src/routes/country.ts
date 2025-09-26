// src/routes/countryRoutes.ts
import express from "express";
import { getAllCountries, addCountry,getCountryById, deleteCountryById,editCountry } from "../controllers/CountryController";
import { getActivitiesByCountry } from "../controllers/ActivityController";
import upload from "../middleware/uploadMiddleware";
const router = express.Router();

// @route   GET /api/countries
// @desc    Get all countries
// @access  Public
router.get("/", getAllCountries);
router.get("/:id", getCountryById);
router.delete("/:id", deleteCountryById);

router.put('/:id', upload.single('file'), editCountry);
// @route   POST /api/countries
// @desc    Add a new country
// @access  Private/Admin
router.post("/", upload.single("file"), addCountry);



// @route   GET /api/countries/:countryId/activities
// @desc    Get all activities in a country with filtering
// @access  Public
router.get("/:countryId/activities", getActivitiesByCountry);

export default router;
