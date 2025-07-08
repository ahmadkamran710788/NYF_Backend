// src/routes/supplierRoutes.ts
import express from "express";
import {
  getAllSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersByLocation,
  getSupplierStats,
  getAllSuppliersNoPagination
} from "../controllers/SupplierController";

const router = express.Router();

// GET /api/suppliers - Get all suppliers with search and pagination
router.get("/", getAllSuppliers);
router.get("/supplier-without-pagination/", getAllSuppliersNoPagination);

// GET /api/suppliers/stats - Get supplier statistics
router.get("/stats", getSupplierStats);

// GET /api/suppliers/location - Get suppliers by location
router.get("/location", getSuppliersByLocation);

// GET /api/suppliers/:id - Get supplier by ID
router.get("/:id", getSupplierById);

// POST /api/suppliers - Add new supplier
router.post("/", addSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put("/:id", updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier
router.delete("/:id", deleteSupplier);

export default router;