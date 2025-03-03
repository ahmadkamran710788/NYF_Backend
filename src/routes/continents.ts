import express from "express";
import {
  getAllContinents,
  addContinent,
} from "../controllers/ContinentController";

const router = express.Router();

// @route   GET /api/continents
// @desc    Get all continents
// @access  Public
router.get("/", getAllContinents);

// @route   POST /api/continents
// @desc    Add a new continent
// @access  Private/Admin
router.post("/", addContinent);

export default router;
