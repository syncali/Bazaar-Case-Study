# Bazaar Inventory Tracking Backend Service

This project implements a backend service for tracking product inventory, designed to evolve from a single store to a multi-store, scalable system.

## Table of Contents

- [Stage 1: Single Store MVP](#stage-1-single-store-mvp)
- [Stage 2: Multi-Store Expansion](#stage-2-multi-store-expansion)
- [Stage 3: Large-Scale Distributed System](#stage-3-large-scale-distributed-system-design--partial-implementation)
- [Evolution Rationale](#evolution-rationale)
- [Key Assumptions](#key-assumptions)
- [Code Structure and Practices](#code-structure-and-practices)
- [Setup Instructions](#setup-instructions)

## Stage 1: Single Store MVP

### Overview

- Tracks products and stock movements (in, out, manual) for a single store.
- Uses Node.js, Express, and SQLite for local data storage.
- Provides basic API endpoints for core actions.

### Assumptions (Stage 1)

- Focus is on a single, implicit store. No multi-store support yet.
- Simple data model focusing on products and movements.
- Quantity is calculated dynamically from movements.
- No user authentication or authorization.
- Error handling is basic.

### API Endpoints (Stage 1)

- **`POST /products`**: Add a new product.
  - Request Body: `{ "name": "string" }`
  - Success Response (201): `{ "message": "Product added successfully", "productId": integer }`
  - Error Responses: 400 (Bad Request), 409 (Conflict - name exists), 500 (Server Error)
- **`POST /stock-movements`**: Record a stock movement.
  - Request Body: `{ "productId": integer, "type": "string ('in'|'out'|'manual')", "quantity": integer }`
  - Success Response (201): `{ "message": "Stock movement recorded successfully", "movementId": integer }`
  - Error Responses: 400 (Bad Request), 404 (Product Not Found), 500 (Server Error)
- **`GET /products/:productId/quantity`**: Get the current calculated quantity for a product.
  - URL Parameter: `productId` (integer)
  - Success Response (200): `{ "productId": integer, "currentQuantity": integer }`
  - Error Responses: 500 (Server Error)

---

## Stage 2: Multi-Store Expansion

### Overview

- Migrated from SQLite to **PostgreSQL**.
- Introduced **Sequelize ORM** for database interaction and migrations.
- Added support for **multiple stores**, each with its own inventory tracked via stock movements.
- Refactored API to be more **RESTful** and store-centric.
- Uses **environment variables** for configuration (database credentials).
- Added **authentication** and **rate limiting** for API security.

### Rationale for Changes

- **PostgreSQL:** Provides better scalability, concurrency, and feature set compared to SQLite for a growing application.
- **Sequelize:** Simplifies database interactions, provides robust migration management, and helps structure model definitions and associations.
- **Multi-Store:** Essential requirement for expansion, achieved by adding a `Stores` table and associating `StockMovements` with a specific `storeId`.
- **RESTful API:** Standard approach for building web services, makes the API more predictable and easier to consume.
- **Authentication & Rate Limiting:** Basic security measures to prevent unauthorized access and protect against abuse.

### API Endpoints (Stage 2)

_All endpoints require Basic Authentication._

- **`POST /products`**: Add a new product (central catalog).
  - Request Body: `{ "name": "string" }`
  - Response (201): `{ "message": "Product added successfully", "product": { "id": 1, "name": "Product Name", "createdAt": "2025-04-03T..." } }`
- **`GET /products`**: List all products.
  - Response (200): `[ { "id": 1, "name": "Product Name", "createdAt": "2025-04-03T...", "updatedAt": "2025-04-03T..." } ]`
- **`POST /stores`**: Add a new store.
  - Request Body: `{ "name": "string", "location": "string" (optional) }`
  - Response (201): `{ "message": "Store added successfully", "store": { "id": 1, "name": "Store Name", "location": "Location", "createdAt": "2025-04-03T..." } }`
- **`GET /stores`**: List all stores.
  - Response (200): `[ { "id": 1, "name": "Store Name", "location": "Location", "createdAt": "2025-04-03T...", "updatedAt": "2025-04-03T..." } ]`
- **`POST /stores/:storeId/stock-movements`**: Record a stock movement for a specific store.
  - URL Parameter: `storeId`
  - Request Body: `{ "productId": integer, "type": "string ('in'|'out'|'manual')", "quantity": integer }`
  - Response (201): `{ "message": "Stock movement recorded successfully", "movement": { "id": 1, "storeId": 1, "productId": 1, "type": "in", "quantity": 10, "createdAt": "2025-04-03T..." } }`
- **`GET /stores/:storeId/inventory`**: Get the current calculated inventory for all products in a specific store.
  - URL Parameter: `storeId`
  - Response (200): `{ "storeId": 1, "inventory": [ { "productId": 1, "productName": "Product Name", "currentQuantity": 10 } ] }`
- **`GET /stock-movements`**: List and filter stock movements across stores/products.
  - Query Parameters: `limit` (int, default 20), `offset` (int, default 0), `storeId` (int), `productId` (int), `startDate` (ISO8601), `endDate` (ISO8601).
  - Response (200): `{ "totalItems": 50, "totalPages": 3, "currentPage": 1, "movements": [ { "id": 1, "storeId": 1, "productId": 1, "type": "in", "quantity": 10, "createdAt": "2025-04-03T...", "Product": { "id": 1, "name": "Product Name" }, "Store": { "id": 1, "name": "Store Name" } } ] }`

---

## Stage 3: Large-Scale Distributed System (Design & Partial Implementation)

### Introduction

This stage focuses on scaling the inventory system to support thousands of stores, handle high concurrency, achieve near real-time synchronization, and incorporate robust auditing. While the full implementation requires significant infrastructure (message queues, caches, etc.), the design principles are outlined below, and foundational elements (Audit Logging) or integration points (Async/Caching Stubs) have been implemented.

### Horizontal Scalability (Design)

- **Concept:** Run multiple instances of the stateless Node.js/Express application behind a load balancer.
- **Statelessness:** API servers are designed to be stateless. State is managed externally (database, cache) or via request context (auth).
- **Database Scaling:** Requires separate strategies like connection pooling and potentially read replicas.

### Asynchronous Processing (Event-Driven Architecture) (Design + Stub)

- **Concept:** Decouple time-consuming tasks from the API request cycle using a message queue (e.g., RabbitMQ, Kafka).
- **Flow:** API publishes events (e.g., `StockMovementReceived`) -> Worker services consume events and process them (DB updates, audit logs).
- **Benefits:** Improved API responsiveness, resilience, scalability.
- **Trade-offs:** Eventual consistency, added operational complexity.
- **Implementation Status:** **Stubbed Integration.** A placeholder service (`services/queueService.js`) and function (`queueStockUpdateEvent`) have been created. This function is called _after_ a successful database transaction commit (e.g., in `inventoryService.recordStockMovement`) and logs a message simulating event publication (`[QUEUE STUB]`). This demonstrates _where_ the system would hand off processing to an asynchronous worker via a message queue.

### Caching (Design + Stub)

- **Concept:** Use a distributed cache (e.g., Redis, Memcached) to store frequently accessed data and reduce database load.
- **Candidates:** Product details, store details, potentially components of inventory calculations.
- **Invalidation:** Requires careful strategy (TTL, explicit invalidation on data change).
- **Implementation Status:** **Stubbed Integration.** No actual cache client is implemented. Placeholder `console.log` messages (`[CACHE STUB] ...`) have been added to relevant service functions (e.g., product lookups) to indicate where cache checks (`cacheClient.get`), cache sets (`cacheClient.set`), and cache invalidations (`cacheClient.del`) would occur. These stubs demonstrate understanding of caching patterns without requiring the actual infrastructure.

### Database Read/Write Separation (Design)

- **Concept:** Use PostgreSQL replication to create read-only replicas. Direct read-heavy queries to replicas and writes to the primary instance.
- **Benefits:** Reduces load on the primary database, improves read performance.
- **Considerations:** Replication lag, managing connections to different database roles.
- **Implementation Status:** **Design Only.** No implementation of read replicas or connection routing logic.

### Audit Logging (Basic Implementation)

- **Purpose:** Track significant data changes for accountability and analysis.
- **Implementation Status:** **Basic Implementation.**
  - An `AuditLogs` table has been created via Sequelize migration with fields: `id`, `userId` (string, nullable), `actionType` (string), `entityType` (string), `entityId` (string, nullable), `details` (jsonb), `createdAt`. Indexes have been added.
  - An `auditService.js` provides a `createAuditLog` function.
  - This function is integrated into the `inventoryService.recordStockMovement` function. It's called _within_ the same database transaction as the `StockMovement.create` call, ensuring atomicity.
  - Currently, `userId` is hardcoded to `'system'` as the Basic Auth context isn't easily propagated. The `details` field stores basic context about the movement.

### Concurrency and Transactions (Implemented where applicable)

- **Importance:** Ensure data integrity under concurrent operations.
- **Implementation:** Critical operations involving multiple database writes (e.g., creating a stock movement and its corresponding audit log) are wrapped in Sequelize managed transactions (`sequelize.transaction(...)`) to guarantee atomicity.

---

## Evolution Rationale

### Stage 1 to Stage 2

The evolution from a single-store to multi-store system was driven by several key factors:

1. **Business Expansion Requirements:**

   - Need to support multiple physical store locations
   - Requirement for store-specific inventory tracking
   - Centralized product catalog with per-store inventory

2. **Technical Improvements:**

   - **PostgreSQL** replaced SQLite for better concurrency, transaction support, and scalability
   - **Sequelize ORM** introduced for simplified database interactions and robust migration management
   - **RESTful API design** implemented for consistency and better developer experience
   - **Authentication & Rate Limiting** added for basic security measures

3. **Architecture Changes:**
   - Created explicit `Store` entity to support multi-store operations
   - Refactored routes to be store-centric (`/stores/:storeId/inventory`)
   - Added reporting capabilities across stores

### Stage 2 to Stage 3

The progression to a large-scale distributed system design was motivated by:

1. **Scale Requirements:**

   - Support for thousands of stores with high transaction volumes
   - Need for real-time inventory visibility across all locations
   - High concurrency and availability requirements

2. **Architectural Evolution:**

   - **Horizontal Scalability** for handling increased load
   - **Asynchronous Processing** to improve API responsiveness and resilience
   - **Caching Strategy** to reduce database load and improve response times
   - **Database Read/Write Separation** for optimized performance
   - **Audit Logging** for compliance, security, and data integrity

3. **Implementation Strategy:**
   - Prioritized crucial elements like transactions and audit logging for actual implementation
   - Used integration stubs (cache, queue) to demonstrate architectural understanding
   - Focused on maintaining a clean service-oriented architecture

This evolution represents a realistic growth pattern for inventory systems, starting from simple single-store tracking to an enterprise-grade distributed system capable of supporting a large retail operation.

---

## Key Assumptions

1. **Technical Environment:**

   - Node.js v18.x or higher is available in the deployment environment
   - PostgreSQL 12+ is accessible for database storage
   - Application runs in a containerized environment or on servers with required Node.js dependencies

2. **Authentication & Security:**

   - Basic authentication is sufficient for the scope of this exercise
   - HTTPS would be implemented in production (not included in this codebase)
   - Rate limiting provides adequate protection against basic abuse

3. **Data Management:**

   - Eventual consistency is acceptable in Stage 3 design (for async processing)
   - Quantities are non-negative integers (no fractional inventory)
   - Product IDs and store IDs are unique across the system
   - Stock movement types are limited to predefined values ('in', 'out', 'manual')

4. **Performance & Scale:**

   - Read operations significantly outnumber write operations
   - Inventory queries are the most frequent operations
   - System should handle thousands of stores but product catalog size remains manageable

5. **Implementation Scope:**

   - Focus is on backend API functionality rather than user interface
   - Stub implementations for caching and queuing are sufficient to demonstrate architectural understanding
   - Complex reporting and analytics would be implemented separately or as future enhancements

6. **Operational Context:**
   - Multiple instances of the application could be deployed simultaneously
   - Database backups and other operational concerns are handled externally

---

## Code Structure and Practices

- **Service Layer:** Business logic has been refactored out of Express route handlers (`server.js`) and into a dedicated `services/` directory (e.g., `inventoryService.js`, `productService.js`, `auditService.js`). This promotes separation of concerns, improves code organization, maintainability, and testability. Route handlers are now primarily responsible for request validation, calling appropriate service functions, and formatting responses.

- **Centralized Error Handling:** An Express error handling middleware has been implemented at the end of the middleware chain. It catches errors passed via `next(error)` from route handlers or services, logs them, and sends a standardized error response to the client (e.g., 500 for generic errors, 400/404 for specific cases identified). This ensures consistent error reporting.

- **Validation:** Input validation is performed using express-validator for query parameters and custom validation logic for request bodies. Validation errors are returned with descriptive messages.

- **Environment Configuration:** The application uses environment variables for configuration, with sensible defaults where appropriate, following 12-factor app principles.

---

## Setup Instructions

### Prerequisites

- Node.js v18.x or higher
- PostgreSQL 12+ database server
- npm or yarn package manager

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/syncali/Bazaar-Case-Study.git
   cd bazaar-case-study
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file with your database credentials and other settings.

4. Run database migrations:

   ```bash
   npx sequelize-cli db:migrate
   ```

5. (Optional) Seed initial data:
   ```bash
   npx sequelize-cli db:seed:all
   ```

### Starting the Application

For development:

```bash
npm run dev
# or
yarn dev
```

For production:

```bash
npm start
# or
yarn start
```

The server will start on port 3000 by default (configurable in .env).

### Database Management

Additional Sequelize commands:

```bash
# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Undo latest migration
npx sequelize-cli db:migrate:undo

# Create a new seeder
npx sequelize-cli seed:generate --name seeder-name
```

## Troubleshooting

- **Database Connection Issues**: Verify your PostgreSQL is running and credentials in `.env` are correct.
- **Migration Errors**: Check the Sequelize logs for detailed error information.
- **Port Already in Use**: Configure a different port in `.env` if 3000 is already taken.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
