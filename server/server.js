require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const accountRoutes =
  require("./routes/accountRoutes");

const ledgerRoutes =
  require("./routes/ledgerRoutes");
  
const expenseRoutes = require("./routes/expenseRoutes");
const productRoutes =
  require("./routes/productRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use(
  "/api/products",
  productRoutes
);
app.use(
  "/api/expenses",
  expenseRoutes
);


app.use("/api/accounts", accountRoutes);
app.use("/api/ledger", ledgerRoutes);







// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5219;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

module.exports = app;
