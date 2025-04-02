# Bazaar-Case-Study

# Bazaar Inventory Tracking Backend Service

This project implements a backend service for tracking product inventory, designed to evolve from a single store to a multi-store, scalable system.

## Stage 1: Single Store MVP

### Overview

* Tracks products and stock movements (in, out, manual) for a single store.
* Uses Node.js, Express, and SQLite for local data storage.
* Provides basic API endpoints for core actions.

### Setup

1.  Clone the repository (or download the code).
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
    * The server will start on `http://localhost:3000`.
    * A SQLite database file named `inventory.db` will be created in the project root.

### Assumptions (Stage 1)

* Focus is on a single, implicit store. No multi-store support yet.
* Simple data model focusing on products and movements.
* Quantity is calculated dynamically from movements.
* No user authentication or authorization.
* Error handling is basic.

### API Endpoints (Stage 1)

* **`POST /products`**: Add a new product.
    * Request Body: `{ "name": "string" }`
    * Success Response (201): `{ "message": "Product added successfully", "productId": integer }`
    * Error Responses: 400 (Bad Request), 409 (Conflict - name exists), 500 (Server Error)
* **`POST /stock-movements`**: Record a stock movement.
    * Request Body: `{ "productId": integer, "type": "string ('in'|'out'|'manual')", "quantity": integer }`
    * Success Response (201): `{ "message": "Stock movement recorded successfully", "movementId": integer }`
    * Error Responses: 400 (Bad Request), 404 (Product Not Found), 500 (Server Error)
* **`GET /products/:productId/quantity`**: Get the current calculated quantity for a product.
    * URL Parameter: `productId` (integer)
    * Success Response (200): `{ "productId": integer, "currentQuantity": integer }`
    * Error Responses: 500 (Server Error)

---
## Stage 2: Multi-Store Expansion

### Overview

* Migrated from SQLite to **PostgreSQL**.
* Introduced **Sequelize ORM** for database interaction and migrations.
* Added support for **multiple stores**, each with its own inventory tracked via stock movements.
* Refactored API to be more **RESTful** and store-centric.
* Uses **environment variables** for configuration (database credentials).

### Setup (Stage 2 Specific)

1.  Ensure PostgreSQL is running and accessible.
2.  Create a database (e.g., `bazaar_inventory_dev`).
3.  Create a `.env` file in the project root (see `.env.example` or instructions below).
4.  Install dependencies: `npm install`
5.  Run database migrations: `npx sequelize-cli db:migrate`
6.  Run the development server: `npm run dev`

### Environment Variables (.env)

------
Create a `.env` file with the following variables:
DB_USER=your_postgres_username
DB_PASS=your_postgres_password
DB_NAME=bazaar_inventory_dev
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
PORT=3000
------

### Rationale for Changes

* **PostgreSQL:** Provides better scalability, concurrency, and feature set compared to SQLite for a growing application.
* **Sequelize:** Simplifies database interactions, provides robust migration management, and helps structure model definitions and associations.
* **Multi-Store:** Essential requirement for expansion, achieved by adding a `Stores` table and associating `StockMovements` with a specific `storeId`.
* **RESTful API:** Standard approach for building web services, makes the API more predictable and easier to consume.

### API Endpoints (Stage 2)

* **`POST /products`**: Add a new product (central catalog).
    * Request Body: `{ "name": "string" }`
    * Response (201): `{ "message": "...", "product": { ... } }`
* **`GET /products`**: List all products.
    * Response (200): `[ { "id": ..., "name": ..., "createdAt": ..., "updatedAt": ... } ]`
* **`POST /stores`**: Add a new store.
    * Request Body: `{ "name": "string", "location": "string" (optional) }`
    * Response (201): `{ "message": "...", "store": { ... } }`
* **`GET /stores`**: List all stores.
     * Response (200): `[ { "id": ..., "name": ..., "location": ..., "createdAt": ..., "updatedAt": ... } ]`
* **`POST /stores/:storeId/stock-movements`**: Record a stock movement for a specific store.
    * URL Parameter: `storeId`
    * Request Body: `{ "productId": integer, "type": "string ('in'|'out'|'manual')", "quantity": integer }`
    * Response (201): `{ "message": "...", "movement": { ... } }`
* **`GET /stores/:storeId/inventory`**: Get the current calculated inventory for all products in a specific store.
    * URL Parameter: `storeId`
    * Response (200): `{ "storeId": integer, "inventory": [ { "productId": integer, "productName": "string", "currentQuantity": integer } ] }`

*(Removed `GET /products/:productId/quantity` as inventory is now store-specific)*

---

