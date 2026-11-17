import { createHmac } from "node:crypto";
import { RateBucket } from "../models/RateBucket.js";
import { config } from "../config.js";
// Atomic increment on a unique id. Retrying a competing first insert never resets its count.
export function sharedLimit(scope, limit, windowMs, message) {
  return async (req, res, next) => {
    const now = Date.now();
    const bucket = Math.floor(now / windowMs);
    const ip = createHmac("sha256", config.jwtSecret).update(req.ip || "unknown").digest("hex");
    const id = `${scope}:${bucket}:${ip}`;
    const expiresAt = new Date((bucket + 1) * windowMs);
    let row;
    try {
      row = await RateBucket.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, new: true });
    } catch (err) {
      if (err.code !== 11000) throw err;
      row = await RateBucket.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { new: true });
    }
    if (row.count > limit) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000))));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
