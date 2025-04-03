const { sequelize, Product, Store, StockMovement } = require("../models");
const { createAuditLog } = require("./auditService");
const { queueStockUpdateEvent } = require("./queueService");
const { Op, fn, literal } = require("sequelize");

/**
 * Record a stock movement
 * @param {Object} params - Movement parameters
 * @param {number} params.storeId - Store ID
 * @param {number} params.productId - Product ID
 * @param {string} params.type - Movement type ('in', 'out', or 'manual')
 * @param {number} params.quantity - Movement quantity
 * @returns {Promise<Object>} Created movement
 */
async function recordStockMovement({ storeId, productId, type, quantity }) {
  const validTypes = ["in", "out", "manual"];
  if (!validTypes.includes(type)) {
    const error = new Error(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    error.status = 400;
    throw error;
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    const error = new Error("Quantity must be a positive number.");
    error.status = 400;
    throw error;
  }

  try {
    // Ensure store and product exist
    const store = await Store.findByPk(storeId);
    if (!store) {
      const error = new Error(`Store with ID ${storeId} not found.`);
      error.status = 404;
      throw error;
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      const error = new Error(`Product with ID ${productId} not found.`);
      error.status = 404;
      throw error;
    }

    // Create movement with transaction
    const result = await sequelize.transaction(async (t) => {
      const movement = await StockMovement.create(
        {
          storeId: parseInt(storeId, 10),
          productId: parseInt(productId, 10),
          type,
          quantity,
        },
        { transaction: t }
      );

      await createAuditLog({
        userId: "system",
        actionType: `STOCK_${type.toUpperCase()}`,
        entityType: "StockMovement",
        entityId: movement.id,
        details: {
          storeId: movement.storeId,
          productId: movement.productId,
          quantity: movement.quantity,
        },
        transaction: t,
      });

      return movement;
    });

    // Queue event after successful commit
    try {
      await queueStockUpdateEvent({
        movementId: result.id,
        storeId: result.storeId,
        productId: result.productId,
        type: result.type,
      });
    } catch (queueError) {
      console.error("[QUEUE STUB] Failed to queue event:", queueError);
    }

    // Cache invalidation
    console.log(`[CACHE STUB] Invalidating cache for store inventory ID: ${storeId}`);

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get inventory for a store
 * @param {number} storeId - Store ID
 * @returns {Promise<Array>} Inventory items
 */
async function getStoreInventory(storeId) {
  try {
    console.log(`[CACHE STUB] Attempting to check cache for store inventory ID: ${storeId}`);

    console.log(`[CACHE STUB] Cache MISS for store inventory ID: ${storeId}`);

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      const error = new Error(`Store with ID ${storeId} not found.`);
      error.status = 404;
      throw error;
    }

    const inventory = await StockMovement.findAll({
      attributes: [
        "productId",
        [fn("SUM", literal(`CASE WHEN type = 'in' THEN quantity ELSE 0 END`)), "totalIn"],
        [
          fn("SUM", literal(`CASE WHEN type IN ('out', 'manual') THEN quantity ELSE 0 END`)),
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

    console.log(`[CACHE STUB] Setting cache for store inventory ID: ${storeId}`);

    return formattedInventory;
  } catch (error) {
    throw error;
  }
}

/**
 * Get stock movements with filtering
 * @param {Object} options - Filter options
 * @param {number} [options.limit=20] - Results per page
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {number} [options.storeId] - Filter by store ID
 * @param {number} [options.productId] - Filter by product ID
 * @param {Date} [options.startDate] - Filter by start date
 * @param {Date} [options.endDate] - Filter by end date
 * @returns {Promise<Object>} Movements with pagination info
 */
async function getStockMovements({
  limit = 20,
  offset = 0,
  storeId,
  productId,
  startDate,
  endDate,
}) {
  try {
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

    const { count, rows } = await StockMovement.findAndCountAll({
      where: whereClause,
      include: [
        { model: Product, attributes: ["id", "name"] },
        { model: Store, attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      distinct: true,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Math.floor(offset / limit) + 1,
      movements: rows,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { recordStockMovement, getStoreInventory, getStockMovements };
