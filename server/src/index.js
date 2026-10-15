import express from "express";
import cors from "cors";
import { pathToFileURL } from "node:url";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { publicRouter } from "./routes/public.js";
import { authRouter } from "./routes/auth.js";
import { dashboardBookingsRouter } from "./routes/dashboard-bookings.js";
import { dashboardCatalogRouter } from "./routes/dashboard-catalog.js";

/**
 * Decides which websites may call this API.
 *
 * A request with no Origin header is allowed: that is curl, a health check, or
 * another server, none of which the browser's same-origin rules apply to.
 * Blocking those would break the health check without making anything safer.
 *
 * Vercel also gives every deployment its own address, so an entry ending in
 * ".vercel.app" is matched as a suffix rather than exactly.
 */
function allowedOrigin(origin, callback) {
  if (!origin) return callback(null, true);

  const allowed = config.clientOrigin.split(",").map((s) => s.trim()).filter(Boolean);

  const ok = allowed.some((entry) => {
    if (entry === origin) return true;
    if (entry.startsWith("*.")) {
      const suffix = entry.slice(1); // "*.vercel.app" -> ".vercel.app"
      try {
        return new URL(origin).hostname.endsWith(suffix);
      } catch {
        return false;
      }
    }
    return false;
  });

  if (ok) return callback(null, true);
  return callback(new Error(`This website is not allowed to use this API: ${origin}`));
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);           // behind Vercel / nginx, so rate limiting sees the real IP
  app.use(express.json({ limit: "100kb" }));
  app.use(cors({ origin: allowedOrigin, credentials: true }));

  // The API has no pages. Someone who opens the address in a browser should
  // get a plain answer rather than a crash.
  app.get("/", (req, res) => res.json({ service: "LabBook API" }));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, env: config.env, whatsapp: config.whatsapp.enabled });
  });

  app.use("/api/public", publicRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard/bookings", dashboardBookingsRouter);
  app.use("/api/dashboard/catalog", dashboardCatalogRouter);

  app.use((req, res) => res.status(404).json({ error: "Not found." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "The request body was not valid JSON." });
    }
    res.status(500).json({ error: "Something went wrong on our side." });
  });

  return app;
}

// Only start listening when run directly, so tests can import createApp().
const runDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  connectDb()
    .then(() => {
      createApp().listen(config.port, () => {
        console.log(`API on http://localhost:${config.port}`);
        if (!config.whatsapp.enabled) {
          console.log("WhatsApp is off (no token in .env). Bookings still save and are logged.");
        }
      });
    })
    .catch((err) => {
      console.error("Could not start:", err.message);
      process.exit(1);
    });
}
