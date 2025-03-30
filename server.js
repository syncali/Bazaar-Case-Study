// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // Use verbose for more detailed logs
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// --- Database Setup ---
const DB_SOURCE = "inventory.db"; // Database file name

// Connect to (or create) the SQLite database file
const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    // Use serialize to ensure table creation happens sequentially
    db.serialize(() => {
      // Create Products table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS Products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`, (err) => {
        if (err) {
          console.error("Error creating Products table:", err.message);
        } else {
          console.log("Products table ready.");
        }
      });

      // Create StockMovements table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS StockMovements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('in', 'out', 'manual')),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES Products(id)
      )`, (err) => {
        if (err) {
          console.error("Error creating StockMovements table:", err.message);
        } else {
          console.log("StockMovements table ready.");
        }
      });
    });
  }
});

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Inventory Backend API is running!');
});

// --- API Endpoints will go here ---

// POST /products - Add a new product
app.post('/products', (req, res) => {
    const { name } = req.body;
  
    if (!name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
  
    const sql = `INSERT INTO Products (name) VALUES (?)`;
    db.run(sql, [name], function(err) { // Use function() to access this.lastID
      if (err) {
        // UNIQUE constraint error likely means product already exists
        if (err.message.includes('UNIQUE constraint failed')) {
           return res.status(409).json({ error: 'Product name already exists.' });
        }
        console.error("DB Error (POST /products):", err.message);
        return res.status(500).json({ error: 'Database error occurred.' });
      }
      res.status(201).json({
        message: 'Product added successfully',
        productId: this.lastID // Get the ID of the newly inserted row
      });
    });
  });

  // POST /stock-movements - Record a stock movement
app.post('/stock-movements', (req, res) => {
    const { productId, type, quantity } = req.body;
    const validTypes = ['in', 'out', 'manual'];
  
    // Basic Validation
    if (!productId || !type || !quantity) {
      return res.status(400).json({ error: 'productId, type, and quantity are required.' });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }
  
    // Optional: Check if productId exists before inserting movement (more robust)
    const checkProductSql = `SELECT id FROM Products WHERE id = ?`;
    db.get(checkProductSql, [productId], (err, row) => {
        if (err) {
            console.error("DB Error (Check Product):", err.message);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        if (!row) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }
  
        // Product exists, proceed with inserting movement
        const insertMovementSql = `INSERT INTO StockMovements (productId, type, quantity) VALUES (?, ?, ?)`;
        db.run(insertMovementSql, [productId, type, quantity], function(err) {
          if (err) {
            console.error("DB Error (POST /stock-movements):", err.message);
            return res.status(500).json({ error: 'Database error occurred.' });
          }
          res.status(201).json({
            message: 'Stock movement recorded successfully',
            movementId: this.lastID
          });
        });
    });
  });

  // GET /products/:productId/quantity - Get current stock quantity for a product
app.get('/products/:productId/quantity', (req, res) => {
    const { productId } = req.params;
  
    // Calculate quantity: SUM(quantity) where type='in' MINUS SUM(quantity) where type IN ('out', 'manual')
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type IN ('out', 'manual') THEN quantity ELSE 0 END), 0)
        AS currentQuantity
      FROM StockMovements
      WHERE productId = ?
    `;
  
    db.get(sql, [productId], (err, row) => {
      if (err) {
        console.error("DB Error (GET /products/:id/quantity):", err.message);
        return res.status(500).json({ error: 'Database error occurred.' });
      }
      // Note: This query returns a quantity even if the product ID doesn't exist in StockMovements (it will be 0).
      // You might want to add a check first if the product exists in the Products table if strictness is needed.
       if (row === undefined) {
           // This case is less likely with the COALESCE, but good practice
           return res.status(404).json({ error: `Product or movements not found for ID ${productId}` });
       }
  
      res.status(200).json({
        productId: parseInt(productId, 10), // Convert param string to number
        currentQuantity: row.currentQuantity
      });
    });
  });

  
// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Database initialization messages will appear before this if successful
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});