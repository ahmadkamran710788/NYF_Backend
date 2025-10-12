import { Router } from "express";
import upload from "../middleware/uploadMiddleware"; // Adjust path based on your project structure
import * as comboOfferController from "../controllers/OfferController";

const router = Router();

/**
 * PUBLIC ROUTES
 */

// Get all combo offers with pagination and filtering
// Query params: page, limit, country, city, category, isActive, isPopular, currency
// Example: GET /nyf/offer?page=1&limit=10&country=UAE&city=Dubai&currency=AED
router.get("/", comboOfferController.getAllComboOffers);

// Get combo offer by ID
// Query params: currency
// Example: GET /nyf/offer/123456?currency=USD
router.get("/:id", comboOfferController.getComboOfferById);

// Get combo offer by permalink (SEO friendly URL)
// Query params: currency
// Example: GET /nyf/offer/permalink/warner-bros-qasr-al-watan
router.get("/permalink/:permalink", comboOfferController.getComboOfferByPermalink);

// Get combo offers by location
// Params: country, city
// Query params: currency, isActive
// Example: GET /nyf/offer/location/United Arab Emirates/Abu Dhabi?currency=USD
router.get(
  "/location/:country/:city",
  comboOfferController.getComboOffersByLocation
);

// Search combo offers
// Query params: q (search query), currency, limit
// Example: GET /nyf/offer/search/query?q=warner+bros&currency=USD&limit=10
router.get("/search/query", comboOfferController.searchComboOffers);

// Get pricing summary for combo offer
// Params: id
// Query params: currency
// Example: GET /nyf/offer/123456/pricing?currency=USD
// router.get("/:id/pricing", comboOfferController.getComboOfferPricingSummary);

/**
 * ADMIN ROUTES (Protected by authentication middleware in main app)
 */

// Create new combo offer with multiple featured images
// Body: All combo offer fields (actualPrice, discountedPrice, costPrice required)
// Files: Multiple images (optional, accepts multiple files)
// Example: POST /nyf/offer
router.post(
  "/",
  upload.array("images", 10), // Accept up to 10 images
  comboOfferController.createComboOffer
);

// Update combo offer
// Params: id
// Body: Fields to update (actualPrice, discountedPrice)
// Files: Multiple images (optional, accepts multiple files)
// Example: PUT /nyf/offer/123456
router.put(
  "/:id",
  upload.array("images", 10), // Accept up to 10 images
  comboOfferController.updateComboOffer
);

// Delete combo offer
// Params: id
// Example: DELETE /nyf/offer/123456
router.delete("/:id", comboOfferController.deleteComboOffer);

export default router;