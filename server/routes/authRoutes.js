const express = require("express");

const { body } = require("express-validator");

const {
  register,
  login,
  getMe,
  updateMe,
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

const {
  handleValidationErrors,
} = require("../middleware/errorHandler");

const router = express.Router();

// REGISTER

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("businessName")
      .trim()
      .notEmpty()
      .withMessage("Business name is required"),

    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[\d\s\-()]{7,20}$/)
      .withMessage("Valid phone number is required"),

    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),

    body("gstin")
      .optional({ nullable: true, checkFalsy: true })
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      )
      .withMessage("Invalid GSTIN format"),
  ],

  handleValidationErrors,

  register
);

// LOGIN

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],

  handleValidationErrors,

  login
);

// GET PROFILE

router.get("/me", protect, getMe);

// UPDATE PROFILE

router.put(
  "/me",
  protect,
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[\d\s\-()]{7,20}$/)
      .withMessage("Valid phone number is required"),

    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),

    body("gstin")
      .optional({ nullable: true, checkFalsy: true })
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      )
      .withMessage("Invalid GSTIN format"),

    body("defaultTaxRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax rate must be between 0 and 100"),
  ],

  handleValidationErrors,

  updateMe
);

module.exports = router;