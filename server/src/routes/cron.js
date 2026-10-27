import express from "express";
import { config } from "../config.js";
import { resetDemoLab } from "../lib/demo-lab-reset.js";

export const cronRouter = express.Router();

function requireCronSecret(req, res, next) {
  const expected = config.cronSecret;
  if (!expected) {
    return res.status(503).json({ error: "CRON_SECRET is not set." });
  }
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (given !== expected) {
    return res.status(401).json({ error: "Not authorised." });
  }
  next();
}

cronRouter.get("/debug", (req, res) => {
  res.json({
    hasSecretInConfig: Boolean(config.cronSecret),
    secretLength: config.cronSecret.length,
    hasSecretInEnv: Boolean(process.env.CRON_SECRET),
    envLength: (process.env.CRON_SECRET || "").length,
  });
});

cronRouter.get("/reset-demo-lab", requireCronSecret, async (req, res) => {
  try {
    const result = await resetDemoLab();
    console.log("[cron] demo lab reset:", result);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] demo lab reset failed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});