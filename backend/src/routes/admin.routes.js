import express from "express";
import { body, validationResult } from "express-validator";

import { getDbPool, withTransaction } from "../config/db.js";
import { adminGuard } from "../middleware/auth.js";
import { fail, parseId, parsePagination } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { buildTracking } from "../services/orders.js";
import {
  upload,
  uploadedUrl,
  deleteUploadedImage,
  discardUploads,
  isCloudinaryEnabled,
  MAX_GALLERY_IMAGES,
} from "../services/uploads.js";

const router = express.Router();
const pool = getDbPool();

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

/**
 * Append to admin_audit_logs. The table existed but nothing wrote to it, so
 * destructive admin actions left no trail. Best-effort — an audit failure must
 * not roll back the action the admin actually asked for.
 */
async function audit(req, action, entityType, entityId, metadata = null) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, action, entityType, entityId ?? null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    logger.warn({ message: "Audit log write failed", action, entityType, error: err.message });
  }
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDims(body) {
  const num = (value) =>
    value !== undefined && value !== "" && value !== null ? parseFloat(value) : null;
  return {
    length_cm: num(body.length_cm),
    breadth_cm: num(body.breadth_cm),
    height_cm: num(body.height_cm),
  };
}

const asBool = (value) => value !== false && value !== "false" && value !== "0" && value !== 0;

/** Multer fields shared by product create and update. */
const productUpload = upload.fields([
  { name: "thumbnail_file", maxCount: 1 },
  { name: "gallery_files", maxCount: MAX_GALLERY_IMAGES },
]);

const flattenFiles = (files) => Object.values(files || {}).flat();

/** Load galleries for a set of products in one query. */
async function loadGalleries(productIds) {
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
      alt: row.alt_text,
      sortOrder: row.sort_order,
      isPrimary: Boolean(row.is_primary),
    });
  }
  return byProduct;
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */
router.get("/dashboard", adminGuard, async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      ordersByStatus,
      ordersLast7Days,
      revenueByMonth,
      lowStock,
      recentOrders,
      pendingShipments,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM orders"),
      pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'PAID'"
      ),
      pool.query("SELECT COUNT(*) AS count FROM products"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'user'"),
      pool.query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      pool.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count
           FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at) ORDER BY date`
      ),
      pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total_amount) AS revenue
           FROM orders
          WHERE payment_status = 'PAID' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month`
      ),
      pool.query(
        `SELECT id, name, stock, thumbnail_url FROM products
          WHERE is_active = 1 AND stock < 10 ORDER BY stock ASC LIMIT 8`
      ),
      pool.query(
        `SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at,
                u.name AS customer_name, u.email
           FROM orders o JOIN users u ON u.id = o.user_id
          ORDER BY o.created_at DESC LIMIT 10`
      ),
      // Paid but not yet dispatched — the queue the admin actually works from.
      pool.query(
        `SELECT COUNT(*) AS count FROM orders
          WHERE payment_status = 'PAID' AND status = 'PAID' AND tracking_id IS NULL`
      ),
    ]);

    res.json({
      stats: {
        totalOrders: totalOrders[0][0]?.count ?? 0,
        totalRevenue: Number(totalRevenue[0][0]?.total ?? 0),
        totalProducts: totalProducts[0][0]?.count ?? 0,
        totalUsers: totalUsers[0][0]?.count ?? 0,
        pendingShipments: pendingShipments[0][0]?.count ?? 0,
      },
      ordersByStatus: ordersByStatus[0],
      ordersLast7Days: ordersLast7Days[0],
      revenueByMonth: revenueByMonth[0],
      lowStock: lowStock[0],
      recentOrders: recentOrders[0],
    });
  } catch (err) {
    fail(res, 500, "Failed to load dashboard", err);
  }
});

