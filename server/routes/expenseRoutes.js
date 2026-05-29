const express = require("express");

const {
  getExpenses,
  createExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, getExpenses)
  .post(protect, createExpense);

router
  .route("/:id")
  .delete(protect, deleteExpense);

module.exports = router;