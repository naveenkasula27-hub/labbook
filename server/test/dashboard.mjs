/**
 * Dashboard API tests. Needs MongoDB.
 *
 *   npm run test:api
 *
 * The important ones here are the isolation tests: lab A must never be able
 * to read or change anything belonging to lab B, however it asks.
 */
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { testDbUri, connectionHelp } from "./_dburi.mjs";

const URI = testDbUri("dash");

process.env.MONGODB_URI = URI;
process.env.JWT_SECRET = "test-only-secret-for-dashboard";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.BOOKING_RATE_LIMIT = "10000";

const { connectDb, disconnectDb } = await import("../src/db.js");
const { createApp } = await import("../src/index.js");
const { Lab } = await import("../src/models/Lab.js");
const { Test } = await import("../src/models/Test.js");
const { Package } = await import("../src/models/Package.js");
const { Booking } = await import("../src/models/Booking.js");
const { User } = await import("../src/models/User.js");

let server, base;
let labA, labB, tokenA, tokenB, refA, refB;

const call = async (path, { method = "GET", token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [res.status, await res.json().catch(() => ({}))];
};

async function makeLab({ name, slug, email, password }) {
  const lab = await Lab.create({ name, slug, phone: "90000 00000", whatsapp: "919000000000" });
  await Test.insertMany([
    { lab: lab._id, code: "cbc", name: "Complete Blood Count (CBC)", category: "Routine", sample: "Blood", price: 300, sort: 0 },
    { lab: lab._id, code: "lipid", name: "Lipid Profile", category: "Heart", sample: "Blood", price: 600, sort: 1 },
    { lab: lab._id, code: "vit_d", name: "Vitamin D", category: "Vitamins", sample: "Blood", price: null, sort: 2 },
  ]);
  await Package.create({
    lab: lab._id, code: "basic", name: "Basic Checkup", testCodes: ["cbc", "lipid"], price: 800, sort: 0,
  });
  await User.create({
    lab: lab._id, name: `${name} Owner`, email,
    passwordHash: await User.hashPassword(password), role: "owner",
  });
  return lab;
}

async function makeBooking(lab, over = {}) {
  const { makeReference } = await import("../src/lib/reference.js");
  return Booking.create({
    lab: lab._id,
    reference: makeReference(lab.slug),
    patient: { name: "Ramesh Kumar", age: 54, gender: "Male", phone: "919949070916" },
    visitType: "lab",
    items: [{ kind: "test", code: "cbc", name: "Complete Blood Count (CBC)", price: 300 }],
    estimatedTotal: 300,
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    slot: "Morning",
    status: "new",
    statusLog: [{ status: "new", by: "patient" }],
    consent: true,
    ...over,
  });
}

test.before(async () => {
  try {
    await connectDb(URI);
  } catch (err) {
    throw new Error(connectionHelp(URI, err));
  }
  await mongoose.connection.dropDatabase();

  labA = await makeLab({ name: "Nandu Diagnostics", slug: "nandu", email: "owner@nandu.test", password: "nandu1234" });
  labB = await makeLab({ name: "Rival Labs", slug: "rival", email: "owner@rival.test", password: "rival1234" });

  refA = (await makeBooking(labA)).reference;
  refB = (await makeBooking(labB, { patient: { name: "Someone Else", age: 40, gender: "Female", phone: "918888888888" } })).reference;

  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;

  [, { token: tokenA }] = await call("/auth/login", {
    method: "POST", body: { email: "owner@nandu.test", password: "nandu1234" },
  });
  [, { token: tokenB }] = await call("/auth/login", {
    method: "POST", body: { email: "owner@rival.test", password: "rival1234" },
  });
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await disconnectDb();
});

/* ---------- login ---------- */

test("login returns a token and the lab", async () => {
  const [status, body] = await call("/auth/login", {
    method: "POST", body: { email: "owner@nandu.test", password: "nandu1234" },
  });
  assert.equal(status, 200);
  assert.ok(body.token);
  assert.equal(body.lab.slug, "nandu");
  assert.equal(body.user.email, "owner@nandu.test");
  assert.ok(!("passwordHash" in body.user), "must never return the password hash");
});

test("login is case insensitive on the email", async () => {
  const [status] = await call("/auth/login", {
    method: "POST", body: { email: "OWNER@NANDU.TEST", password: "nandu1234" },
  });
  assert.equal(status, 200);
});

test("a wrong password is refused", async () => {
  const [status, body] = await call("/auth/login", {
    method: "POST", body: { email: "owner@nandu.test", password: "wrong" },
  });
  assert.equal(status, 401);
  assert.match(body.error, /not correct/i);
});

test("an unknown email gives the same message as a wrong password", async () => {
  const [s1, b1] = await call("/auth/login", {
    method: "POST", body: { email: "nobody@nowhere.test", password: "whatever" },
  });
  const [s2, b2] = await call("/auth/login", {
    method: "POST", body: { email: "owner@nandu.test", password: "wrong" },
  });
  assert.equal(s1, s2);
  assert.equal(b1.error, b2.error, "the two cases must be indistinguishable");
});

test("a deactivated account cannot log in", async () => {
  await User.updateOne({ email: "owner@rival.test" }, { $set: { active: false } });
  const [status] = await call("/auth/login", {
    method: "POST", body: { email: "owner@rival.test", password: "rival1234" },
  });
  assert.equal(status, 401);
  await User.updateOne({ email: "owner@rival.test" }, { $set: { active: true } });
});

test("/auth/me confirms a token is still good", async () => {
  const [status, body] = await call("/auth/me", { token: tokenA });
  assert.equal(status, 200);
  assert.equal(body.lab.slug, "nandu");
});

/* ---------- auth is actually required ---------- */

test("dashboard routes refuse a request with no token", async () => {
  for (const path of [
    "/dashboard/bookings",
    "/dashboard/bookings/summary",
    "/dashboard/catalog/tests",
    "/dashboard/catalog/packages",
    "/dashboard/catalog/settings",
  ]) {
    const [status] = await call(path);
    assert.equal(status, 401, `${path} should need a login`);
  }
});

test("a made up token is refused", async () => {
  const [status] = await call("/dashboard/bookings", { token: "not.a.real.token" });
  assert.equal(status, 401);
});

test("a token signed with the wrong secret is refused", async () => {
  const jwt = (await import("jsonwebtoken")).default;
  const forged = jwt.sign({ sub: "000000000000000000000000", lab: String(labA._id), role: "owner" }, "wrong-secret");
  const [status] = await call("/dashboard/bookings", { token: forged });
  assert.equal(status, 401);
});

/* ---------- one lab cannot see another's data ---------- */

test("a lab's booking list contains only its own bookings", async () => {
  const [status, body] = await call("/dashboard/bookings?status=all", { token: tokenA });
  assert.equal(status, 200);
  assert.equal(body.bookings.length, 1);
  assert.equal(body.bookings[0].reference, refA);
});

test("a lab cannot open another lab's booking by reference", async () => {
  const [status] = await call(`/dashboard/bookings/${refB}`, { token: tokenA });
  assert.equal(status, 404, "lab A must not be able to read lab B's booking");
});

test("a lab cannot change the status of another lab's booking", async () => {
  const [status] = await call(`/dashboard/bookings/${refB}/status`, {
    method: "PATCH", token: tokenA, body: { status: "cancelled" },
  });
  assert.equal(status, 404);

  const stillThere = await Booking.findOne({ reference: refB }).lean();
  assert.equal(stillThere.status, "new", "lab B's booking must be untouched");
});

test("searching cannot reach another lab's patients", async () => {
  const [status, body] = await call("/dashboard/bookings?q=Someone Else&status=all", { token: tokenA });
  assert.equal(status, 200);
  assert.equal(body.bookings.length, 0, "lab B's patient must not appear in lab A's search");
});

test("a lab cannot edit another lab's test price", async () => {
  // Both labs happen to have a test coded "cbc"; the update must only hit its own.
  const [status] = await call("/dashboard/catalog/tests/cbc", {
    method: "PATCH", token: tokenA, body: { price: 1 },
  });
  assert.equal(status, 200);

  const theirs = await Test.findOne({ lab: labB._id, code: "cbc" }).lean();
  assert.equal(theirs.price, 300, "lab B's price must not change");

  const mine = await Test.findOne({ lab: labA._id, code: "cbc" }).lean();
  assert.equal(mine.price, 1);

  await call("/dashboard/catalog/tests/cbc", { method: "PATCH", token: tokenA, body: { price: 300 } });
});

test("a lab's settings call returns its own lab", async () => {
  const [, a] = await call("/dashboard/catalog/settings", { token: tokenA });
  const [, b] = await call("/dashboard/catalog/settings", { token: tokenB });
  assert.equal(a.lab.slug, "nandu");
  assert.equal(b.lab.slug, "rival");
  assert.ok(!("_id" in a.lab), "internal id should not be returned");
});

/* ---------- the summary ---------- */

test("summary counts today, tomorrow and new", async () => {
  const [status, body] = await call("/dashboard/bookings/summary", { token: tokenA });
  assert.equal(status, 200);
  assert.equal(body.tomorrowCount, 1);
  assert.equal(body.newCount, 1);
  assert.match(body.today, /^\d{4}-\d{2}-\d{2}$/);
});

/* ---------- status changes ---------- */

test("status moves and is written to the log", async () => {
  const [status, body] = await call(`/dashboard/bookings/${refA}/status`, {
    method: "PATCH", token: tokenA, body: { status: "confirmed" },
  });
  assert.equal(status, 200);
  assert.equal(body.booking.status, "confirmed");
  assert.equal(body.changed, true);

  const [, one] = await call(`/dashboard/bookings/${refA}`, { token: tokenA });
  assert.equal(one.booking.statusLog.length, 2);
  assert.equal(one.booking.statusLog[1].status, "confirmed");
  assert.equal(one.booking.statusLog[1].by, "owner@nandu.test", "the log should record who did it");
});

test("setting the same status again is not recorded twice", async () => {
  const [, body] = await call(`/dashboard/bookings/${refA}/status`, {
    method: "PATCH", token: tokenA, body: { status: "confirmed" },
  });
  assert.equal(body.changed, false);

  const [, one] = await call(`/dashboard/bookings/${refA}`, { token: tokenA });
  assert.equal(one.booking.statusLog.length, 2, "no duplicate log entry");
});

test("an invalid status is refused", async () => {
  const [status] = await call(`/dashboard/bookings/${refA}/status`, {
    method: "PATCH", token: tokenA, body: { status: "whatever" },
  });
  assert.equal(status, 400);
});

test("report ready tries to message the patient", async () => {
  const [status, body] = await call(`/dashboard/bookings/${refA}/status`, {
    method: "PATCH", token: tokenA, body: { status: "report_ready" },
  });
  assert.equal(status, 200);
  // No WhatsApp token in tests, so the send is skipped rather than sent.
  assert.equal(body.messaged, false);
});

/* ---------- filtering ---------- */

test("filtering by status works", async () => {
  await makeBooking(labA, { status: "cancelled" });

  const [, all] = await call("/dashboard/bookings?status=all", { token: tokenA });
  assert.equal(all.bookings.length, 2);

  const [, cancelled] = await call("/dashboard/bookings?status=cancelled", { token: tokenA });
  assert.equal(cancelled.bookings.length, 1);

  const [, open] = await call("/dashboard/bookings?status=open", { token: tokenA });
  assert.ok(open.bookings.every((b) => ["new", "confirmed", "sample_collected"].includes(b.status)));
});

test("filtering by date works", async () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [, body] = await call(`/dashboard/bookings?date=${tomorrow}&status=all`, { token: tokenA });
  assert.ok(body.bookings.length >= 1);
  assert.ok(body.bookings.every((b) => b.date === tomorrow));

  const [bad] = await call("/dashboard/bookings?date=rubbish", { token: tokenA });
  assert.equal(bad, 400);
});

