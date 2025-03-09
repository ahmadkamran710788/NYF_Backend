import express from "express";
import {
  getAllContinents,
  addContinent,
} from "../controllers/ContinentController";
import upload from "../middleware/uploadMiddleware";
const router = express.Router();

// @route   GET /api/continents
// @desc    Get all continents
// @access  Public
router.get("/", getAllContinents);

// @route   POST /api/continents
// @desc    Add a new continent
// @access  Private/Admin
router.post("/", upload.single("file"), addContinent);

export default router;
