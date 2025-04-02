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

### Stage 2 Enhancements (Implemented Day 3)

* **Reporting Endpoint:** Added `GET /stock-movements` allowing filtering by `storeId`, `productId`, `startDate`, `endDate`, along with pagination (`limit`, `offset`). Provides visibility into stock movement history.
* **Basic Authentication:** Implemented HTTP Basic Authentication as a global middleware to protect all API endpoints. Credentials are configurable via environment variables (`BASIC_AUTH_USER`, `BASIC_AUTH_PASS`). *Note: Basic Auth sends credentials in plain text (Base64 encoded) and is not suitable for production environments without HTTPS.*
* **Rate Limiting:** Implemented global API rate limiting using `express-rate-limit` to prevent abuse and ensure service stability. Limits are configured per IP address over a time window.

### API Endpoints (Stage 2)

*All endpoints require Basic Authentication.*

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
* **`GET /stock-movements`**: List and filter stock movements across stores/products.
    * Query Parameters: `limit` (int, default 20), `offset` (int, default 0), `storeId` (int), `productId` (int), `startDate` (ISO8601), `endDate` (ISO8601).
    * Response (200): `{ "totalItems": integer, "totalPages": integer, "currentPage": integer, "movements": [ { ...movement details with Product and Store info... } ] }`

---

## Stage 3: Large-Scale Distributed System (Design)

### Introduction

This stage outlines the architectural design considerations to scale the inventory system to support thousands of stores, handle high concurrency, achieve near real-time synchronization, and incorporate robust auditing. The focus here is on the *design principles* and *architectural patterns* rather than full implementation within the 5-day timeframe.

### Horizontal Scalability

* **Concept:** Run multiple instances of the stateless Node.js/Express application behind a load balancer (e.g., Nginx, AWS ELB). The load balancer distributes incoming API requests across the available instances.
* **Statelessness:** API servers must be stateless. No user-specific session data or state should be stored in the memory of an individual instance. Authentication (currently Basic Auth) is inherently stateless per request. If more complex session management were needed, it would require external stores (like Redis or database sessions) or stateless tokens (like JWT).
* **Database Scaling:** While the API scales horizontally, the database often requires separate scaling strategies (see Read/Write Separation). Effective connection pooling is essential at the application layer.

### Asynchronous Processing (Event-Driven Architecture)

* **Problem:** Handling complex operations (updating inventory, writing audit logs, notifying other systems) directly within an API request handler can lead to slow response times and tight coupling under high load.
* **Solution:** Introduce a message queue (e.g., RabbitMQ, Kafka, AWS SQS) to decouple tasks.
* **Proposed Flow:**
    1.  API receives write requests (e.g., stock movement).
    2.  API performs initial validation and publishes an event (e.g., `StockMovementReceived`) to the queue with necessary data.
    3.  API responds quickly to the client (e.g., 202 Accepted).
    4.  Independent worker services consume events from the queue.
    5.  Workers perform the database operations (inserting movement, updating aggregates if any, logging audits) within a transaction.
* **Benefits:** Improved API responsiveness, increased resilience (failed operations can be retried from the queue), better scalability (workers can scale independently), service decoupling.
* **Trade-offs:** Introduces eventual consistency (data updates are not instantaneous after the API call), adds operational complexity (managing the queue and workers).

### Caching

* **Problem:** Frequent database reads for data that changes infrequently (product details, store info) or complex calculations (inventory summaries) can increase load and latency.
* **Solution:** Implement a distributed caching layer using systems like Redis or Memcached.
* **Caching Candidates & Strategy:**
    * **Product/Store Details:** Cache frequently accessed product or store data keyed by their IDs. Use a Cache-Aside strategy with appropriate TTL and explicit invalidation on updates.
    * **Inventory Counts:** Caching calculated inventory (`/stores/:storeId/inventory`) is challenging due to frequent changes. It might be more practical to cache components (like product names) or accept slightly stale data with a short TTL if business requirements allow. Alternatively, focus on optimizing the database query itself.
* **Invalidation:** Crucial for data consistency. Use TTLs, and implement explicit cache clearing logic within the services that update the underlying data (e.g., after a product name change or successful stock movement processing by a worker).

### Database Read/Write Separation

* **Problem:** High read volume (e.g., from reporting, inventory checks) can contend with write operations on the primary database, impacting performance.
* **Solution:** Utilize PostgreSQL's streaming replication feature to create one or more read-only replicas of the primary database.
* **Implementation Concept:** Configure the application (potentially via Sequelize or connection logic) to direct all write operations (`INSERT`, `UPDATE`, `DELETE`) to the primary database instance and route read-heavy queries (`SELECT` operations from reporting, listing endpoints) to the read replicas.
* **Considerations:** Managing connections to different database roles (primary vs. replica), potential for replication lag (reads from replicas might be slightly behind the primary), increased infrastructure complexity.

### Audit Logging (Design)

* **Purpose:** Maintain an immutable record of significant actions and data changes within the system for security analysis, compliance, debugging, and accountability.
* **Proposed Schema (`AuditLogs` Table):**
    * `id`: BIGSERIAL or UUID (Primary Key)
    * `timestamp`: TIMESTAMP WITH TIME ZONE (Indexed)
    * `userId`: TEXT or INTEGER (Identifier of the actor, null if system) (Indexed)
    * `actionType`: TEXT (e.g., 'PRODUCT_CREATE', 'STOCK_IN', 'STORE_UPDATE') (Indexed)
    * `entityType`: TEXT (e.g., 'Product', 'Store', 'StockMovement') (Indexed)
    * `entityId`: TEXT or INTEGER (ID of the affected entity) (Indexed)
    * `details`: JSONB (Stores contextual info, old/new values, IP address, etc.)
* **Implementation Strategy:** Integrate audit log creation into the application logic, ideally within the worker services processing asynchronous events. The audit record creation should be part of the same database transaction as the data change itself to ensure atomicity. This provides flexibility to include rich application context in the `details` field.

### Concurrency and Transactions

* **Importance:** Ensure data integrity under concurrent operations, especially as the system scales.
* **Transactions:** All operations involving multiple related database writes (e.g., creating a movement and potentially updating an aggregate inventory table, plus writing an audit log) *must* be wrapped in a database transaction (`sequelize.transaction(...)`) to guarantee atomicity.
* **Locking:** While the current movement-logging approach minimizes direct read-modify-write conflicts on a single quantity field, be mindful of potential race conditions in more complex future scenarios. Employ database-level locking (pessimistic or optimistic) if needed to serialize access to critical resources during transactions.

---