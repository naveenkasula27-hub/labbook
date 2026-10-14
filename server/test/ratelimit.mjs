/**
 * The booking rate limiter, in its own file so it gets its own low limit.
 * Each test file runs as a separate process, so BOOKING_RATE_LIMIT here
 * does not affect the other tests.
 *
 * Needs MongoDB, like test/api.mjs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { testDbUri, connectionHelp } from "./_dburi.mjs";

const URI = testDbUri("ratelimit");

process.env.MONGODB_URI = URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.BOOKING_RATE_LIMIT = "3";

const { connectDb, disconnectDb } = await import("../src/db.js");
const { createApp } = await import("../src/index.js");
const { Lab } = await import("../src/models/Lab.js");
const { Test } = await import("../src/models/Test.js");

let server, base, tomorrow;

test.before(async () => {
  try {
    await connectDb(URI);
  } catch (err) {
    throw new Error(connectionHelp(URI, err));
  }
  await mongoose.connection.dropDatabase();

  const lab = await Lab.create({ name: "Rate Lab", slug: "ratelab", phone: "90000 00000" });
  await Test.create({
    lab: lab._id,
    code: "cbc",
    name: "Complete Blood Count (CBC)",
    category: "Routine",
    sample: "Blood",
    price: 300,
  });

  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await disconnectDb();
});

test("the fourth booking from one device is refused", async () => {
  const body = (n) => ({
    name: `Caller ${n}`,
    age: 30,
    gender: "Male",
    phone: "9949070916",
    visitType: "lab",
    testCodes: ["cbc"],
    date: tomorrow,
    slot: "Morning",
    consent: true,
  });

  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${base}/public/ratelab/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(i)),
    });
    codes.push(r.status);
  }

  assert.deepEqual(codes.slice(0, 3), [201, 201, 201], `first three should succeed, got ${codes}`);
  assert.equal(codes[3], 429, `fourth should be refused, got ${codes}`);
  assert.equal(codes[4], 429);
});