/* ── Orders ─────────────────────────────────────────────────────────────── */
router.get("/orders", adminGuard, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { maxLimit: 50 });

    const conditions = [];
    const params = [];

    if (req.query.status && ORDER_STATUSES.includes(req.query.status)) {
      conditions.push("o.status = ?");
      params.push(req.query.status);
    }

    if (req.query.search && String(req.query.search).trim()) {
      const raw = String(req.query.search).trim();
      const term = `%${raw.replace(/[\\%_]/g, "\\$&")}%`;
      // Order id, customer name/email, or tracking number — the four things an
      // admin actually has to hand when a customer gets in touch.
      conditions.push("(o.id = ? OR u.name LIKE ? OR u.email LIKE ? OR o.tracking_id LIKE ?)");
      params.push(parseId(raw) ?? 0, term, term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_status, o.created_at,
              o.tracking_id, o.courier_company, o.tracking_url, o.shipping_status,
              u.name AS customer_name, u.email AS customer_email,
              a.city, a.state, a.pincode
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.id = o.address_id
         ${where}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[countResult]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM orders o JOIN users u ON u.id = o.user_id ${where}`,
      params
    );

    res.json({
      orders: rows.map((row) => ({ ...row, tracking: buildTracking(row) })),
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    fail(res, 500, "Failed to load orders", err);
  }
});

router.get("/orders/:id", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Order not found" });

  try {
    const [orderRows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone,
              a.line1, a.line2, a.city, a.state, a.pincode, a.country
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.id = o.address_id
        WHERE o.id = ?
        LIMIT 1`,
      [id]
    );
    if (orderRows.length === 0) return res.status(404).json({ message: "Order not found" });

    const [itemRows] = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.slug AS product_slug, p.thumbnail_url
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      order: { ...orderRows[0], tracking: buildTracking(orderRows[0]) },
      items: itemRows,
    });
  } catch (err) {
    fail(res, 500, "Failed to load order", err);
  }
});

router.patch("/orders/:id/status", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Order not found" });

  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(", ")}` });
  }

  try {
    const [current] = await pool.query("SELECT status FROM orders WHERE id = ? LIMIT 1", [id]);
    if (current.length === 0) return res.status(404).json({ message: "Order not found" });

    const [result] = await pool.query(
      `UPDATE orders
          SET status = ?,
              delivered_at = CASE WHEN ? = 'DELIVERED' THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END,
              updated_at = NOW()
        WHERE id = ?`,
      [status, status, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });

    await audit(req, "order.status_changed", "order", id, { from: current[0].status, to: status });
    res.json({ message: "Order status updated", status });
  } catch (err) {
    fail(res, 500, "Failed to update order", err);
  }
});

/* ── Products ───────────────────────────────────────────────────────────── */
router.get("/products", adminGuard, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { maxLimit: 200 });

    const conditions = [];
    const params = [];

    if (req.query.search && String(req.query.search).trim()) {
      const raw = String(req.query.search).trim();
      const term = `%${raw.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push("(p.id = ? OR p.name LIKE ? OR p.slug LIKE ?)");
      params.push(parseId(raw) ?? 0, term, term);
    }

    const categoryId = parseId(req.query.category_id);
    if (categoryId) {
      conditions.push("p.category_id = ?");
      params.push(categoryId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${where}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[countResult]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params
    );

    const galleries = await loadGalleries(rows.map((row) => row.id));

    res.json({
      products: rows.map((row) => ({ ...row, images: galleries.get(row.id) || [] })),
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    fail(res, 500, "Failed to load products", err);
  }
});

router.get("/products/:id", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });

    const galleries = await loadGalleries([id]);
    res.json({ ...rows[0], images: galleries.get(id) || [] });
  } catch (err) {
    fail(res, 500, "Failed to load product", err);
  }
});

const productValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("slug").optional({ values: "falsy" }).trim().isLength({ max: 180 }),
  body("description").optional({ values: "falsy" }).trim().isLength({ max: 5000 }),
  body("price").isFloat({ min: 0, max: 10000000 }).withMessage("Enter a valid price"),
  body("stock").isInt({ min: 0, max: 1000000 }).withMessage("Stock must be 0 or more"),
  body("category_id").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Invalid category"),
  body("thumbnail_url").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
  body("is_active").optional(),
  body("length_cm").optional({ values: "falsy" }).isFloat({ min: 0, max: 100000 }),
  body("breadth_cm").optional({ values: "falsy" }).isFloat({ min: 0, max: 100000 }),
  body("height_cm").optional({ values: "falsy" }).isFloat({ min: 0, max: 100000 }),
];

