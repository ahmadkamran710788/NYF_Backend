import express from "express";
import {
  getAllContinents,
  addContinent,
  getContinentById,
  deleteContinentById,
  editContinent
} from "../controllers/ContinentController";
import upload from "../middleware/uploadMiddleware";
const router = express.Router();

// @route   GET /api/continents
// @desc    Get all continents
// @access  Public
router.get("/", getAllContinents);
router.get("/:id", getContinentById);
router.delete("/:id", deleteContinentById);
router.put("/:id", upload.single("file"), editContinent);

// @route   POST /api/continents
// @desc    Add a new continent
// @access  Private/Admin
router.post("/", upload.single("file"), addContinent);

export default router;
