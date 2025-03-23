// src/routes/index.ts
import express from "express";
import continentRoutes from "./continents";
import countryRoutes from "./country";
import cityRoutes from "./city";
import activityRoutes from "./activity";
import bookingRoutes from "./Booking";
import holidayPackageRoutes from "./holidayPackage";
const router = express.Router();

router.use("/continents", continentRoutes);
router.use("/countries", countryRoutes);
router.use("/cities", cityRoutes);
router.use("/activities", activityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/holidayPackages",holidayPackageRoutes );

export default router;
