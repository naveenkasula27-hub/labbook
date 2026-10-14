/**
 * Lab isolation, checked without a database.
 *
 *   npm test
 *
 * The one property that must never break in a multi-tenant app: every query a
 * dashboard route builds has to be filtered to the logged-in lab. If a filter
 * ever goes out without `lab`, one lab can read or change another's data.
 *
 * Instead of needing MongoDB, this replaces the Mongoose model methods with
 * stubs that record the filter they were handed, then asserts the lab id is in
 * every one. It tests the real route code and the real middleware.
 *
 * test/dashboard.mjs covers the same ground against a real database; this file
 * exists so the check still runs anywhere, with no setup.
 */
import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "isolation-test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/unused";

const { createApp } = await import("../src/index.js");
const { signToken } = await import("../src/lib/jwt.js");
const { Booking } = await import("../src/models/Booking.js");
const { Test: TestModel } = await import("../src/models/Test.js");
const { Package } = await import("../src/models/Package.js");
const { Lab } = await import("../src/models/Lab.js");
const { User } = await import("../src/models/User.js");

const LAB_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const LAB_B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const USER_A = "111111111111111111111111";

const token = signToken({ _id: USER_A, lab: LAB_A, role: "owner" });

/** Every filter object handed to a model method during one request. */
let seen = [];

