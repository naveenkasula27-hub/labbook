import { verifyToken } from "../lib/jwt.js";
import { User } from "../models/User.js";

/**
 * Reads the "Authorization: Bearer <token>" header, checks it, and loads the
 * user. Puts req.user (the Mongoose doc) and req.labId (string, or null for
 * an admin) on the request. Every dashboard route needs this before it runs.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in." });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }

  const user = await User.findById(payload.sub).lean();
  if (!user || !user.active) {
    return res.status(401).json({ error: "This account is no longer active." });
  }

  req.user = user;
  req.labId = user.lab ? String(user.lab) : null;
  next();
}

/**
 * Must run after requireAuth. Blocks anyone without a lab attached — an
 * "admin" user with no lab should use separate admin routes, not these.
 */
export function requireLab(req, res, next) {
  if (!req.labId) return res.status(403).json({ error: "This account is not attached to a lab." });
  next();
}
