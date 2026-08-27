import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

import { getDbPool } from "../config/db.js";
import { signJwt } from "../utils/jwt.js";
import { authRequired } from "../middleware/auth.js";
import { fail } from "../utils/http.js";

const router = express.Router();
const pool = getDbPool();

const BCRYPT_ROUNDS = 12;

/* A precomputed hash of a value nobody can supply. When an email is unknown we
   still run one bcrypt comparison against it, so "no such user" and "wrong
   password" take the same time. Without it, response latency tells an attacker
   which email addresses are registered. */
const DUMMY_HASH = bcrypt.hashSync("unused-placeholder-for-timing-parity", BCRYPT_ROUNDS);

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 191 }),
  body("password")
    .isLength({ min: 8, max: 200 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain a letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage("Enter a valid phone number"),
];

const loginValidation = [
  // Deliberately NOT enforcing the register rules here: existing accounts
  // created under the old 6-character policy must still be able to sign in.
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail({ gmail_remove_dots: false }),
  body("password").notEmpty().withMessage("Password is required"),
];

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
});

router.post("/register", registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // `role` is hardcoded — never taken from the request body, so a crafted
    // payload cannot self-register an admin.
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
      [name, email, phone || null, passwordHash]
    );

    const user = { id: result.insertId, name, email, phone: phone || null, role: "user" };
    res.status(201).json({ token: signJwt(publicUser(user)), user: publicUser(user) });
  } catch (err) {
    // A racing duplicate insert trips the UNIQUE index rather than the check above.
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already registered" });
    }
    fail(res, 500, "Registration failed", err);
  }
});

router.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

    // One generic message for both branches — never reveal whether the email
    // exists.
    if (!user || !passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: signJwt(publicUser(user)), user: publicUser(user) });
  } catch (err) {
    fail(res, 500, "Login failed", err);
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json({ user: rows[0] });
  } catch (err) {
    fail(res, 500, "Failed to load profile", err);
  }
});

/** PATCH /api/auth/me — update own name / phone. Email and role are immutable here. */
router.patch(
  "/me",
  authRequired,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 100 }),
    body("phone")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^[0-9+\-\s()]{6,20}$/)
      .withMessage("Enter a valid phone number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const updates = [];
    const params = [];
    if (req.body.name !== undefined) {
      updates.push("name = ?");
      params.push(String(req.body.name).trim());
    }
    if (req.body.phone !== undefined) {
      updates.push("phone = ?");
      params.push(String(req.body.phone).trim() || null);
    }

    if (!updates.length) return res.status(400).json({ message: "Nothing to update" });

    try {
      await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, [
        ...params,
        req.user.id,
      ]);
      const [rows] = await pool.query(
        "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1",
        [req.user.id]
      );
      res.json({ user: rows[0] });
    } catch (err) {
      fail(res, 500, "Failed to update profile", err);
    }
  }
);

/** POST /api/auth/change-password — requires the current password. */
router.post(
  "/change-password",
  authRequired,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8, max: 200 })
      .withMessage("New password must be at least 8 characters")
      .matches(/[a-zA-Z]/)
      .withMessage("New password must contain a letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const [rows] = await pool.query(
        "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
        [req.user.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      const matches = await bcrypt.compare(req.body.currentPassword, rows[0].password_hash);
      if (!matches) return res.status(401).json({ message: "Current password is incorrect" });

      const passwordHash = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        req.user.id,
      ]);

      res.json({ message: "Password updated" });
    } catch (err) {
      fail(res, 500, "Failed to change password", err);
    }
  }
);

router.post("/logout", (req, res) => {
  // JWTs are stateless: logout is the client discarding its token.
  res.json({ message: "Logged out" });
});

export default router;
