// src/routes/customerRoutes.ts
import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomersNoPagination,
  getCustomerStats,
  getCustomersByCountry,
  bulkUpdateCustomerStatus
} from "../controllers/CustomerController";

const router = express.Router();

// GET /api/customers - Get all customers with search and pagination
router.get("/", getAllCustomers);

// GET /api/customers/customers-without-pagination - Get all customers without pagination
router.get("/customers-without-pagination", getAllCustomersNoPagination);

// GET /api/customers/stats - Get customer statistics
router.get("/stats", getCustomerStats);

// GET /api/customers/country/:country - Get customers by country
router.get("/country/:country", getCustomersByCountry);

// PUT /api/customers/bulk-update - Bulk update customer status
router.put("/bulk-update", bulkUpdateCustomerStatus);

// GET /api/customers/:id - Get customer by ID
router.get("/:id", getCustomerById);

// POST /api/customers - Add new customer
router.post("/", addCustomer);

// PUT /api/customers/:id - Update customer
router.put("/:id", updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", deleteCustomer);

export default router;