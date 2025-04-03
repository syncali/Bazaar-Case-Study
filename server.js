"use strict";
require("dotenv").config();

const productService = require("./services/productService");
const storeService = require("./services/storeService");
const inventoryService = require("./services/inventoryService");

const express = require("express");
const { sequelize } = require("./models");
const { query, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// Auth middleware
const basicAuthMiddleware = require("./middleware/basicAuth");
app.use(basicAuthMiddleware);

// Product routes
app.post("/products", async (req, res, next) => {
  try {
    const { name } = req.body;
    const product = await productService.createProduct(name);
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    next(error);
  }
});

app.get("/products", async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// Store routes
app.post("/stores", async (req, res, next) => {
  try {
    const { name, location } = req.body;
    const store = await storeService.createStore(name, location);
    res.status(201).json({ message: "Store added successfully", store });
  } catch (error) {
    next(error);
  }
});

app.get("/stores", async (req, res, next) => {
  try {
    const stores = await storeService.getAllStores();
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
});

// Inventory routes
app.post("/stores/:storeId/stock-movements", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { productId, type, quantity } = req.body;

    const movement = await inventoryService.recordStockMovement({
      storeId: parseInt(storeId, 10),
      productId: parseInt(productId, 10),
      type,
      quantity,
    });

    res.status(201).json({
      message: "Stock movement recorded successfully",
      movement,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/stores/:storeId/inventory", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const inventory = await inventoryService.getStoreInventory(parseInt(storeId, 10));
    res.status(200).json({
      storeId: parseInt(storeId, 10),
      inventory,
    });
  } catch (error) {
    next(error);
  }
});

// Stock movements listing with validation
app.get(
  "/stock-movements",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage("Limit must be an integer between 1 and 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage("Offset must be a non-negative integer"),
    query("storeId").optional().isInt().toInt().withMessage("storeId must be an integer"),
    query("productId").optional().isInt().toInt().withMessage("productId must be an integer"),
    query("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("startDate must be a valid ISO8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("endDate must be a valid ISO8601 date"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await inventoryService.getStockMovements(req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Main route
// This route provides a welcome message and lists available endpoints
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Bazaar API",
    endpoints: {
      products: "/products",
      stores: "/stores",
      inventory: "/stores/:storeId/inventory",
      stockMovements: "/stores/:storeId/stock-movements",
    },
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  const statusCode = err.status || 500;

  if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(err.name)) {
    return res.status(400).json({
      error: err.errors ? err.errors.map((e) => e.message).join(", ") : "Validation failed",
    });
  }

  if (err.message.includes("not found")) {
    return res.status(404).json({ error: err.message });
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "An unexpected internal server error occurred." : err.message,
  });
});

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
