import express from "express";
import { getDbPool } from "../config/db.js";
import { fail, parseId, parsePagination } from "../utils/http.js";

const router = express.Router();
const pool = getDbPool();

/** GET /api/categories — public list */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description,
              COUNT(p.id) AS product_count
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
        GROUP BY c.id, c.name, c.slug, c.description
        ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    fail(res, 500, "Failed to load categories", err);
  }
});

/** GET /api/categories/slug/:slug — must stay above /:id */
router.get("/slug/:slug", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, slug, description FROM categories WHERE slug = ? LIMIT 1",
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    fail(res, 500, "Failed to load category", err);
  }
});

/** GET /api/categories/:id/products */
router.get("/:id/products", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid category id" });

  try {
    const { page, limit, offset } = parsePagination(req.query);

    const [categoryRows] = await pool.query(
      "SELECT id, name, slug, description FROM categories WHERE id = ? LIMIT 1",
      [id]
    );
    if (categoryRows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const [[countResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM products WHERE category_id = ? AND is_active = 1",
      [id]
    );
    const total = countResult.total;

    const [productRows] = await pool.query(
      `SELECT id, name, slug, description, price, stock, thumbnail_url,
              length_cm, breadth_cm, height_cm
         FROM products
        WHERE category_id = ? AND is_active = 1
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    res.json({
      category: categoryRows[0],
      products: productRows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    fail(res, 500, "Failed to load category products", err);
  }
});

/** GET /api/categories/:id */
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid category id" });

  try {
    const [rows] = await pool.query(
      "SELECT id, name, slug, description FROM categories WHERE id = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    fail(res, 500, "Failed to load category", err);
  }
});

export default router;
