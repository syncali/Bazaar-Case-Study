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
*(More sections for Stage 2 and 3 will be added later)*