test("search by phone and reference works", async () => {
  const [, byPhone] = await call("/dashboard/bookings?q=9949070916&status=all", { token: tokenA });
  assert.ok(byPhone.bookings.length >= 1);

  const [, byRef] = await call(`/dashboard/bookings?q=${refA}&status=all`, { token: tokenA });
  assert.equal(byRef.bookings.length, 1);
  assert.equal(byRef.bookings[0].reference, refA);
});

test("a search with regex characters does not break or match everything", async () => {
  const [status, body] = await call("/dashboard/bookings?q=.*&status=all", { token: tokenA });
  assert.equal(status, 200);
  assert.equal(body.bookings.length, 0, "'.*' should be searched literally, not as a wildcard");
});

test("paging works", async () => {
  const [, body] = await call("/dashboard/bookings?status=all&limit=1&page=1", { token: tokenA });
  assert.equal(body.bookings.length, 1);
  assert.equal(body.pages, 2);
  assert.equal(body.total, 2);
});

/* ---------- prices ---------- */

test("a lab can change one test price", async () => {
  const [status, body] = await call("/dashboard/catalog/tests/lipid", {
    method: "PATCH", token: tokenA, body: { price: 650 },
  });
  assert.equal(status, 200);
  assert.equal(body.test.price, 650);
});

