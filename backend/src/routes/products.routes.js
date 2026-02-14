import express from "express";
import { getDbPool } from "../config/db.js";

const router = express.Router();
const pool = getDbPool();

// Public: list active products (for storefront)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock, p.thumbnail_url, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Products list error", err);
    res.status(500).json({ message: "Failed to load products", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, slug, description, price, stock, thumbnail_url FROM products WHERE id = ? AND is_active = 1",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Product get error", err);
    res.status(500).json({ message: "Failed to load product", error: err.message });
  }
});

export default router;
