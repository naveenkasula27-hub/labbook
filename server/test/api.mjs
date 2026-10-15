/**
 * End-to-end test of the public booking API against a real MongoDB.
 *
 *   npm run test:api
 *
 * It needs a MongoDB it can write to and WIPE. By default it uses
 * mongodb://127.0.0.1:27017/labbook_test — a separate database from your real
 * one. Override with TEST_MONGODB_URI if you want.
 *
 * Nothing is sent to WhatsApp: with no token in .env, sends are logged instead.
 */
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { testDbUri, connectionHelp } from "./_dburi.mjs";

const URI = testDbUri("api");

process.env.MONGODB_URI = URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
process.env.WHATSAPP_ACCESS_TOKEN = "";   // keep the test offline
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.BOOKING_RATE_LIMIT = "10000"; // the limiter has its own test file

const { connectDb, disconnectDb } = await import("../src/db.js");
const { createApp } = await import("../src/index.js");
const { Lab } = await import("../src/models/Lab.js");
const { Test } = await import("../src/models/Test.js");
const { Package } = await import("../src/models/Package.js");
const { Booking } = await import("../src/models/Booking.js");
const { makeReference } = await import("../src/lib/reference.js");
const { CATALOG, PACKAGE_TEMPLATES } = await import("../src/seed/catalog.js");

let server, base, lab, tomorrow;

const api = {
  async get(path) {
    const r = await fetch(base + path);
    return [r.status, await r.json().catch(() => ({}))];
  },
  async post(path, body) {
    const r = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return [r.status, await r.json().catch(() => ({}))];
  },
};

test.before(async () => {
  try {
    await connectDb(URI);
  } catch (err) {
    throw new Error(connectionHelp(URI, err));
  }

  // Wipe, so a rerun is clean.
  await mongoose.connection.dropDatabase();

  lab = await Lab.create({
    name: "Nandu Diagnostics",
    slug: "nandu",
    phone: "99490 70916",
    whatsapp: "919949070916",
    address: "Main Road, Gajwel",
    city: "Gajwel",
    homeCollection: true,
    homeCollectionFee: 100,
  });

  await Test.insertMany(
    CATALOG.map((t, i) => ({
      lab: lab._id,
      code: t.code,
      name: t.name,
      alias: t.alias || "",
      category: t.category,
      sample: t.sample,
      fasting: t.fasting || "",
      reportTime: t.reportTime || "",
      homeCollectable: t.homeCollectable !== false,
      price: { cbc: 300, lipid: 600 }[t.code] ?? null,
      sort: i,
    }))
  );

  await Package.insertMany(
    PACKAGE_TEMPLATES.map((p, i) => ({
      lab: lab._id,
      code: p.code,
      name: p.name,
      description: p.description,
      testCodes: p.testCodes,
      fasting: p.fasting || "",
      price: p.code === "fever_panel" ? 1200 : null,
      sort: i,
    }))
  );

  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;

  tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await disconnectDb();
});

const booking = () => ({
  name: "Ramesh Goud",
  age: 54,
  gender: "Male",
  phone: "9949070916",
  visitType: "lab",
  testCodes: ["cbc", "lipid"],
  packageCodes: [],
  date: tomorrow,
  slot: "Morning",
  consent: true,
});

/* ---------- profile ---------- */

test("health check responds", async () => {
  const [status, body] = await api.get("/health");
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.whatsapp, false); // no token in a test run
});

test("lab profile returns tests, packages and categories", async () => {
  const [status, body] = await api.get("/public/nandu");
  assert.equal(status, 200);
  assert.equal(body.lab.name, "Nandu Diagnostics");
  assert.equal(body.tests.length, CATALOG.length);
  assert.equal(body.packages.length, PACKAGE_TEMPLATES.length);
  assert.equal(body.categories[0], "Routine");
  assert.equal(body.lab.slots.length, 3);
});

