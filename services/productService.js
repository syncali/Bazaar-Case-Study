const { Product } = require("../models");

/**
 * Create a new product
 * @param {string} name - Product name
 * @returns {Promise<Object>} Created product
 */
async function createProduct(name) {
  if (!name) {
    const error = new Error("Product name is required.");
    error.status = 400;
    throw error;
  }

  try {
    const product = await Product.create({ name });

    console.log("[CACHE STUB] Invalidating cache for all products list");

    return product;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const customError = new Error("Product name already exists.");
      customError.status = 409;
      throw customError;
    }
    throw error;
  }
}

/**
 * Get all products, ordered by name
 * @returns {Promise<Array>} List of products
 */
async function getAllProducts() {
  try {
    console.log("[CACHE STUB] Attempting to check cache for all products list");

    console.log("[CACHE STUB] Cache MISS for all products list");
    const products = await Product.findAll({ order: [["name", "ASC"]] });

    console.log("[CACHE STUB] Setting cache for all products list");

    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get product by ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Product
 */
async function getProductById(productId) {
  try {
    console.log(
      `[CACHE STUB] Attempting to check cache for product ID: ${productId}`
    );

    console.log(`[CACHE STUB] Cache MISS for product ID: ${productId}`);
    const product = await Product.findByPk(productId);

    if (!product) {
      const error = new Error(`Product with ID ${productId} not found.`);
      error.status = 404;
      throw error;
    }

    console.log(`[CACHE STUB] Setting cache for product ID: ${productId}`);

    return product;
  } catch (error) {
    throw error;
  }
}

module.exports = { createProduct, getAllProducts, getProductById };