/** A stand-in for a Mongoose query: chainable, and awaitable. */
function fakeQuery(result) {
  const q = {
    select: () => q,
    sort: () => q,
    skip: () => q,
    limit: () => q,
    lean: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

function record(name, filter, result) {
  seen.push({ name, filter });
  return fakeQuery(result);
}

const LAB_DOC = {
  _id: LAB_A,
  name: "Nandu Diagnostics",
  slug: "nandu",
  currency: "INR",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  active: true,
  slots: [{ label: "Morning", start: "07:00", end: "11:00", capacity: 20 }],
  openDays: [0, 1, 2, 3, 4, 5, 6],
  notify: { whatsappOnBooking: true },
  phone: "99490 70916",
};

const BOOKING_DOC = {
  _id: "222222222222222222222222",
  lab: LAB_A,
  reference: "NAN-AAAAA",
  patient: { name: "Ramesh", age: 50, gender: "Male", phone: "919949070916" },
  items: [],
  statusLog: [],
  status: "new",
  messages: {},
  save: async () => {},
  toObject() {
    return { ...this };
  },
};

let server, base;

test.before(async () => {
  // Auth middleware looks the user up; hand it one without a database.
  User.findById = (id) => {
    seen.push({ name: "User.findById", filter: { _id: id } });
    return fakeQuery({ _id: USER_A, lab: LAB_A, role: "owner", active: true, email: "owner@nandu.test", name: "Owner" });
  };

  Lab.findById = (id) => record("Lab.findById", { _id: id }, LAB_DOC);
  Lab.findByIdAndUpdate = (id, update) => record("Lab.findByIdAndUpdate", { _id: id, update }, LAB_DOC);

  Booking.find = (filter) => record("Booking.find", filter, []);
  Booking.findOne = (filter) => record("Booking.findOne", filter, BOOKING_DOC);
  Booking.countDocuments = (filter) => record("Booking.countDocuments", filter, 0);
  Booking.aggregate = (pipeline) => {
    seen.push({ name: "Booking.aggregate", filter: pipeline[0]?.$match || {} });
    return Promise.resolve([]);
  };
  Booking.findOneAndUpdate = (filter) => record("Booking.findOneAndUpdate", filter, BOOKING_DOC);
  Booking.updateOne = (filter) => record("Booking.updateOne", filter, { modifiedCount: 1 });

  TestModel.find = (filter) => record("Test.find", filter, []);
  TestModel.findOneAndUpdate = (filter) => record("Test.findOneAndUpdate", filter, { code: "cbc", price: 300 });
  TestModel.bulkWrite = (ops) => {
    for (const op of ops) seen.push({ name: "Test.bulkWrite", filter: op.updateOne.filter });
    return Promise.resolve({ modifiedCount: ops.length, matchedCount: ops.length });
  };

  Package.find = (filter) => record("Package.find", filter, []);
  Package.findOneAndUpdate = (filter) => record("Package.findOneAndUpdate", filter, { code: "basic", price: 800 });

  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
});

async function hit(path, { method = "GET", body, withToken = true } = {}) {
  seen = [];
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(withToken ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  await res.json().catch(() => ({}));
  return { status: res.status, queries: seen.filter((s) => s.name !== "User.findById") };
}

/** Does this filter pin the query to lab A? */
function scopedToLabA(filter) {
  if (!filter || typeof filter !== "object") return false;
  if (String(filter.lab) === LAB_A) return true;
  // Lab.findById / findByIdAndUpdate identify the lab by its own _id.
  if (String(filter._id) === LAB_A) return true;
  return false;
}

/* ---------- every dashboard route scopes every query ---------- */

const ROUTES = [
  ["GET", "/dashboard/bookings?status=all"],
  ["GET", "/dashboard/bookings/summary"],
  ["GET", "/dashboard/bookings/NAN-AAAAA"],
  ["PATCH", "/dashboard/bookings/NAN-AAAAA/status", { status: "confirmed" }],
  ["PATCH", "/dashboard/bookings/NAN-AAAAA/notes", { labNotes: "called the patient" }],
  ["GET", "/dashboard/catalog/tests"],
  ["PATCH", "/dashboard/catalog/tests/cbc", { price: 350 }],
  ["PATCH", "/dashboard/catalog/tests", { prices: [{ code: "cbc", price: 350 }] }],
  ["GET", "/dashboard/catalog/packages"],
  ["PATCH", "/dashboard/catalog/packages/basic", { price: 900 }],
  ["GET", "/dashboard/catalog/settings"],
  ["PATCH", "/dashboard/catalog/settings", { tagline: "Open daily" }],
];

for (const [method, path, body] of ROUTES) {
  test(`every query is scoped to the lab: ${method} ${path.split("?")[0]}`, async () => {
    const { status, queries } = await hit(path, { method, body });

    assert.ok(status < 400, `${method} ${path} returned ${status}`);
    assert.ok(queries.length > 0, "the route ran no queries, so this test proves nothing");

    for (const q of queries) {
      assert.ok(
        scopedToLabA(q.filter),
        `${q.name} ran without a lab filter on ${method} ${path}: ${JSON.stringify(q.filter)}`
      );
      assert.notEqual(String(q.filter.lab ?? ""), LAB_B, "a query must never reach another lab");
    }
  });
}

/* ---------- the lab cannot be chosen by the caller ---------- */

test("a lab id in the request body is ignored", async () => {
  const { queries } = await hit("/dashboard/bookings?status=all", {
    method: "GET",
  });
  assert.ok(queries.every((q) => scopedToLabA(q.filter)));

  // And via the body on a write.
  const { queries: writeQueries } = await hit("/dashboard/catalog/tests/cbc", {
    method: "PATCH",
    body: { price: 1, lab: LAB_B },
  });
  for (const q of writeQueries) {
    assert.ok(scopedToLabA(q.filter), `body-supplied lab leaked into ${q.name}`);
  }
});

test("a lab id in the query string is ignored", async () => {
  const { queries } = await hit(`/dashboard/bookings?status=all&lab=${LAB_B}`);
  for (const q of queries) {
    assert.ok(scopedToLabA(q.filter), `query-string lab leaked into ${q.name}`);
  }
});

test("the lab comes from the token, not anywhere else", async () => {
  // A token for lab B must produce queries scoped to lab B, proving the value
  // is read from the token and nowhere else.
  const tokenB = signToken({ _id: USER_A, lab: LAB_B, role: "owner" });

  const original = User.findById;
  User.findById = () =>
    fakeQuery({ _id: USER_A, lab: LAB_B, role: "owner", active: true, email: "b@rival.test", name: "B" });

  seen = [];
  const res = await fetch(`${base}/dashboard/bookings?status=all`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  await res.json().catch(() => ({}));
  const queries = seen.filter((s) => s.name !== "User.findById");

  assert.ok(queries.length > 0);
  for (const q of queries) {
    assert.equal(String(q.filter.lab), LAB_B, "a lab B token must query lab B");
  }

  User.findById = original;
});

/* ---------- no token, no queries ---------- */

for (const [method, path, body] of ROUTES) {
  test(`without a token nothing is queried: ${method} ${path.split("?")[0]}`, async () => {
    const { status, queries } = await hit(path, { method, body, withToken: false });
    assert.equal(status, 401);
    assert.equal(queries.length, 0, "an unauthenticated request must not touch the database");
  });
}

test("a user with no lab is refused", async () => {
  const original = User.findById;
  User.findById = () =>
    fakeQuery({ _id: USER_A, lab: null, role: "admin", active: true, email: "admin@labbook.test", name: "Admin" });

  const tokenNoLab = signToken({ _id: USER_A, lab: null, role: "admin" });
  seen = [];
  const res = await fetch(`${base}/dashboard/bookings?status=all`, {
    headers: { Authorization: `Bearer ${tokenNoLab}` },
  });
  assert.equal(res.status, 403);
  const queries = seen.filter((s) => s.name !== "User.findById");
  assert.equal(queries.length, 0);

  User.findById = original;
});

test("a deactivated user is refused even with a valid token", async () => {
  const original = User.findById;
  User.findById = () =>
    fakeQuery({ _id: USER_A, lab: LAB_A, role: "owner", active: false, email: "x@y.test", name: "X" });

  seen = [];
  const res = await fetch(`${base}/dashboard/bookings?status=all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 401);
  const queries = seen.filter((s) => s.name !== "User.findById");
  assert.equal(queries.length, 0);

  User.findById = original;
});