/** POST /api/admin/products — create, optionally with a thumbnail and a gallery. */
router.post("/products", adminGuard, productUpload, productValidation, async (req, res) => {
  const uploaded = flattenFiles(req.files);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await discardUploads(uploaded);
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, description, price, stock, category_id, thumbnail_url, is_active } = req.body;
  const slug = req.body.slug?.trim() ? slugify(req.body.slug) : slugify(name);
  const { length_cm, breadth_cm, height_cm } = parseDims(req.body);

  const thumbnailFile = req.files?.thumbnail_file?.[0] ?? null;
  const galleryFiles = req.files?.gallery_files ?? [];
  // If no explicit thumbnail was chosen, the first gallery image becomes it, so
  // a product is never left without a card image.
  const finalThumbnailUrl =
    uploadedUrl(thumbnailFile) ||
    thumbnail_url?.trim() ||
    uploadedUrl(galleryFiles[0]) ||
    null;

  try {
    if (!slug) {
      await discardUploads(uploaded);
      return res.status(400).json({ message: "Could not derive a slug from that name" });
    }

    const productId = await withTransaction(async (connection) => {
      const [existing] = await connection.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [
        slug,
      ]);
      if (existing.length > 0) {
        const err = new Error("A product with this slug already exists");
        err.httpStatus = 409;
        throw err;
      }

      const [result] = await connection.query(
        `INSERT INTO products
           (name, slug, description, price, stock, category_id, thumbnail_url, is_active,
            length_cm, breadth_cm, height_cm)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          slug,
          description || null,
          price,
          stock ?? 0,
          parseId(category_id),
          finalThumbnailUrl,
          asBool(is_active) ? 1 : 0,
          length_cm,
          breadth_cm,
          height_cm,
        ]
      );

      const newId = result.insertId;

      for (const [index, file] of galleryFiles.entries()) {
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
           VALUES (?, ?, ?, ?, ?)`,
          [newId, uploadedUrl(file), name, index, index === 0 ? 1 : 0]
        );
      }

      return newId;
    });

    await audit(req, "product.created", "product", productId, { name, slug });

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [productId]);
    const galleries = await loadGalleries([productId]);
    res.status(201).json({ ...rows[0], images: galleries.get(productId) || [] });
  } catch (err) {
    await discardUploads(uploaded);
    if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
    fail(res, 500, "Failed to create product", err);
  }
});

