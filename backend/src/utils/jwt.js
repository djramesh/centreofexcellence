import jwt from "jsonwebtoken";
import crypto from "crypto";

// Pinned so a forged `alg` header cannot select a different (weaker)
// verification path than the one we signed with.
const JWT_ALGORITHM = "HS256";

let ephemeralSecret = null;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    // A hardcoded fallback secret is the same as no signature at all once it
    // exists in the repo, so refuse rather than silently accept forged tokens.
    throw new Error("JWT_SECRET must be set in production");
  }

  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "⚠️  JWT_SECRET not set — using a random per-process secret. " +
        "Existing sessions will not survive a restart."
    );
  }
  return ephemeralSecret;
}

export function signJwt(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    algorithm: JWT_ALGORITHM,
  });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, getSecret(), { algorithms: [JWT_ALGORITHM] });
  } catch {
    return null;
  }
}
