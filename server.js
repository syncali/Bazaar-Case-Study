"use strict";
require("dotenv").config();
const express = require("express");
const { sequelize, Product, Store, StockMovement } = require("./models");
const { Op, fn, col, literal } = require("sequelize");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

const basicAuthMiddleware = require("./middleware/basicAuth");
app.use(basicAuthMiddleware);

app.post("/products", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Product name is required." });
  }
  try {
    const product = await Product.create({ name });
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Product name already exists." });
    }
    console.error("API Error (POST /products):", error);
    res.status(500).json({ error: "Failed to add product." });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(products);
  } catch (error) {
    console.error("API Error (GET /products):", error);
    res.status(500).json({ error: "Failed to retrieve products." });
  }
});

app.post("/stores", async (req, res) => {
  const { name, location } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Store name is required." });
  }
  try {
    const store = await Store.create({ name, location });
    res.status(201).json({ message: "Store added successfully", store });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Store name already exists." });
    }
    console.error("API Error (POST /stores):", error);
    res.status(500).json({ error: "Failed to add store." });
  }
});

app.get("/stores", async (req, res) => {
  try {
    const stores = await Store.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(stores);
  } catch (error) {
    console.error("API Error (GET /stores):", error);
    res.status(500).json({ error: "Failed to retrieve stores." });
  }
});

app.post("/stores/:storeId/stock-movements", async (req, res) => {
  const { storeId } = req.params;
  const { productId, type, quantity } = req.body;
  const validTypes = ["in", "out", "manual"];

  if (!productId || !type || !quantity) {
    return res
      .status(400)
      .json({ error: "productId, type, and quantity are required." });
  }
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
    });
  }
  if (typeof quantity !== "number" || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "Quantity must be a positive number." });
  }

  try {
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ error: `Store with ID ${storeId} not found.` });
    }
    const product = await Product.findByPk(productId);
    if (!product) {
      return res
        .status(404)
        .json({ error: `Product with ID ${productId} not found.` });
    }

    const movement = await StockMovement.create({
      storeId: parseInt(storeId, 10),
      productId: parseInt(productId, 10),
      type,
      quantity,
    });
    res
      .status(201)
      .json({ message: "Stock movement recorded successfully", movement });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("API Error (POST /stores/:storeId/stock-movements):", error);
    res.status(500).json({ error: "Failed to record stock movement." });
  }
});

app.get("/stores/:storeId/inventory", async (req, res) => {
  const { storeId } = req.params;

  try {
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ error: `Store with ID ${storeId} not found.` });
    }

    const inventory = await StockMovement.findAll({
      attributes: [
        "productId",
        [
          fn("SUM", literal(`CASE WHEN type = 'in' THEN quantity ELSE 0 END`)),
          "totalIn",
        ],
        [
          fn(
            "SUM",
            literal(
              `CASE WHEN type IN ('out', 'manual') THEN quantity ELSE 0 END`
            )
          ),
          "totalOut",
        ],
      ],
      where: { storeId: storeId },
      group: ["productId", "Product.id"],
      include: [{ model: Product, attributes: ["name"] }],
    });

    const formattedInventory = inventory
      .map((item) => {
        const totalIn = parseInt(item.getDataValue("totalIn"), 10);
        const totalOut = parseInt(item.getDataValue("totalOut"), 10);
        return {
          productId: item.productId,
          productName: item.Product ? item.Product.name : "N/A",
          currentQuantity: totalIn - totalOut,
        };
      })
      .filter((item) => item.currentQuantity !== 0);

    res
      .status(200)
      .json({ storeId: parseInt(storeId, 10), inventory: formattedInventory });
  } catch (error) {
    console.error("API Error (GET /stores/:storeId/inventory):", error);
    res.status(500).json({ error: "Failed to retrieve store inventory." });
  }
});

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

const { query, validationResult } = require("express-validator");

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
    query("storeId")
      .optional()
      .isInt()
      .toInt()
      .withMessage("storeId must be an integer"),
    query("productId")
      .optional()
      .isInt()
      .toInt()
      .withMessage("productId must be an integer"),
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      limit = 20,
      offset = 0,
      storeId,
      productId,
      startDate,
      endDate,
    } = req.query;

    const whereClause = {};
    const dateRangeClause = {};

    if (storeId) {
      whereClause.storeId = storeId;
    }
    if (productId) {
      whereClause.productId = productId;
    }
    if (startDate) {
      dateRangeClause[Op.gte] = startDate;
    }
    if (endDate) {
      dateRangeClause[Op.lte] = endDate;
    }
    if (Object.keys(dateRangeClause).length > 0) {
      whereClause.createdAt = dateRangeClause;
    }

    try {
      const { count, rows } = await StockMovement.findAndCountAll({
        where: whereClause,
        include: [
          { model: Product, attributes: ["id", "name"] },
          { model: Store, attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        distinct: true, // Important for count when using include
      });

      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Math.floor(offset / limit) + 1,
        movements: rows,
      });
    } catch (error) {
      console.error("API Error (GET /stock-movements):", error);
      res.status(500).json({ error: "Failed to retrieve stock movements." });
    }
  }
);

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
