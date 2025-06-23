import express from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getPackagesByDestination,
  getPackagesByType,
  addPackageImages,
  getPackagesByDestinationName,
  removePackageImages
} from "../controllers/HolidayController";
import upload from "../middleware/uploadMiddleware";

const router = express.Router();



router.get("/", getAllPackages);
router.post("/",upload.array("files", 10), createPackage);
router.get("/:id", getPackageById);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);
router.post("/:id/images",upload.array("files", 10), addPackageImages);
router.delete("/images/:id", removePackageImages);


// Additional routes
router.get("/destination/:destinationId", getPackagesByDestination);
router.get("/destinationname/:destinationName", getPackagesByDestinationName);
router.get("/type/:type", getPackagesByType);

export default router;