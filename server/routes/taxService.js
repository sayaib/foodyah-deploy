import express from "express";
import {
  getAllTaxServices,
  getTaxServicesByType,
  createTaxService,
  updateTaxService,
  deleteTaxService,
  calculateOrderFees
} from "../controller/taxServiceController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Get all tax and service fees
router.get("/", authMiddleware, getAllTaxServices);

// Get tax and service fees by type
router.get("/type/:type", authMiddleware, getTaxServicesByType);

// Create a new tax or service fee
router.post("/", authMiddleware, createTaxService);

// Update a tax or service fee
router.put("/:id", authMiddleware, updateTaxService);

// Delete a tax or service fee
router.delete("/:id", authMiddleware, deleteTaxService);

// Calculate applicable taxes and fees for an order
router.post("/calculate", calculateOrderFees);

export default router;