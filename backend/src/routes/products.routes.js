import express from "express";
import { getDbPool } from "../config/db.js";
import { fail, parseId, parsePagination } from "../utils/http.js";

const router = express.Router();
const pool = getDbPool();

/* Columns exposed to the storefront. Listed explicitly rather than `p.*` so a
   future internal column (cost price, supplier notes) is not published by
   accident. length/breadth/height are included because the product page renders
   them — they were previously stored by admin but never returned here, so
   admin-entered dimensions silently never reached customers. */
const PRODUCT_COLUMNS = `
  p.id, p.name, p.slug, p.description, p.price, p.stock,
  p.thumbnail_url, p.category_id,
  p.length_cm, p.breadth_cm, p.height_cm,
  p.created_at,
  c.name AS category_name,
  c.slug AS category_slug`;

/**
 * Load the gallery for one or more products in a single round-trip.
 * Returns a Map of productId → image rows, ordered as the admin arranged them.
 */
async function loadImages(productIds) {
  const byProduct = new Map();
  if (!productIds.length) return byProduct;

  const placeholders = productIds.map(() => "?").join(",");
  const [rows] = await pool.query(
    `SELECT id, product_id, image_url, alt_text, sort_order, is_primary
       FROM product_images
      WHERE product_id IN (${placeholders})
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    productIds
  );

  for (const row of rows) {
    if (!byProduct.has(row.product_id)) byProduct.set(row.product_id, []);
    byProduct.get(row.product_id).push({
      id: row.id,
      url: row.image_url,
      alt: row.alt_text || null,
      isPrimary: Boolean(row.is_primary),
      sortOrder: row.sort_order,
    });
  }
  return byProduct;
}

/**
 * Merge the gallery onto a product, guaranteeing `images` is always a non-empty
 * ordered list when the product has any picture at all. The legacy
 * `thumbnail_url` leads when it exists, so products that predate the gallery
 * still render identically.
 */
function withGallery(product, gallery = []) {
  const images = [];
  const seen = new Set();

  const push = (url, extra = {}) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ url, alt: extra.alt ?? product.name, id: extra.id ?? null });
  };

  push(product.thumbnail_url);
  for (const image of gallery) push(image.url, image);

  return { ...product, images, image_count: images.length };
}

/**
 * GET /api/products
 * Public: active products with search, category filter, sort and pagination.
 */
router.get("/", async (req, res) => {
  try {
    const { category_id, search, sort = "created_at", order = "desc" } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    // Whitelisted — these are interpolated into the SQL and can never come
    // straight from user input.
    const validSortFields = ["name", "price", "created_at", "stock"];
    const sortColumn = validSortFields.includes(sort) ? sort : "created_at";
    const sortDirection = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

    const whereConditions = ["p.is_active = 1"];
    const queryParams = [];

    const categoryId = parseId(category_id);
    if (categoryId) {
      whereConditions.push("p.category_id = ?");
      queryParams.push(categoryId);
    }

    if (search && String(search).trim()) {
      whereConditions.push("(p.name LIKE ? OR p.description LIKE ?)");
      // Escape LIKE wildcards so a search for "100%" is a literal search
      // rather than a full-table scan that matches everything.
      const term = `%${String(search).trim().replace(/[\\%_]/g, "\\$&")}%`;
      queryParams.push(term, term);
    }

    const whereClause = whereConditions.join(" AND ");

    const [[countResult]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult.total;

    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE ${whereClause}
        ORDER BY p.${sortColumn} ${sortDirection}
        LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const gallery = await loadImages(rows.map((row) => row.id));
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: rows.map((row) => withGallery(row, gallery.get(row.id))),
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
    fail(res, 500, "Failed to load products", err);
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   Specific routes MUST stay above the generic /:id route, or Express matches
   "slug" / "category" as the :id param and returns 404.
─────────────────────────────────────────────────────────────────────────── */

/** GET /api/products/slug/:slug — public product detail */
router.get("/slug/:slug", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ? AND p.is_active = 1
        LIMIT 1`,
      [req.params.slug]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

    const gallery = await loadImages([rows[0].id]);
    res.json(withGallery(rows[0], gallery.get(rows[0].id)));
  } catch (err) {
    fail(res, 500, "Failed to load product", err);
  }
});

/** GET /api/products/category/:categoryId */
router.get("/category/:categoryId", async (req, res) => {
  const categoryId = parseId(req.params.categoryId);
  if (!categoryId) return res.status(400).json({ message: "Invalid category id" });

  try {
    const { page, limit, offset } = parsePagination(req.query);

    const [[countResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM products WHERE category_id = ? AND is_active = 1",
      [categoryId]
    );
    const total = countResult.total;

    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.category_id = ? AND p.is_active = 1
        ORDER BY p.name ASC, p.created_at DESC
        LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    );

    const gallery = await loadImages(rows.map((row) => row.id));
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: rows.map((row) => withGallery(row, gallery.get(row.id))),
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
    fail(res, 500, "Failed to load products", err);
  }
});

/** GET /api/products/:id/related — same category, excluding this product */
router.get("/:id/related", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid product id" });

  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 4));

    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = 1
          AND p.id <> ?
          AND p.category_id = (SELECT category_id FROM products WHERE id = ?)
        ORDER BY p.stock > 0 DESC, RAND()
        LIMIT ?`,
      [id, id, limit]
    );

    const gallery = await loadImages(rows.map((row) => row.id));
    res.json({ products: rows.map((row) => withGallery(row, gallery.get(row.id))) });
  } catch (err) {
    fail(res, 500, "Failed to load related products", err);
  }
});

/**
 * GET /api/products/:id
 * NOTE: keep last — it matches any single segment.
 */
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  try {
    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.is_active = 1
        LIMIT 1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

    const gallery = await loadImages([id]);
    res.json(withGallery(rows[0], gallery.get(id)));
  } catch (err) {
    fail(res, 500, "Failed to load product", err);
  }
});

export default router;