test("a price can be cleared back to none", async () => {
  const [status, body] = await call("/dashboard/catalog/tests/lipid", {
    method: "PATCH", token: tokenA, body: { price: null },
  });
  assert.equal(status, 200);
  assert.equal(body.test.price, null);
  await call("/dashboard/catalog/tests/lipid", { method: "PATCH", token: tokenA, body: { price: 600 } });
});

test("clearing a price in a bulk update also gives none, not zero", async () => {
  // The same null-becomes-zero bug lived here and in the package route, and
  // the single-test test above did not cover either of them.
  const [status, body] = await call("/dashboard/catalog/tests", {
    method: "PATCH", token: tokenA,
    body: { prices: [{ code: "cbc", price: null }] },
  });
  assert.equal(status, 200);
  assert.equal(body.updated, 1);

  const cbc = await Test.findOne({ lab: labA._id, code: "cbc" }).lean();
  assert.equal(cbc.price, null, "a cleared price must be none, not 0");

  await call("/dashboard/catalog/tests/cbc", { method: "PATCH", token: tokenA, body: { price: 300 } });
});

test("clearing a package price gives none, not zero", async () => {
  const [status, body] = await call("/dashboard/catalog/packages/basic", {
    method: "PATCH", token: tokenA, body: { price: null },
  });
  assert.equal(status, 200);
  assert.equal(body.package.price, null, "a cleared package price must be none, not 0");

  await call("/dashboard/catalog/packages/basic", { method: "PATCH", token: tokenA, body: { price: 800 } });
});

