import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { testDbUri } from "./_dburi.mjs";
process.env.MONGODB_URI = testDbUri("improvements");
process.env.JWT_SECRET = "test-improvements-secret";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.BOOKING_RATE_LIMIT = "1000";
const { createApp } = await import("../src/index.js");
const { connectDb, disconnectDb } = await import("../src/db.js");
const { Lab } = await import("../src/models/Lab.js");
const { User } = await import("../src/models/User.js");
const { Test } = await import("../src/models/Test.js");
const { Package } = await import("../src/models/Package.js");
const { Booking } = await import("../src/models/Booking.js");
const { RateBucket } = await import("../src/models/RateBucket.js");
const { Report } = await import("../src/models/Report.js");
const { signToken } = await import("../src/lib/jwt.js");
const { sharedLimit } = await import("../src/middleware/rate-limit.js");
let server, base, lab, other, owner, token, rival, admin;
async function hit(path, { method = "GET", body, auth = token, raw = false } = {}) {
  const res = await fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), "Content-Type": raw ? "application/pdf" : "application/json" }, ...(body !== undefined ? { body: raw ? body : JSON.stringify(body) } : {}) });
  return { status: res.status, data: res.headers.get("content-type")?.includes("application/pdf") ? await res.text() : await res.json(), headers: res.headers };
}
test.before(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
  await Promise.all([Lab.init(), User.init(), Booking.init(), RateBucket.init(), Report.init(), Test.init(), Package.init()]);
  lab = await Lab.create({ name: "Alpha Lab", slug: "alpha", phone: "9949070916" });
  other = await Lab.create({ name: "Other Lab", slug: "other", phone: "9949070916" });
  owner = await User.create({ lab: lab._id, name: "Owner", email: "alpha@test.test", passwordHash: await User.hashPassword("original-password") });
  token = signToken(owner);
  rival = signToken(await User.create({ lab: other._id, name: "Rival", email: "other@test.test", passwordHash: owner.passwordHash }));
  admin = signToken(await User.create({ role: "admin", name: "Admin", email: "admin@test.test", passwordHash: owner.passwordHash }));
  await Test.create({ lab: lab._id, code: "scan", name: "Scan", category: "Scans", sample: "Scan", homeCollectable: false });
  await Package.create({ lab: lab._id, code: "scanpack", name: "Scan package", testCodes: ["scan"] });
  await Booking.create({ lab: lab._id, reference: "ALP-TEST1", patient: { name: "Patient", age: 30, gender: "Male", phone: "919949070916" }, status: "new" });
  server = createApp().listen(0); await new Promise(r => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => { if (server) await new Promise(r => server.close(r)); await disconnectDb(); });
test("booking lookup requires four digits, rejects short and incorrect suffixes", async () => {
  for (const ph of ["6", "16", "916", "9999"]) assert.equal((await hit(`/public/alpha/bookings/ALP-TEST1?phone=${ph}`, { auth: null })).status, 403);
  assert.equal((await hit("/public/alpha/bookings/ALP-TEST1?phone=0916", { auth: null })).status, 200);
});
test("dashboard aggregate counts ObjectId lab bookings", async () => {
  const r = await hit("/dashboard/bookings/summary"); assert.equal(r.status, 200); assert.equal(r.data.byStatus.new, 1);
});
test("package containing lab-only scan cannot be booked for home collection", async () => {
  const r = await hit("/public/alpha/bookings", { auth: null, method: "POST", body: { name: "Patient", age: 30, gender: "Male", phone: "9949070916", visitType: "home", address: "Main road", packageCodes: ["scanpack"], consent: true } });
  assert.equal(r.status, 400); assert.match(r.data.error, /at the lab/);
});
test("server rejects impossible and reversed slot times", async () => {
  for (const [start, end] of [["25:00", "26:00"], ["12:99", "13:00"], ["12:00", "11:00"], ["12:00", "12:00"]]) {
    assert.equal((await hit("/dashboard/catalog/settings", { method: "PATCH", body: { slots: [{ label: "Bad", start, end, capacity: 2 }] } })).status, 400);
  }
});
test("async database rejection becomes JSON 500, next request works", async () => {
  const original = Test.find;
  Test.find = () => ({ select() { return this; }, sort() { return this; }, lean() { return Promise.reject(new Error("intentional regression test database failure")); } });
  try { assert.equal((await hit("/dashboard/catalog/tests")).status, 500); } finally { Test.find = original; }
  assert.equal((await hit("/dashboard/catalog/tests")).status, 200);
});
test("two independently created limiters share atomic database counters", async () => {
  const first = sharedLimit("regression", 3, 60000, "limited"), second = sharedLimit("regression", 3, 60000, "limited");
  const run = fn => new Promise((resolve, reject) => {
    const res = { set() {}, status(n) { this.code = n; return this; }, json() { resolve(this.code); } };
    Promise.resolve(fn({ ip: "regression-device" }, res, () => resolve(200))).catch(reject);
  });
  const codes = await Promise.all(Array.from({ length: 8 }, (_, i) => run(i % 2 ? first : second)));
  assert.equal(codes.filter(n => n === 200).length, 3); assert.equal(codes.filter(n => n === 429).length, 5);
});
test("private reports: upload, tenant boundary, validation, release, download, deletion", async () => {
  const path = "/reports/dashboard/ALP-TEST1", pdf = "%PDF-1.4\n% regression PDF\n%%EOF";
  assert.equal((await hit(path, { method: "PUT", body: pdf, raw: true, auth: rival })).status, 404);
  assert.equal((await hit(path, { method: "PUT", body: "invalid", raw: true })).status, 400);
  assert.equal((await hit(path, { method: "PUT", body: Buffer.alloc(2 * 1024 * 1024 + 1), raw: true })).status, 413);
  assert.equal((await hit(path, { method: "PUT", body: pdf, raw: true })).status, 200);
  assert.equal((await hit(path, { auth: rival })).status, 404);
  const publicPath = "/reports/public/alpha/ALP-TEST1";
  assert.equal((await hit(publicPath, { auth: null, method: "POST", body: { phone: "9949070916" } })).status, 404);
  await Booking.updateOne({ lab: lab._id, reference: "ALP-TEST1" }, { $set: { status: "report_ready" } });
  assert.equal((await hit(publicPath, { auth: null, method: "POST", body: { phone: "0916" } })).status, 404);
  const r = await hit(publicPath, { auth: null, method: "POST", body: { phone: "9949070916" } });
  assert.equal(r.status, 200); assert.equal(r.data, pdf); assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal((await hit(path, { method: "DELETE", auth: rival })).status, 200);
  assert.equal((await hit(path)).status, 200);
  assert.equal((await hit(path, { method: "DELETE" })).status, 200);
  assert.equal((await hit(path)).status, 404);
});
test("admin onboarding, duplicate rollback, owner access denied, password reset revokes tokens", async () => {
  const body = { name: "New Lab", slug: "new-lab", phone: "9949070916", ownerName: "New Owner", email: "new@test.test", password: "new-lab-password" };
  assert.equal((await hit("/admin/labs", { method: "POST", body })).status, 403);
  assert.equal((await hit("/admin/labs", { auth: admin, method: "POST", body })).status, 201);
  const fresh = await Lab.findOne({ slug: body.slug });
  assert.ok(await Test.countDocuments({ lab: fresh._id }) > 100);
  assert.ok(await Package.countDocuments({ lab: fresh._id }) > 0);
  assert.equal((await hit("/admin/labs", { auth: admin, method: "POST", body: { ...body, slug: "rollback-lab" } })).status, 409);
  assert.equal(await Lab.countDocuments({ slug: "rollback-lab" }), 0);
  assert.equal((await hit("/admin/reset-password", { auth: admin, method: "POST", body: { email: owner.email, password: "admin-reset-password" } })).status, 200);
  assert.equal((await hit("/auth/me")).status, 401);
  token = signToken(await User.findById(owner._id));
});
test("self-service password change requires old password and revokes older sessions", async () => {
  assert.equal((await hit("/auth/password", { method: "POST", body: { currentPassword: "wrong", newPassword: "self-new-password" } })).status, 400);
  assert.equal((await hit("/auth/password", { method: "POST", body: { currentPassword: "admin-reset-password", newPassword: "x".repeat(73) } })).status, 400);
  const r = await hit("/auth/password", { method: "POST", body: { currentPassword: "admin-reset-password", newPassword: "self-new-password" } });
  assert.equal(r.status, 200); assert.equal((await hit("/auth/me")).status, 401);
  token = r.data.token; assert.equal((await hit("/auth/me")).status, 200);
  assert.ok(await (await User.findById(owner._id)).checkPassword("self-new-password"));
});

test("deactivated labs cannot use existing dashboard or report sessions", async () => {
  await Lab.updateOne({ _id: lab._id }, { $set: { active: false } });
  assert.equal((await hit("/dashboard/bookings")).status, 403);
  assert.equal((await hit("/reports/dashboard/ALP-TEST1")).status, 403);
  await Lab.updateOne({ _id: lab._id }, { $set: { active: true } });
});
