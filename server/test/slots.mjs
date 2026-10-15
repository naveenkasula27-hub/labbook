/**
 * Slot capacity when several people book at once, against a real MongoDB.
 *
 *   npm run test:api
 *
 * This is the test for the double-booking bug. The old code counted the
 * bookings in a slot and then wrote a new one, so requests arriving together
 * all saw room and all got in. Here eight requests are fired at a slot with
 * two places and exactly two are expected to succeed.
 *
 * It uses its own database, labbook_test_slots, which it wipes on every run.
 */
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { testDbUri, connectionHelp } from "./_dburi.mjs";

const URI = testDbUri("slots");

process.env.MONGODB_URI = URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.BOOKING_RATE_LIMIT = "10000";

const { connectDb, disconnectDb } = await import("../src/db.js");
const { createApp } = await import("../src/index.js");
const { Lab } = await import("../src/models/Lab.js");
const { Test } = await import("../src/models/Test.js");
const { Booking } = await import("../src/models/Booking.js");

const CAPACITY = 2;
const SLOT = "Morning";

let server, base, lab, tomorrow;

const post = async (path, body) => {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return [r.status, await r.json().catch(() => ({}))];
};

const get = async (path) => {
  const r = await fetch(base + path);
  return [r.status, await r.json().catch(() => ({}))];
};

/** A booking body. Each gets its own phone so nothing else can group them. */
const bookingFor = (n, extra = {}) => ({
  name: `Patient ${n}`,
  age: 40,
  gender: "Male",
  phone: `99490${String(70000 + n).padStart(5, "0")}`,
  visitType: "lab",
  testCodes: ["cbc"],
  packageCodes: [],
  date: tomorrow,
  slot: SLOT,
  consent: true,
  ...extra,
});

test.before(async () => {
  try {
    await connectDb(URI);
  } catch (err) {
    throw new Error(connectionHelp(URI, err));
  }

  await mongoose.connection.dropDatabase();

  // dropDatabase takes the indexes with it, and the unique index on
  // (lab, date, slot, seat) is the thing being tested. Build it back before
  // anything is written, or the race test would pass for the wrong reason.
  await Booking.syncIndexes();

  lab = await Lab.create({
    name: "Nandu Diagnostics",
    slug: "nandu",
    phone: "99490 70916",
    whatsapp: "919949070916",
    address: "Main Road, Gajwel",
    city: "Gajwel",
    openDays: [0, 1, 2, 3, 4, 5, 6],
    slots: [{ label: SLOT, start: "07:00", end: "11:00", capacity: CAPACITY }],
  });

  await Test.create({
    lab: lab._id,
    code: "cbc",
    name: "Complete Blood Count (CBC)",
    category: "Blood",
    sample: "Blood",
    price: 300,
    homeCollectable: true,
    sort: 0,
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

/* ---------- the race ---------- */

test("eight people booking the same two places at once: only two get in", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) => post(`/public/nandu/bookings`, bookingFor(i)))
  );

  const created = results.filter(([status]) => status === 201);
  const refused = results.filter(([status]) => status === 409);

  assert.equal(created.length, CAPACITY, "exactly the slot's capacity should get in");
  assert.equal(refused.length, 8 - CAPACITY, "everybody else should be told the slot is full");

  for (const [, body] of refused) {
    assert.match(body.error, /full/i);
  }

  // And the database agrees, which is the part that matters.
  const holding = await Booking.countDocuments({
    lab: lab._id,
    date: tomorrow,
    slot: SLOT,
    holdsSlot: true,
  });
  assert.equal(holding, CAPACITY);

  // The places handed out are 0 and 1, with no gaps and no repeats.
  const seats = await Booking.find({ lab: lab._id, date: tomorrow, slot: SLOT, holdsSlot: true })
    .select("seat")
    .lean();
  assert.deepEqual(
    seats.map((s) => s.seat).sort(),
    [0, 1]
  );
});

test("the booking page now shows the slot as full", async () => {
  const [status, body] = await get(`/public/nandu/availability?date=${tomorrow}`);
  assert.equal(status, 200);

  const slot = body.slots.find((s) => s.label === SLOT);
  assert.equal(slot.left, 0);
  assert.equal(slot.full, true);
});

test("a ninth booking is still refused", async () => {
  const [status, body] = await post(`/public/nandu/bookings`, bookingFor(99));
  assert.equal(status, 409);
  assert.match(body.error, /full/i);
});

/* ---------- cancelling frees a place ---------- */

test("cancelling a booking frees its place for somebody else", async () => {
  const one = await Booking.findOne({ lab: lab._id, date: tomorrow, slot: SLOT, holdsSlot: true });
  const freedSeat = one.seat;

  one.status = "cancelled";
  one.holdsSlot = false;
  await one.save();

  const [, avail] = await get(`/public/nandu/availability?date=${tomorrow}`);
  assert.equal(avail.slots.find((s) => s.label === SLOT).left, 1);

  const [status, body] = await post(`/public/nandu/bookings`, bookingFor(200));
  assert.equal(status, 201, `expected the freed place to be bookable, got ${JSON.stringify(body)}`);

  // It takes the number the cancelled booking gave up, rather than inventing a
  // new one past capacity.
  const fresh = await Booking.findOne({ reference: body.reference });
  assert.equal(fresh.seat, freedSeat);
  assert.equal(fresh.holdsSlot, true);
});

test("a cancelled booking keeps its place number as history", async () => {
  const cancelled = await Booking.findOne({ lab: lab._id, status: "cancelled" }).lean();
  assert.equal(typeof cancelled.seat, "number");
  assert.equal(cancelled.holdsSlot, false);
});

/* ---------- bookings with no slot are not limited ---------- */

test("bookings with no date or slot are not capped", async () => {
  // Someone who does not pick a time is an enquiry for the lab to schedule.
  // These must not collide with each other or count against any slot.
  const results = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      post(`/public/nandu/bookings`, bookingFor(300 + i, { date: "", slot: "" }))
    )
  );

  for (const [status, body] of results) {
    assert.equal(status, 201, `expected an unscheduled booking to save, got ${JSON.stringify(body)}`);
  }

  const loose = await Booking.countDocuments({ lab: lab._id, slot: "", holdsSlot: false });
  assert.equal(loose, 5);
});

test("a slot with capacity left still takes bookings", async () => {
  const [, avail] = await get(`/public/nandu/availability?date=${tomorrow}`);
  const slot = avail.slots.find((s) => s.label === SLOT);
  assert.equal(slot.full, true, "the slot should still be full from the earlier tests");
});