test("an empty price box is treated as none", async () => {
  const [status, body] = await call("/dashboard/catalog/tests/lipid", {
    method: "PATCH", token: tokenA, body: { price: "" },
  });
  assert.equal(status, 200);
  assert.equal(body.test.price, null);
  await call("/dashboard/catalog/tests/lipid", { method: "PATCH", token: tokenA, body: { price: 600 } });
});

test("a genuinely free test can still be priced at zero", async () => {
  const [status, body] = await call("/dashboard/catalog/tests/lipid", {
    method: "PATCH", token: tokenA, body: { price: 0 },
  });
  assert.equal(status, 200);
  assert.equal(body.test.price, 0, "zero must stay zero, not become none");
  await call("/dashboard/catalog/tests/lipid", { method: "PATCH", token: tokenA, body: { price: 600 } });
});

test("a negative price is refused", async () => {
  const [status] = await call("/dashboard/catalog/tests/lipid", {
    method: "PATCH", token: tokenA, body: { price: -50 },
  });
  assert.equal(status, 400);
});

test("a test the lab does not have gives 404", async () => {
  const [status] = await call("/dashboard/catalog/tests/no_such_test", {
    method: "PATCH", token: tokenA, body: { price: 100 },
  });
  assert.equal(status, 404);
});

test("many prices can be set at once", async () => {
  const [status, body] = await call("/dashboard/catalog/tests", {
    method: "PATCH", token: tokenA,
    body: { prices: [{ code: "cbc", price: 350 }, { code: "vit_d", price: 1200 }] },
  });
  assert.equal(status, 200);
  assert.equal(body.updated, 2);

  const vitD = await Test.findOne({ lab: labA._id, code: "vit_d" }).lean();
  assert.equal(vitD.price, 1200);

  const theirVitD = await Test.findOne({ lab: labB._id, code: "vit_d" }).lean();
  assert.equal(theirVitD.price, null, "the bulk update must not touch lab B");
});