test("profile hides internal fields", async () => {
  const [, body] = await api.get("/public/nandu");
  assert.ok(!("plan" in body.lab), "plan should not be public");
  assert.ok(!("_id" in body.lab), "id should not be public");
  assert.ok(!("notify" in body.lab), "notification settings should not be public");
});

test("unknown lab gives 404", async () => {
  const [status] = await api.get("/public/not-a-lab");
  assert.equal(status, 404);
});

/* ---------- availability ---------- */

test("availability lists open slots", async () => {
  const [status, body] = await api.get(`/public/nandu/availability?date=${tomorrow}`);
  assert.equal(status, 200);
  assert.equal(body.open, true);
  assert.equal(body.slots.length, 3);
  assert.equal(body.slots[0].left, 20);
  assert.equal(body.slots[0].full, false);
});

test("availability rejects bad and past dates", async () => {
  assert.equal((await api.get("/public/nandu/availability?date=nonsense"))[0], 400);
  assert.equal((await api.get("/public/nandu/availability?date=2020-01-01"))[0], 400);
  assert.equal((await api.get("/public/nandu/availability"))[0], 400);
});

/* ---------- booking validation ---------- */

test("booking needs consent", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", { ...booking(), consent: false });
  assert.equal(status, 400);
  assert.match(body.error, /consent/i);
});

test("booking rejects a bad phone number", async () => {
  for (const phone of ["12345", "4023456789", "abcdefghij", ""]) {
    const [status] = await api.post("/public/nandu/bookings", { ...booking(), phone });
    assert.equal(status, 400, `phone "${phone}" should be rejected`);
  }
});

test("booking needs at least one test or a note", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: [],
    notes: "",
  });
  assert.equal(status, 400);
  assert.equal(body.field, "testCodes");
});

test("a note alone is enough", async () => {
  const [status] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: [],
    notes: "Doctor wrote something I cannot read, please check.",
  });
  assert.equal(status, 201);
});

test("home collection needs an address", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    visitType: "home",
    address: "",
  });
  assert.equal(status, 400);
  assert.equal(body.field, "address");
});

test("scans cannot be booked for home collection", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: ["xray_chest"],
    visitType: "home",
    address: "H.No 4-21, Ambedkar Nagar, Gajwel",
  });
  assert.equal(status, 400);
  assert.match(body.error, /at the lab/i);
});

test("an unknown slot is rejected", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", { ...booking(), slot: "Midnight" });
  assert.equal(status, 400);
  assert.equal(body.field, "slot");
});

test("a past date is rejected", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", { ...booking(), date: "2020-01-01" });
  assert.equal(status, 400);
  assert.equal(body.field, "date");
});

test("age outside 0 to 120 is rejected", async () => {
  assert.equal((await api.post("/public/nandu/bookings", { ...booking(), age: 150 }))[0], 400);
  assert.equal((await api.post("/public/nandu/bookings", { ...booking(), age: -1 }))[0], 400);
});

/* ---------- booking success ---------- */

test("a valid booking is saved and priced", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", booking());
  assert.equal(status, 201);
  assert.match(body.reference, /^NAN-[2-9A-HJ-NP-Z]{5}$/);
  assert.equal(body.estimatedTotal, 900); // 300 + 600
  assert.equal(body.items.length, 2);
  assert.equal(body.status, "new");

  const saved = await Booking.findOne({ reference: body.reference }).lean();
  assert.ok(saved, "booking should be in the database");
  assert.equal(saved.patient.phone, "919949070916", "phone should be stored in international form");
  assert.equal(saved.source, "web");
  assert.equal(saved.statusLog.length, 1);
});

test("home collection adds the fee", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: [],
    packageCodes: ["fever_panel"],
    visitType: "home",
    address: "H.No 4-21, Ambedkar Nagar, Gajwel",
  });
  assert.equal(status, 201);
  assert.equal(body.estimatedTotal, 1300); // 1200 + 100 fee
});

test("total is null when any price is unset", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: ["cbc", "vit_d"], // vit_d has no price in this test lab
  });
  assert.equal(status, 201);
  assert.equal(body.estimatedTotal, null);
});

