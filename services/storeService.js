const { Store } = require("../models");

/**
 * Create a new store
 * @param {string} name - Store name
 * @param {string} location - Store location (optional)
 * @returns {Promise<Object>} Created store
 */
async function createStore(name, location) {
  if (!name) {
    const error = new Error("Store name is required.");
    error.status = 400;
    throw error;
  }

  try {
    const store = await Store.create({ name, location });

    console.log("[CACHE STUB] Invalidating cache for all stores list");

    return store;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const customError = new Error("Store name already exists.");
      customError.status = 409;
      throw customError;
    }
    throw error;
  }
}

/**
 * Get all stores, ordered by name
 * @returns {Promise<Array>} List of stores
 */
async function getAllStores() {
  try {
    console.log("[CACHE STUB] Attempting to check cache for all stores list");

    console.log("[CACHE STUB] Cache MISS for all stores list");
    const stores = await Store.findAll({ order: [["name", "ASC"]] });

    console.log("[CACHE STUB] Setting cache for all stores list");

    return stores;
  } catch (error) {
    throw error;
  }
}

/**
 * Get store by ID
 * @param {number} storeId - Store ID
 * @returns {Promise<Object>} Store
 */
async function getStoreById(storeId) {
  try {
    console.log(
      `[CACHE STUB] Attempting to check cache for store ID: ${storeId}`
    );

    console.log(`[CACHE STUB] Cache MISS for store ID: ${storeId}`);
    const store = await Store.findByPk(storeId);

    if (!store) {
      const error = new Error(`Store with ID ${storeId} not found.`);
      error.status = 404;
      throw error;
    }

    console.log(`[CACHE STUB] Setting cache for store ID: ${storeId}`);

    return store;
  } catch (error) {
    throw error;
  }
}

module.exports = { createStore, getAllStores, getStoreById };
