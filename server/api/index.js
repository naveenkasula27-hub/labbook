/**
 * Entry point for Vercel.
 *
 * Locally you run `npm run dev`, which starts src/index.js as a normal server.
 * On Vercel there is no long-running server: this file is called for each
 * request instead, so it makes sure the database is connected first and then
 * hands the request to the same Express app.
 */
import { createApp } from "../src/index.js";
import { cachedConnect } from "../src/db.js";

const app = createApp();

export default async function handler(req, res) {
  try {
    await cachedConnect();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "The lab's system is temporarily unavailable. Please try again in a moment.",
      })
    );
    return;
  }

  return app(req, res);
}