test("switching a test off hides it from the public page", async () => {
  await call("/dashboard/catalog/tests/vit_d", { method: "PATCH", token: tokenA, body: { active: false } });

  const res = await fetch(`${base}/public/nandu`);
  const body = await res.json();
  assert.ok(!body.tests.some((t) => t.code === "vit_d"), "an inactive test should not be offered");

  await call("/dashboard/catalog/tests/vit_d", { method: "PATCH", token: tokenA, body: { active: true } });
});

test("a package price can be changed", async () => {
  const [status, body] = await call("/dashboard/catalog/packages/basic", {
    method: "PATCH", token: tokenA, body: { price: 900 },
  });
  assert.equal(status, 200);
  assert.equal(body.package.price, 900);
});

/* ---------- settings ---------- */

test("settings can be changed and reach the public page", async () => {
  const [status] = await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA,
    body: { tagline: "Open seven days a week", homeCollectionFee: 150 },
  });
  assert.equal(status, 200);

  const res = await fetch(`${base}/public/nandu`);
  const body = await res.json();
  assert.equal(body.lab.tagline, "Open seven days a week");
  assert.equal(body.lab.homeCollectionFee, 150);
});

test("a WhatsApp number is cleaned to digits", async () => {
  const [status, body] = await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA, body: { whatsapp: "+91 99490 70916" },
  });
  assert.equal(status, 200);
  assert.equal(body.lab.whatsapp, "919949070916");
});

test("notification settings merge instead of wiping each other", async () => {
  await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA, body: { notify: { reminderDayBefore: false } },
  });
  const [, body] = await call("/dashboard/catalog/settings", { token: tokenA });
  assert.equal(body.lab.notify.reminderDayBefore, false);
  assert.equal(body.lab.notify.whatsappOnBooking, true, "the other setting should survive");
});

test("slots can be replaced", async () => {
  const [status, body] = await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA,
    body: { slots: [{ label: "Morning", start: "06:00", end: "10:00", capacity: 30 }] },
  });
  assert.equal(status, 200);
  assert.equal(body.lab.slots.length, 1);
  assert.equal(body.lab.slots[0].capacity, 30);
});

test("two slots with the same name are refused", async () => {
  const [status, body] = await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA,
    body: {
      slots: [
        { label: "Morning", start: "06:00", end: "10:00", capacity: 10 },
        { label: "morning", start: "10:00", end: "14:00", capacity: 10 },
      ],
    },
  });
  assert.equal(status, 400);
  assert.match(body.error, /same name/i);
});

test("a bad slot time is refused", async () => {
  const [status] = await call("/dashboard/catalog/settings", {
    method: "PATCH", token: tokenA,
    body: { slots: [{ label: "Morning", start: "6am", end: "10:00", capacity: 10 }] },
  });
  assert.equal(status, 400);
});

/* ---------- lab notes ---------- */

test("the lab can write its own notes on a booking", async () => {
  const [status, body] = await call(`/dashboard/bookings/${refA}/notes`, {
    method: "PATCH", token: tokenA, body: { labNotes: "Patient called, coming at 9." },
  });
  assert.equal(status, 200);
  assert.equal(body.booking.labNotes, "Patient called, coming at 9.");
});

test("lab notes are never shown to the patient", async () => {
  const res = await fetch(`${base}/public/nandu/bookings/${refA}?phone=0916`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(!("labNotes" in body), "the patient must not see the lab's private notes");
});
