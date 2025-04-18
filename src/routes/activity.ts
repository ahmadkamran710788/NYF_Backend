import express from "express";
import {
  getAllActivities,
  getActivitiesByCategory,
  getActivitiesByContinent,
  addActivity,
  getAllCategory,
  getActivitiesWithoutPagination
  
} from "../controllers/ActivityController";
import upload from "../middleware/uploadMiddleware";
const router = express.Router();

// @route   GET /api/activities
// @desc    Get all activities with filtering
// @access  Public
router.get("/", getAllActivities);

router.get("/get-activity",getActivitiesWithoutPagination );

// @route   POST /api/activities
// @desc    Add a new activity
// @access  Private/Admin
router.post("/", upload.array("files", 10), addActivity);

// @route   GET /api/activities/categories/:category
// @desc    Get activities by category with filtering
// @access  Public
router.get("/categories/:category", getActivitiesByCategory);

// @route   GET /api/activities/continents/:continentId
// @desc    Get activities by continent with filtering
// @access  Public
router.get("/continents/:continentId", getActivitiesByContinent);
router.get("/category", getAllCategory);

export default router;