/** PUT /api/admin/products/:id — update; gallery files are appended, not replaced. */
router.put("/products/:id", adminGuard, productUpload, productValidation, async (req, res) => {
  const uploaded = flattenFiles(req.files);
  const id = parseId(req.params.id);

  if (!id) {
    await discardUploads(uploaded);
    return res.status(404).json({ message: "Product not found" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await discardUploads(uploaded);
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, slug, description, price, stock, category_id, thumbnail_url, is_active } = req.body;
  const { length_cm, breadth_cm, height_cm } = parseDims(req.body);
  const thumbnailFile = req.files?.thumbnail_file?.[0] ?? null;
  const galleryFiles = req.files?.gallery_files ?? [];

  let replacedThumbnail = null;

  try {
    await withTransaction(async (connection) => {
      const [currentRows] = await connection.query(
        "SELECT thumbnail_url FROM products WHERE id = ? LIMIT 1",
        [id]
      );
      if (currentRows.length === 0) {
        const err = new Error("Product not found");
        err.httpStatus = 404;
        throw err;
      }

      let finalThumbnailUrl = currentRows[0].thumbnail_url;
      if (thumbnailFile) {
        replacedThumbnail = currentRows[0].thumbnail_url;
        finalThumbnailUrl = uploadedUrl(thumbnailFile);
      } else if (thumbnail_url?.trim()) {
        finalThumbnailUrl = thumbnail_url.trim();
      }

      const finalSlug = slug?.trim() ? slugify(slug) : slugify(name);
      if (!finalSlug) {
        const err = new Error("Could not derive a slug from that name");
        err.httpStatus = 400;
        throw err;
      }

      const [clash] = await connection.query(
        "SELECT id FROM products WHERE slug = ? AND id <> ? LIMIT 1",
        [finalSlug, id]
      );
      if (clash.length > 0) {
        const err = new Error("A product with this slug already exists");
        err.httpStatus = 409;
        throw err;
      }

      await connection.query(
        `UPDATE products
            SET name = ?, slug = ?, description = ?, price = ?, stock = ?,
                category_id = ?, thumbnail_url = ?, is_active = ?,
                length_cm = ?, breadth_cm = ?, height_cm = ?
          WHERE id = ?`,
        [
          name,
          finalSlug,
          description || null,
          price,
          stock ?? 0,
          parseId(category_id),
          finalThumbnailUrl,
          asBool(is_active) ? 1 : 0,
          length_cm,
          breadth_cm,
          height_cm,
          id,
        ]
      );

      if (galleryFiles.length) {
        const [[{ nextOrder }]] = await connection.query(
          "SELECT COALESCE(MAX(sort_order) + 1, 0) AS nextOrder FROM product_images WHERE product_id = ?",
          [id]
        );
        for (const [index, file] of galleryFiles.entries()) {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, 0)`,
            [id, uploadedUrl(file), name, Number(nextOrder) + index]
          );
        }
      }
    });

    // Only bin the old thumbnail once the transaction has committed.
    if (replacedThumbnail) await deleteUploadedImage(replacedThumbnail);

    await audit(req, "product.updated", "product", id, { name });

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    const galleries = await loadGalleries([id]);
    res.json({ ...rows[0], images: galleries.get(id) || [] });
  } catch (err) {
    await discardUploads(uploaded);
    if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
    fail(res, 500, "Failed to update product", err);
  }
});

/* ── Product gallery ────────────────────────────────────────────────────── */

/** GET /api/admin/products/:id/images */
router.get("/products/:id/images", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  try {
    const galleries = await loadGalleries([id]);
    res.json({ images: galleries.get(id) || [], storage: isCloudinaryEnabled ? "cloudinary" : "local" });
  } catch (err) {
    fail(res, 500, "Failed to load images", err);
  }
});

/** POST /api/admin/products/:id/images — append up to MAX_GALLERY_IMAGES files. */
router.post(
  "/products/:id/images",
  adminGuard,
  upload.array("images", MAX_GALLERY_IMAGES),
  async (req, res) => {
    const id = parseId(req.params.id);
    const files = req.files ?? [];

    if (!id) {
      await discardUploads(files);
      return res.status(404).json({ message: "Product not found" });
    }
    if (!files.length) {
      return res.status(400).json({ message: "Select at least one image to upload" });
    }

    try {
      await withTransaction(async (connection) => {
        const [productRows] = await connection.query(
          "SELECT id, name, thumbnail_url FROM products WHERE id = ? LIMIT 1",
          [id]
        );
        if (productRows.length === 0) {
          const err = new Error("Product not found");
          err.httpStatus = 404;
          throw err;
        }

        const [[{ existing, nextOrder }]] = await connection.query(
          `SELECT COUNT(*) AS existing, COALESCE(MAX(sort_order) + 1, 0) AS nextOrder
             FROM product_images WHERE product_id = ?`,
          [id]
        );

        if (Number(existing) + files.length > MAX_GALLERY_IMAGES) {
          const err = new Error(
            `A product can have at most ${MAX_GALLERY_IMAGES} images (it already has ${existing})`
          );
          err.httpStatus = 409;
          throw err;
        }

        for (const [index, file] of files.entries()) {
          const isFirstEver = Number(existing) === 0 && index === 0;
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              uploadedUrl(file),
              req.body?.alt_text?.trim() || productRows[0].name,
              Number(nextOrder) + index,
              isFirstEver ? 1 : 0,
            ]
          );
        }

        // A product with no card image yet adopts the first upload.
        if (!productRows[0].thumbnail_url) {
          await connection.query("UPDATE products SET thumbnail_url = ? WHERE id = ?", [
            uploadedUrl(files[0]),
            id,
          ]);
        }
      });

      await audit(req, "product.images_added", "product", id, { count: files.length });

      const galleries = await loadGalleries([id]);
      res.status(201).json({ images: galleries.get(id) || [] });
    } catch (err) {
      await discardUploads(files);
      if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
      fail(res, 500, "Failed to upload images", err);
    }
  }
);

/** PATCH /api/admin/products/:id/images — reorder and/or choose the primary image. */
router.patch("/products/:id/images", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  const order = Array.isArray(req.body?.order) ? req.body.order.map(parseId).filter(Boolean) : null;
  const primaryId = req.body?.primaryId != null ? parseId(req.body.primaryId) : null;

  if (!order && !primaryId) {
    return res.status(400).json({ message: "Provide `order` and/or `primaryId`" });
  }

  try {
    await withTransaction(async (connection) => {
      const [owned] = await connection.query(
        "SELECT id FROM product_images WHERE product_id = ?",
        [id]
      );
      const ownedIds = new Set(owned.map((row) => row.id));

      // Every id must belong to THIS product, or one request could reshuffle
      // another product's gallery.
      const invalid = [...(order || []), ...(primaryId ? [primaryId] : [])].filter(
        (imageId) => !ownedIds.has(imageId)
      );
      if (invalid.length) {
        const err = new Error("One or more images do not belong to this product");
        err.httpStatus = 400;
        throw err;
      }

      if (order) {
        for (const [index, imageId] of order.entries()) {
          await connection.query("UPDATE product_images SET sort_order = ? WHERE id = ?", [
            index,
            imageId,
          ]);
        }
      }

      if (primaryId) {
        await connection.query(
          "UPDATE product_images SET is_primary = (id = ?) WHERE product_id = ?",
          [primaryId, id]
        );
        const [[image]] = await connection.query(
          "SELECT image_url FROM product_images WHERE id = ?",
          [primaryId]
        );
        if (image?.image_url) {
          await connection.query("UPDATE products SET thumbnail_url = ? WHERE id = ?", [
            image.image_url,
            id,
          ]);
        }
      }
    });

    await audit(req, "product.images_reordered", "product", id, { primaryId });

    const galleries = await loadGalleries([id]);
    res.json({ images: galleries.get(id) || [] });
  } catch (err) {
    if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
    fail(res, 500, "Failed to update images", err);
  }
});

/** DELETE /api/admin/products/:id/images/:imageId */
router.delete("/products/:id/images/:imageId", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  const imageId = parseId(req.params.imageId);
  if (!id || !imageId) return res.status(404).json({ message: "Image not found" });

  try {
    const removedUrl = await withTransaction(async (connection) => {
      const [rows] = await connection.query(
        "SELECT image_url, is_primary FROM product_images WHERE id = ? AND product_id = ? LIMIT 1",
        [imageId, id]
      );
      if (rows.length === 0) {
        const err = new Error("Image not found");
        err.httpStatus = 404;
        throw err;
      }

      await connection.query("DELETE FROM product_images WHERE id = ?", [imageId]);

      // Promote the next image so the product never loses its card picture.
      if (rows[0].is_primary) {
        const [[next]] = await connection.query(
          "SELECT id, image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1",
          [id]
        );
        if (next) {
          await connection.query("UPDATE product_images SET is_primary = 1 WHERE id = ?", [next.id]);
          await connection.query("UPDATE products SET thumbnail_url = ? WHERE id = ?", [
            next.image_url,
            id,
          ]);
        } else {
          await connection.query(
            "UPDATE products SET thumbnail_url = NULL WHERE id = ? AND thumbnail_url = ?",
            [id, rows[0].image_url]
          );
        }
      }

      return rows[0].image_url;
    });

    // Delete the file only after the row is gone, so a storage failure cannot
    // leave a product pointing at a missing image.
    await deleteUploadedImage(removedUrl);
    await audit(req, "product.image_deleted", "product", id, { imageId });

    const galleries = await loadGalleries([id]);
    res.json({ images: galleries.get(id) || [] });
  } catch (err) {
    if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
    fail(res, 500, "Failed to delete image", err);
  }
});

/* ── Product status / stock / delete ────────────────────────────────────── */
router.patch("/products/:id/status", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  if (typeof req.body.is_active !== "boolean") {
    return res.status(400).json({ message: "is_active (boolean) is required" });
  }

  try {
    const [result] = await pool.query("UPDATE products SET is_active = ? WHERE id = ?", [
      req.body.is_active ? 1 : 0,
      id,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });

    await audit(req, "product.status_changed", "product", id, { is_active: req.body.is_active });
    res.json({ message: "Product status updated", is_active: req.body.is_active });
  } catch (err) {
    fail(res, 500, "Failed to update status", err);
  }
});

router.patch("/products/:id/stock", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  const stock = Number.parseInt(req.body.stock, 10);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    return res.status(400).json({ message: "Stock must be a whole number between 0 and 1,000,000" });
  }

  try {
    const [result] = await pool.query("UPDATE products SET stock = ? WHERE id = ?", [stock, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });

    await audit(req, "product.stock_changed", "product", id, { stock });
    res.json({ message: "Stock updated", stock });
  } catch (err) {
    fail(res, 500, "Failed to update stock", err);
  }
});

router.delete("/products/:id", adminGuard, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ message: "Product not found" });

  try {
    const [productRows] = await pool.query(
      "SELECT name, thumbnail_url FROM products WHERE id = ? LIMIT 1",
      [id]
    );
    if (productRows.length === 0) return res.status(404).json({ message: "Product not found" });

    // A product referenced by an order cannot be deleted (the FK would block
    // it anyway) — deactivate instead so order history stays intact.
    const [[{ orderCount }]] = await pool.query(
      "SELECT COUNT(*) AS orderCount FROM order_items WHERE product_id = ?",
      [id]
    );
    if (Number(orderCount) > 0) {
      await pool.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
      await audit(req, "product.deactivated", "product", id, { reason: "referenced by orders" });
      return res.status(409).json({
        message:
          "This product appears in existing orders, so it cannot be deleted. It has been hidden from the store instead.",
        deactivated: true,
      });
    }

    const [imageRows] = await pool.query(
      "SELECT image_url FROM product_images WHERE product_id = ?",
      [id]
    );

    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    // product_images rows cascade; remove the stored files too.
    await Promise.all([
      deleteUploadedImage(productRows[0].thumbnail_url),
      ...imageRows.map((row) => deleteUploadedImage(row.image_url)),
    ]);

    await audit(req, "product.deleted", "product", id, { name: productRows[0].name });
    res.json({ message: "Product deleted" });
  } catch (err) {
    fail(res, 500, "Failed to delete product", err);
  }
});

/* ── Categories ─────────────────────────────────────────────────────────── */
router.get("/categories", adminGuard, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, slug FROM categories ORDER BY name");
    res.json(rows);
  } catch (err) {
    fail(res, 500, "Failed to load categories", err);
  }
});

router.get("/revenue/by-society", adminGuard, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(o.created_at, '%b %y') AS month,
         SUM(CASE WHEN p.category_id IN (4, 14) THEN oi.line_total ELSE 0 END) AS shristi,
         SUM(CASE WHEN p.category_id = 3        THEN oi.line_total ELSE 0 END) AS prerana
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p     ON p.id = oi.product_id
      WHERE o.payment_status = 'PAID'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(o.created_at, '%b %y'), DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY MIN(o.created_at)`
    );
    res.json({ data: rows });
  } catch (err) {
    fail(res, 500, "Failed to load society revenue", err);
  }
});

export default router;
