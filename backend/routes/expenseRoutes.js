
const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const router = express.Router();

const categories = ["Food", "Travel", "Bills", "Shopping", "Other"];

function validateExpense(data) {
  if (!data.title || !data.title.trim()) {
    return "Title is required.";
  }

  if (
    data.amount === "" ||
    data.amount === null ||
    data.amount === undefined ||
    !Number.isFinite(Number(data.amount)) ||
    Number(data.amount) <= 0
  ) {
    return "Amount must be greater than zero.";
  }

  if (!categories.includes(data.category)) {
    return "Please select a valid category.";
  }

  if (
    typeof data.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
  ) {
    return "Please provide a valid date.";
  }

  const parsedDate = new Date(`${data.date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== data.date
  ) {
    return "Please provide a valid date.";
  }

  return null;
}

// GET: View all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch expenses." });
  }
});

// POST: Add an expense
router.post("/", async (req, res) => {
  try {
    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const expense = await Expense.create({
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      category: req.body.category,
      date: new Date(`${req.body.date}T00:00:00.000Z`)
    });

    res.status(201).json({
      message: "Expense added successfully.",
      expense
    });
  } catch (error) {
    res.status(500).json({ message: "Could not add expense." });
  }
});

// PUT: Update an expense
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID." });
    }

    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title.trim(),
        amount: Number(req.body.amount),
        category: req.body.category,
        date: new Date(`${req.body.date}T00:00:00.000Z`)
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({
      message: "Expense updated successfully.",
      expense
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update expense." });
  }
});

// DELETE: Remove an expense
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID." });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete expense." });
  }
});

module.exports = router;
