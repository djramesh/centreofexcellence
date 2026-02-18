import express from "express";
import { getDbPool } from "../config/db.js";

const router = express.Router();
const pool = getDbPool();

/**
 * GET /api/categories
 * Public: List all categories
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, description 
       FROM categories 
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Categories list error", err);
    res.status(500).json({ message: "Failed to load categories", error: err.message });
  }
});

/**
 * GET /api/categories/:id
 * Public: Get single category by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, description 
       FROM categories 
       WHERE id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Category get error", err);
    res.status(500).json({ message: "Failed to load category", error: err.message });
  }
});

/**
 * GET /api/categories/slug/:slug
 * Public: Get single category by slug
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, description 
       FROM categories 
       WHERE slug = ?`,
      [req.params.slug]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Category get by slug error", err);
    res.status(500).json({ message: "Failed to load category", error: err.message });
  }
});

/**
 * GET /api/categories/:id/products
 * Public: Get all products in a category
 */
router.get("/:id/products", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validPage = Math.max(parseInt(page) || 1, 1);
    const offset = (validPage - 1) * validLimit;

    // Get category info
    const [categoryRows] = await pool.query(
      `SELECT id, name, slug, description FROM categories WHERE id = ?`,
      [req.params.id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products WHERE category_id = ? AND is_active = 1`,
      [req.params.id]
    );
    const total = countResult[0].total;

    // Get products
    const [productRows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.price, 
        p.stock, 
        p.thumbnail_url
       FROM products p
       WHERE p.category_id = ? AND p.is_active = 1
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, validLimit, offset]
    );

    res.json({
      category: categoryRows[0],
      products: productRows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: total,
        totalPages: Math.ceil(total / validLimit),
        hasNext: validPage < Math.ceil(total / validLimit),
        hasPrev: validPage > 1
      }
    });
  } catch (err) {
    console.error("Category products error", err);
    res.status(500).json({ message: "Failed to load category products", error: err.message });
  }
});

export default router;