test("prices come from the database, not the browser", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: ["cbc"],
    items: [{ kind: "test", code: "cbc", name: "Free CBC", price: 1 }], // an attempt to set the price
  });
  assert.equal(status, 201);
  assert.equal(body.estimatedTotal, 300);
  assert.equal(body.items[0].name, "Complete Blood Count (CBC)");
});

test("unknown test codes are dropped, not fatal", async () => {
  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: ["cbc", "no_such_test"],
  });
  assert.equal(status, 201);
  assert.equal(body.items.length, 1);
});

test("one lab cannot book another lab's tests", async () => {
  const other = await Lab.create({ name: "Other Lab", slug: "other", phone: "90000 00000" });
  await Test.create({
    lab: other._id,
    code: "secret_test",
    name: "Other Lab Only Test",
    category: "Routine",
    sample: "Blood",
    price: 999,
  });

  const [status, body] = await api.post("/public/nandu/bookings", {
    ...booking(),
    testCodes: ["cbc", "secret_test"],
  });
  assert.equal(status, 201);
  assert.equal(body.items.length, 1, "the other lab's test must not come through");
  assert.equal(body.items[0].name, "Complete Blood Count (CBC)");

  await Test.deleteMany({ lab: other._id });
  await Lab.deleteOne({ _id: other._id });
});

/* ---------- patient lookup ---------- */

test("a patient can look up their booking with the last 4 digits", async () => {
  const [, made] = await api.post("/public/nandu/bookings", booking());

  const [noPhone] = await api.get(`/public/nandu/bookings/${made.reference}`);
  assert.equal(noPhone, 403, "reference alone must not be enough");

  const [wrong] = await api.get(`/public/nandu/bookings/${made.reference}?phone=1111`);
  assert.equal(wrong, 403);

  const [ok, body] = await api.get(`/public/nandu/bookings/${made.reference}?phone=0916`);
  assert.equal(ok, 200);
  assert.equal(body.reference, made.reference);
  assert.ok(!("patient" in body), "the lookup must not return patient details");
});

test("an unknown reference gives 404", async () => {
  const [status] = await api.get("/public/nandu/bookings/NAN-22222?phone=0916");
  assert.equal(status, 404);
});

/* ---------- slot capacity ---------- */

test("a full slot is marked full and refuses new bookings", async () => {
  const slot = "Afternoon";
  const capacity = lab.slots.find((s) => s.label === slot).capacity;

  // seat and holdsSlot are what mark a place as taken. Written here by hand
  // because these go straight into the database rather than through the
  // booking route, which sets them itself.
  await Booking.insertMany(
    Array.from({ length: capacity }, (_, i) => ({
      lab: lab._id,
      reference: `FIL-${String(i).padStart(5, "0")}`,
      patient: { name: "Filler", age: 30, gender: "Other", phone: "919000000000" },
      items: [{ kind: "test", code: "cbc", name: "CBC", price: 300 }],
      date: tomorrow,
      slot,
      status: "new",
      seat: i,
      holdsSlot: true,
    }))
  );

  const [, avail] = await api.get(`/public/nandu/availability?date=${tomorrow}`);
  const row = avail.slots.find((s) => s.label === slot);
  assert.equal(row.full, true);
  assert.equal(row.left, 0);

  const [status, body] = await api.post("/public/nandu/bookings", { ...booking(), slot });
  assert.equal(status, 409);
  assert.match(body.error, /full/i);
});

test("cancelled bookings free the slot again", async () => {
  const slot = "Afternoon";
  // Cancelling through the dashboard clears holdsSlot as well as the status.
  // Writing straight to the database, both have to be set here.
  await Booking.updateMany(
    { lab: lab._id, slot, reference: /^FIL-/ },
    { $set: { status: "cancelled", holdsSlot: false } }
  );

  const [, avail] = await api.get(`/public/nandu/availability?date=${tomorrow}`);
  const row = avail.slots.find((s) => s.label === slot);
  assert.equal(row.full, false, "cancelled bookings should not hold the slot");
});
