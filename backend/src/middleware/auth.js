import { verifyJwt } from "../utils/jwt.js";
import { getDbPool } from "../config/db.js";

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const decoded = verifyJwt(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}

/**
 * Role check against the JWT claim alone. Cheap, but a token minted before a
 * role change keeps the stale role until it expires — so do not use this to
 * gate privileged routes. See `requireAdmin`.
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

/**
 * Admin check that re-reads the role from the database on every request, so
 * revoking someone's admin rights takes effect immediately instead of when
 * their (up to 7-day) token happens to expire.
 */
export async function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const [rows] = await getDbPool().query(
      "SELECT role FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    if (rows[0]?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user.role = rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
}

/** Guard chain for every admin-only route. */
export const adminGuard = [authRequired, requireAdmin];
