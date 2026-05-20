const express = require("express");
const { body, param } = require("express-validator");
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  recalculateInvoices,
  downloadInvoicePDF,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/errorHandler");

const router = express.Router();

router.use(protect);

const mongoIdParam = param("id").isMongoId().withMessage("Invalid invoice ID");

router.post(
  "/",
  [
    body("customer.name").trim().notEmpty().withMessage("Customer name is required"),
    body("customer.phone").trim().notEmpty().withMessage("Customer phone is required"),
    body("customer.email").optional({ nullable: true, checkFalsy: true }).isEmail().withMessage("Customer email must be valid"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.name").trim().notEmpty().withMessage("Each item must have a name"),
    body("items.*.qty").isFloat({ min: 1 }).withMessage("Item quantity must be >= 1"),
    body("items.*.price").isFloat({ min: 0 }).withMessage("Item price must be >= 0"),
    body("taxRate").optional().isFloat({ min: 0, max: 100 }).withMessage("Tax rate must be between 0 and 100"),
    body("taxPercentage").optional().isFloat({ min: 0, max: 100 }).withMessage("Tax percentage must be between 0 and 100"),
    body("discountRate").optional().isFloat({ min: 0, max: 100 }).withMessage("Discount rate must be between 0 and 100"),
    body("discountPercentage").optional().isFloat({ min: 0, max: 100 }).withMessage("Discount percentage must be between 0 and 100"),
    body("date").optional().isISO8601().withMessage("Date must be a valid ISO date"),
    body("dueDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Due date must be a valid ISO date"),
  ],
  handleValidationErrors,
  createInvoice
);

router.get("/", getInvoices);

router.post("/recalculate", recalculateInvoices);

router.get("/:id", mongoIdParam, handleValidationErrors, getInvoiceById);

router.patch(
  "/:id/status",
  [
    mongoIdParam,
   body("status").isIn([
  "pending",
  "partial",
  "paid",
  "cancelled",
]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  updateInvoiceStatus
);

router.put(
  "/:id/status",
  [
    mongoIdParam,
    body("status").isIn([
  "pending",
  "partial",
  "paid",
  "cancelled",
]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  updateInvoiceStatus
);

router.delete("/:id", mongoIdParam, handleValidationErrors, deleteInvoice);

router.get("/:id/pdf", mongoIdParam, handleValidationErrors, downloadInvoicePDF);

module.exports = router;
