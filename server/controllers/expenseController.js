const Expense = require("../models/Expense");

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
    createdBy: req.user._id,
    }).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
    });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create expense",
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Expense deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};