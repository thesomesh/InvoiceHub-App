const express = require("express");

const {
  body,
  param,
} = require("express-validator");

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  recalculateInvoices,
  downloadInvoicePDF,
} = require(
  "../controllers/invoiceController"
);

const {
  protect,
} = require(
  "../middleware/auth"
);

const {
  handleValidationErrors,
} = require(
  "../middleware/errorHandler"
);

const router =
  express.Router();

// ========================================
// PROTECT ALL ROUTES
// ========================================

router.use(protect);

// ========================================
// PARAM VALIDATION
// ========================================

const mongoIdParam =
  param("id")
    .isMongoId()
    .withMessage(
      "Invalid invoice ID"
    );

// ========================================
// CREATE INVOICE
// ========================================

router.post(
  "/",

  [
    // ========================================
    // CUSTOMER
    // ========================================

    body("customer.name")
      .trim()
      .notEmpty()
      .withMessage(
        "Customer name is required"
      ),

    body("customer.phone")
      .trim()
      .notEmpty()
      .withMessage(
        "Customer phone is required"
      ),

    body("customer.email")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isEmail()
      .withMessage(
        "Customer email must be valid"
      ),

    // ========================================
    // ITEMS
    // ========================================

    body("items")
      .isArray({ min: 1 })
      .withMessage(
        "At least one item is required"
      ),

    body("items.*.name")
      .trim()
      .notEmpty()
      .withMessage(
        "Each item must have a name"
      ),

    body("items.*.qty")
      .isFloat({ min: 1 })
      .withMessage(
        "Item quantity must be >= 1"
      ),

    body("items.*.price")
      .isFloat({ min: 0 })
      .withMessage(
        "Item price must be >= 0"
      ),

    // ========================================
    // ITEM DISCOUNT
    // ========================================

    body(
      "items.*.discountRate"
    )
      .optional()
      .isFloat({
        min: 0,
        max: 100,
      })
      .withMessage(
        "Item discount must be between 0 and 100"
      ),

    // ========================================
    // TAX
    // ========================================

    body("taxRate")
      .optional()
      .isFloat({
        min: 0,
        max: 100,
      })
      .withMessage(
        "Tax rate must be between 0 and 100"
      ),

    body("taxPercentage")
      .optional()
      .isFloat({
        min: 0,
        max: 100,
      })
      .withMessage(
        "Tax percentage must be between 0 and 100"
      ),

    // ========================================
    // INVOICE DISCOUNT
    // ========================================

    body("discountRate")
      .optional()
      .isFloat({
        min: 0,
        max: 100,
      })
      .withMessage(
        "Discount rate must be between 0 and 100"
      ),

    body("discountPercentage")
      .optional()
      .isFloat({
        min: 0,
        max: 100,
      })
      .withMessage(
        "Discount percentage must be between 0 and 100"
      ),

    // ========================================
    // ROUND OFF
    // ========================================

    body("roundOff")
      .optional()
      .isFloat()
      .withMessage(
        "Round off must be a valid number"
      ),

    // ========================================
    // STATUS
    // ========================================

    body("status")
      .optional()
      .isIn([
        "pending",
        "partial",
        "paid",
        "cancelled",
      ])
      .withMessage(
        "Invalid invoice status"
      ),

    // ========================================
    // PAYMENT
    // ========================================

    body("amountPaid")
      .optional()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Amount paid must be >= 0"
      ),

    body("paymentMethod")
      .optional()
      .isString()
      .withMessage(
        "Payment method must be string"
      ),

    // ========================================
    // DATES
    // ========================================

    body("date")
      .optional()
      .isISO8601()
      .withMessage(
        "Date must be valid"
      ),

    body("dueDate")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Due date must be valid"
      ),

    // ========================================
    // NOTES
    // ========================================

    body("notes")
      .optional()
      .isString()
      .withMessage(
        "Notes must be string"
      ),
  ],

  handleValidationErrors,

  createInvoice
);

// ========================================
// GET ALL INVOICES
// ========================================

router.get(
  "/",
  getInvoices
);

// ========================================
// RECALCULATE OLD INVOICES
// ========================================

router.post(
  "/recalculate",
  recalculateInvoices
);

// ========================================
// GET SINGLE INVOICE
// ========================================

router.get(
  "/:id",

  mongoIdParam,

  handleValidationErrors,

  getInvoiceById
);

// ========================================
// UPDATE STATUS
// ========================================

router.patch(
  "/:id/status",

  [
    mongoIdParam,

    body("status")
      .isIn([
        "pending",
        "partial",
        "paid",
        "cancelled",
      ])
      .withMessage(
        "Invalid status"
      ),

    body("amountPaid")
      .optional()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Amount paid must be >= 0"
      ),
  ],

  handleValidationErrors,

  updateInvoiceStatus
);

// ========================================
// SUPPORT PUT ALSO
// ========================================

router.put(
  "/:id/status",

  [
    mongoIdParam,

    body("status")
      .isIn([
        "pending",
        "partial",
        "paid",
        "cancelled",
      ])
      .withMessage(
        "Invalid status"
      ),

    body("amountPaid")
      .optional()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Amount paid must be >= 0"
      ),
  ],

  handleValidationErrors,

  updateInvoiceStatus
);

// ========================================
// DELETE INVOICE
// ========================================

router.delete(
  "/:id",

  mongoIdParam,

  handleValidationErrors,

  deleteInvoice
);

// ========================================
// DOWNLOAD PDF
// ========================================

router.get(
  "/:id/pdf",

  mongoIdParam,

  handleValidationErrors,

  downloadInvoicePDF
);

module.exports = router;