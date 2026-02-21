import express from "express";
import { body, validationResult } from "express-validator";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getDbPool } from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();
const pool = getDbPool();

const adminGuard = [authRequired, requireRole("admin")];

// ── Cloudinary config ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "assamcrafts/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Helper: delete image from Cloudinary by URL
async function deleteCloudinaryImage(url) {
  if (!url || !url.includes("cloudinary.com")) return;
  try {
    // Extract public_id from URL e.g. assamcrafts/products/product-xyz
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (matches?.[1]) {
      await cloudinary.uploader.destroy(matches[1]);
    }
  } catch (err) {
    console.warn("Cloudinary delete warning:", err.message);
  }
}

// ── Dashboard stats ───────────────────────────────────────────────────────
router.get("/dashboard", adminGuard, async (req, res) => {
  try {
    const [
      totalOrdersResult,
      totalRevenueResult,
      totalProductsResult,
      totalUsersResult,
      ordersByStatusResult,
      ordersLast7DaysResult,
      revenueByMonthResult,
      lowStockResult,
      recentOrdersResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM orders"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'PAID'"),
      pool.query("SELECT COUNT(*) AS count FROM products"),
      pool.query("SELECT COUNT(*) AS count FROM users"),
      pool.query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      pool.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count 
         FROM orders 
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
         GROUP BY DATE(created_at) ORDER BY date`
      ),
      pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total_amount) AS revenue 
         FROM orders 
         WHERE payment_status = 'PAID' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) 
         GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month`
      ),
      pool.query(
        "SELECT id, name, stock, thumbnail_url FROM products WHERE is_active = 1 AND stock < 10 ORDER BY stock ASC LIMIT 5"
      ),
      pool.query(
        `SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at, u.name AS customer_name, u.email 
         FROM orders o 
         JOIN users u ON u.id = o.user_id 
         ORDER BY o.created_at DESC LIMIT 10`
      ),
    ]);

    res.json({
      stats: {
        totalOrders:   totalOrdersResult[0][0]?.count ?? 0,
        totalRevenue:  Number(totalRevenueResult[0][0]?.total ?? 0),
        totalProducts: totalProductsResult[0][0]?.count ?? 0,
        totalUsers:    totalUsersResult[0][0]?.count ?? 0,
      },
      ordersByStatus:   ordersByStatusResult[0],
      ordersLast7Days:  ordersLast7DaysResult[0],
      revenueByMonth:   revenueByMonthResult[0],
      lowStock:         lowStockResult[0],
      recentOrders:     recentOrdersResult[0],
    });
  } catch (err) {
    console.error("Admin dashboard error", err);
    res.status(500).json({ message: "Failed to load dashboard", error: err.message });
  }
});

// ── Orders ────────────────────────────────────────────────────────────────
router.get("/orders", adminGuard, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let where = "";
    const params = [];
    if (req.query.status) {
      where = " WHERE o.status = ? ";
      params.push(req.query.status);
    }

    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_status, o.created_at,
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
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params
    );

    res.json({
      orders:     rows,
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    console.error("Admin orders list error", err);
    res.status(500).json({ message: "Failed to load orders", error: err.message });
  }
});

router.get("/orders/:id", adminGuard, async (req, res) => {
  try {
    const [orderRows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone,
              a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (orderRows.length === 0) return res.status(404).json({ message: "Order not found" });

    const [itemRows] = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.thumbnail_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ order: orderRows[0], items: itemRows });
  } catch (err) {
    console.error("Admin order detail error", err);
    res.status(500).json({ message: "Failed to load order", error: err.message });
  }
});

router.patch("/orders/:id/status", adminGuard, async (req, res) => {
  const { status } = req.body;
  const allowed = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ message: "Valid status required: " + allowed.join(", ") });
  }
  try {
    const [result] = await pool.query(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated", status });
  } catch (err) {
    console.error("Admin order status update error", err);
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
});

// ── Products CRUD ─────────────────────────────────────────────────────────
router.get("/products", adminGuard, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       LEFT JOIN categories c ON c.id = p.category_id 
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[countResult]] = await pool.query("SELECT COUNT(*) AS total FROM products");

    res.json({
      products:   rows,
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    console.error("Admin products list error", err);
    res.status(500).json({ message: "Failed to load products", error: err.message });
  }
});

router.get("/products/:id", adminGuard, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Admin product get error", err);
    res.status(500).json({ message: "Failed to load product", error: err.message });
  }
});

const productValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("slug").optional().trim(),
  body("description").optional().trim(),
  body("price").isFloat({ min: 0 }).withMessage("Valid price required"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be 0 or more"),
  body("category_id").optional().isInt({ min: 1 }).withMessage("Valid category id"),
  body("thumbnail_url").optional().trim(),
  body("is_active").optional().isBoolean(),
];

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// POST /admin/products — create
router.post(
  "/products",
  adminGuard,
  upload.single("thumbnail_file"),
  productValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If Cloudinary already uploaded, delete it
      if (req.file?.path) await deleteCloudinaryImage(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, category_id, thumbnail_url, is_active } = req.body;
    const slug = req.body.slug?.trim() || slugify(name);

    // req.file.path is the full Cloudinary HTTPS URL when using CloudinaryStorage
    const finalThumbnailUrl = req.file?.path || thumbnail_url?.trim() || null;

    try {
      const [existing] = await pool.query("SELECT id FROM products WHERE slug = ?", [slug]);
      if (existing.length > 0) {
        if (req.file?.path) await deleteCloudinaryImage(req.file.path);
        return res.status(409).json({ message: "Product with this slug already exists" });
      }

      const [result] = await pool.query(
        `INSERT INTO products (name, slug, description, price, stock, category_id, thumbnail_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, slug, description || null, price,
          stock ?? 0, category_id || null,
          finalThumbnailUrl,
          is_active !== false && is_active !== "false" ? 1 : 0,
        ]
      );

      const [newRow] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
      res.status(201).json(newRow[0]);
    } catch (err) {
      if (req.file?.path) await deleteCloudinaryImage(req.file.path);
      console.error("Admin product create error", err);
      res.status(500).json({ message: "Failed to create product", error: err.message });
    }
  }
);

// PUT /admin/products/:id — update
router.put(
  "/products/:id",
  adminGuard,
  upload.single("thumbnail_file"),
  productValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file?.path) await deleteCloudinaryImage(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, description, price, stock, category_id, thumbnail_url, is_active } = req.body;
    const id = req.params.id;

    try {
      const [currentProduct] = await pool.query(
        "SELECT thumbnail_url FROM products WHERE id = ?",
        [id]
      );
      if (currentProduct.length === 0) {
        if (req.file?.path) await deleteCloudinaryImage(req.file.path);
        return res.status(404).json({ message: "Product not found" });
      }

      let finalThumbnailUrl = currentProduct[0].thumbnail_url;

      if (req.file?.path) {
        // New file uploaded to Cloudinary — delete the old one
        await deleteCloudinaryImage(currentProduct[0].thumbnail_url);
        finalThumbnailUrl = req.file.path; // Cloudinary HTTPS URL
      } else if (thumbnail_url?.trim()) {
        finalThumbnailUrl = thumbnail_url.trim();
      }

      const finalSlug = slug?.trim() || slugify(name);
      const [existing] = await pool.query(
        "SELECT id FROM products WHERE slug = ? AND id != ?",
        [finalSlug, id]
      );
      if (existing.length > 0) {
        if (req.file?.path) await deleteCloudinaryImage(req.file.path);
        return res.status(409).json({ message: "Product with this slug already exists" });
      }

      await pool.query(
        `UPDATE products 
         SET name = ?, slug = ?, description = ?, price = ?, stock = ?, 
             category_id = ?, thumbnail_url = ?, is_active = ?
         WHERE id = ?`,
        [
          name, finalSlug, description || null, price,
          stock ?? 0, category_id || null,
          finalThumbnailUrl,
          is_active !== false && is_active !== "false" ? 1 : 0,
          id,
        ]
      );

      const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
      res.json(rows[0]);
    } catch (err) {
      if (req.file?.path) await deleteCloudinaryImage(req.file.path);
      console.error("Admin product update error", err);
      res.status(500).json({ message: "Failed to update product", error: err.message });
    }
  }
);

// PATCH status
router.patch("/products/:id/status", adminGuard, async (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active !== "boolean") {
    return res.status(400).json({ message: "is_active (boolean) required" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE products SET is_active = ? WHERE id = ?",
      [is_active ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product status updated", is_active });
  } catch (err) {
    console.error("Admin product status error", err);
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
});

// PATCH stock
router.patch("/products/:id/stock", adminGuard, async (req, res) => {
  const stock = parseInt(req.body.stock, 10);
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ message: "stock (number >= 0) required" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE products SET stock = ? WHERE id = ?",
      [stock, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Stock updated", stock });
  } catch (err) {
    console.error("Admin product stock error", err);
    res.status(500).json({ message: "Failed to update stock", error: err.message });
  }
});

// DELETE product
router.delete("/products/:id", adminGuard, async (req, res) => {
  try {
    // Delete image from Cloudinary too
    const [rows] = await pool.query("SELECT thumbnail_url FROM products WHERE id = ?", [req.params.id]);
    if (rows[0]?.thumbnail_url) {
      await deleteCloudinaryImage(rows[0].thumbnail_url);
    }

    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Admin product delete error", err);
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

// ── Categories ────────────────────────────────────────────────────────────
router.get("/categories", adminGuard, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, slug FROM categories ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Admin categories error", err);
    res.status(500).json({ message: "Failed to load categories", error: err.message });
  }
});

export default router;