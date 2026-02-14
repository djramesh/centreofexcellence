import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

import { getDbPool } from "../config/db.js";
import { signJwt } from "../utils/jwt.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const pool = getDbPool();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone } = req.body;

  try {
    const [existingRows] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
      [name, email, phone || null, passwordHash]
    );

    const userId = result.insertId;
    const token = signJwt({ id: userId, name, email, role: "user" });

    res.status(201).json({
      token,
      user: { id: userId, name, email, phone: phone || null, role: "user" },
    });
  } catch (err) {
    console.error("Register error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signJwt({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.json({ user });
  } catch (err) {
    console.error("/me error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  // JWT-based logout is handled client-side (by forgetting the token)
  res.json({ message: "Logged out" });
});

export default router;

