import express from "express";
import { getDbPool } from "../config/db.js";

const router = express.Router();
const pool = getDbPool();

/**
 * GET /api/products
 * Public: List active products with filtering, pagination, and category support
 */
router.get("/", async (req, res) => {
  try {
    const {
      category_id,
      search,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validPage = Math.max(parseInt(page) || 1, 1);
    const offset = (validPage - 1) * validLimit;

    const validSortFields = ['name', 'price', 'created_at', 'stock'];
    const validSort = validSortFields.includes(sort) ? sort : 'created_at';
    const validOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    let whereConditions = ['p.is_active = 1'];
    let queryParams = [];

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.price, 
        p.stock, 
        p.thumbnail_url, 
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY p.${validSort} ${validOrder}
       LIMIT ? OFFSET ?`,
      [...queryParams, validLimit, offset]
    );

    res.json({
      products: rows,
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
    console.error("Products list error", err);
    res.status(500).json({ message: "Failed to load products", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: All specific routes (slug/:slug, category/:categoryId) MUST come
// BEFORE the generic /:id route, otherwise Express will match "slug" or
// "category" as the :id param and return 404.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/products/slug/:slug
 * Public: Get single product by slug
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.price, 
        p.stock, 
        p.thumbnail_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Product get by slug error", err);
    res.status(500).json({ message: "Failed to load product", error: err.message });
  }
});

/**
 * GET /api/products/category/:categoryId
 * Public: Get products by category
 */
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validPage = Math.max(parseInt(page) || 1, 1);
    const offset = (validPage - 1) * validLimit;

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products WHERE category_id = ? AND is_active = 1`,
      [req.params.categoryId]
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.price, 
        p.stock, 
        p.thumbnail_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.is_active = 1
       ORDER BY p.name ASC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.categoryId, validLimit, offset]
    );

    res.json({
      products: rows,
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
    console.error("Products by category error", err);
    res.status(500).json({ message: "Failed to load products", error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Public: Get single product by ID
 * NOTE: This MUST be last — it will match any string as :id
 */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.price, 
        p.stock, 
        p.thumbnail_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Product get error", err);
    res.status(500).json({ message: "Failed to load product", error: err.message });
  }
});

export default router;