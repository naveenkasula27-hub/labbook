import jwt from "jsonwebtoken";
import { config } from "../config.js";

const EXPIRES_IN = "30d"; // a lab owner stays logged in for a month

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), lab: user.lab ? String(user.lab) : null, role: user.role },
    config.jwtSecret,
    { expiresIn: EXPIRES_IN }
  );
}

export function verifyToken(token) {
  // Throws on an expired or tampered token — callers catch this.
  return jwt.verify(token, config.jwtSecret);
}
