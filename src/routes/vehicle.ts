import express from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  
} from "../controllers/VehicleController";
import upload from "../middleware/uploadMiddleware";

const router = express.Router();



router.get("/", getAllVehicles);
router.post("/",upload.single("file"), createVehicle);
router.get("/:id", getVehicleById);

router.put("/:id",upload.single("file"), updateVehicle);
router.delete("/:id", deleteVehicle);


export default router;