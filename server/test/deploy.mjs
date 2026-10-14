/**
 * Checks the things that only matter once this is hosted, with no database.
 *
 *   npm test
 *
 * Covers which websites may call the API, that the Vercel entry point reuses
 * one database connection instead of opening one per request, and that
 * production refuses to start on unsafe settings.
 *
 * CLIENT_ORIGIN is set at the top because config.js reads it once when first
 * imported. Each test file gets its own process, so this does not affect the
 * other files.
 */
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { execFileSync } from "node:child_process";
import mongoose from "mongoose";

process.env.CLIENT_ORIGIN = "https://labbook.vercel.app,*.vercel.app,http://localhost:5174";
process.env.JWT_SECRET = "deploy-test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/labbook_never_connected";

const { createApp } = await import("../src/index.js");

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
});

const allowedFor = async (origin) => {
  const res = await fetch(`${base}/api/health`, { headers: origin ? { Origin: origin } : {} });
  return res.headers.get("access-control-allow-origin");
};

/* ---------- which websites may call the API ---------- */

test("a request with no Origin is allowed", async () => {
  // curl, health checks and server-to-server calls send no Origin. Blocking
  // them would break monitoring without making anything safer.
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
});

test("the lab's own website is allowed", async () => {
  assert.equal(await allowedFor("https://labbook.vercel.app"), "https://labbook.vercel.app");
  assert.equal(await allowedFor("http://localhost:5174"), "http://localhost:5174");
});

test("a Vercel preview address is allowed by the wildcard", async () => {
  const preview = "https://labbook-git-main-naveen.vercel.app";
  assert.equal(await allowedFor(preview), preview);
});

test("an unrelated website is refused", async () => {
  assert.equal(await allowedFor("https://evil.example.com"), null);
  assert.equal(await allowedFor("http://labbook.vercel.app.evil.com"), null);
});

test("a lookalike domain is refused", async () => {
  // Ends with "vercel.app" as text but is not a vercel.app host.
  assert.equal(await allowedFor("https://notvercel.app"), null);
  assert.equal(await allowedFor("https://myvercel.app"), null);
});

/* ---------- the Vercel entry point ---------- */

test("the serverless entry reuses one database connection", async () => {
  const CACHE = Symbol.for("labbook.mongoose.connection");
  const realConnect = mongoose.connect;
  let calls = 0;
  mongoose.connect = async () => {
    calls++;
    return mongoose;
  };
  globalThis[CACHE] = null;

  try {
    const { default: handler } = await import("../api/index.js");
    assert.equal(typeof handler, "function");

    const s = http.createServer((req, res) => handler(req, res));
    await new Promise((r) => s.listen(0, r));
    const b = `http://127.0.0.1:${s.address().port}`;

    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${b}/api/health`);
      assert.equal(res.status, 200);
    }
    assert.equal(calls, 1, "six requests should share one connection, not open six");

    await new Promise((r) => s.close(r));
  } finally {
    mongoose.connect = realConnect;
    globalThis[CACHE] = null;
  }
});

test("many requests at once still open only one connection", async () => {
  const CACHE = Symbol.for("labbook.mongoose.connection");
  const realConnect = mongoose.connect;
  let calls = 0;
  mongoose.connect = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20));
    return mongoose;
  };
  globalThis[CACHE] = null;

  try {
    const { cachedConnect } = await import("../src/db.js");
    await Promise.all(Array.from({ length: 12 }, () => cachedConnect()));
    assert.equal(calls, 1, "a burst of requests must not each open a connection");
  } finally {
    mongoose.connect = realConnect;
    globalThis[CACHE] = null;
  }
});

test("a failed connection is retried on the next request", async () => {
  const CACHE = Symbol.for("labbook.mongoose.connection");
  const realConnect = mongoose.connect;
  let calls = 0;
  mongoose.connect = async () => {
    calls++;
    throw new Error("cluster unreachable");
  };
  globalThis[CACHE] = null;

  try {
    const { cachedConnect } = await import("../src/db.js");
    for (let i = 0; i < 3; i++) {
      await assert.rejects(() => cachedConnect());
    }
    // Without clearing the cache on failure, the first rejected promise would
    // be handed to every later request and the site would never recover.
    assert.equal(calls, 3, "each retry should attempt a real connection");
  } finally {
    mongoose.connect = realConnect;
    globalThis[CACHE] = null;
  }
});

/* ---------- production refuses unsafe settings ---------- */

/** Loads config.js in a fresh process with NODE_ENV=production. */
function productionConfig(env) {
  try {
    execFileSync(
      process.execPath,
      ["--input-type=module", "-e", "await import('./src/config.js')"],
      { env: { ...process.env, NODE_ENV: "production", ...env }, stdio: "pipe" }
    );
    return null; // started fine
  } catch (err) {
    return `${err.stderr || ""}${err.stdout || ""}`;
  }
}

test("production will not start without a JWT secret", () => {
  const out = productionConfig({ JWT_SECRET: "", MONGODB_URI: "mongodb+srv://u:p@c.mongodb.net/labbook" });
  assert.match(out || "", /Missing JWT_SECRET/);
});

test("production will not start on the development secret", () => {
  const out = productionConfig({
    JWT_SECRET: "dev-only-insecure-secret",
    MONGODB_URI: "mongodb+srv://u:p@c.mongodb.net/labbook",
  });
  assert.match(out || "", /real JWT_SECRET/);
});

test("production will not start pointing at a local database", () => {
  // The usual mistake: deploying with the .env left as it was for development,
  // which would start a live site that can never reach its data.
  const out = productionConfig({ JWT_SECRET: "real", MONGODB_URI: "mongodb://127.0.0.1:27017/labbook" });
  assert.match(out || "", /local database/);
});

test("production will not start without a database at all", () => {
  const out = productionConfig({ JWT_SECRET: "real", MONGODB_URI: "" });
  assert.match(out || "", /Missing MONGODB_URI/);
});

test("production starts with proper settings", () => {
  const out = productionConfig({
    JWT_SECRET: "a-real-long-random-secret",
    MONGODB_URI: "mongodb+srv://user:pass@cluster0.wgmobke.mongodb.net/labbook",
  });
  assert.equal(out, null, `production should start, but it printed: ${out}`);
});
