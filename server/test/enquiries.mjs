import test from "node:test";
import assert from "node:assert/strict";
process.env.JWT_SECRET = "callback-test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/unused_callback_tests";
const { createApp } = await import("../src/index.js");
const { signToken } = await import("../src/lib/jwt.js");
const { Enquiry } = await import("../src/models/Enquiry.js");
const { Lab } = await import("../src/models/Lab.js");
const { User } = await import("../src/models/User.js");
const { RateBucket } = await import("../src/models/RateBucket.js");
const LAB_A = "aaaaaaaaaaaaaaaaaaaaaaaa", LAB_B = "bbbbbbbbbbbbbbbbbbbbbbbb", ID = "cccccccccccccccccccccccc";
const token = signToken({ _id: "111111111111111111111111", lab: LAB_A, role: "owner" });
let server, base, saved, seen, active = true, found = true, bucketCount = 1, returnEnquiry = true;
const row = { _id: ID, reference: "CB-TESTREFERENCE", name: "Sample Person", phone: "919999999999", status: "new", createdAt: new Date() };
function query(result) { const q = { select: () => q, sort: () => q, skip: () => q, limit: () => q, lean: async () => result, then: (a,b) => Promise.resolve(result).then(a,b) }; return q; }
test.before(async () => {
  Lab.findOne = async (filter) => found ? { _id: LAB_A, country: "IN", isDemo: false } : null;
  Lab.findById = () => query({ _id: LAB_A, active });
  User.findById = () => query({ _id: "111111111111111111111111", lab: LAB_A, active: true, sessionVersion: 0 });
  RateBucket.findOneAndUpdate = async () => ({ count: bucketCount });
  Enquiry.create = async (data) => { saved = data; return row; };
  Enquiry.find = (filter) => { seen.push(filter); return query([row]); };
  Enquiry.countDocuments = async (filter) => { seen.push(filter); return 1; };
  Enquiry.findOneAndUpdate = (filter, changes) => { seen.push(filter); return query(returnEnquiry ? { ...row, ...changes.$set } : null); };
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.beforeEach(() => { saved = null; seen = []; active = true; found = true; bucketCount = 1; returnEnquiry = true; });
test.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
async function hit(path, { method = "GET", body, auth = false } = {}) {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
const valid = { name: "Sample Person", phone: "9999999999", message: "Please help with booking" };
test("public callback saves a normalized phone for the URL's lab and returns only a reference", async () => {
  const result = await hit("/public/sample/enquiries", { method: "POST", body: { ...valid, lab: LAB_B, status: "closed" } });
  assert.equal(result.status, 201); assert.equal(String(saved.lab), LAB_A); assert.equal(saved.phone, "919999999999"); assert.equal(saved.status, undefined);
  assert.deepEqual(Object.keys(result.data).sort(), ["isDemo", "reference"]);
});
test("invalid names and phones never create callback records", async () => {
  for (const body of [{ ...valid, name: "" }, { ...valid, phone: "123456" }, { ...valid, message: "x".repeat(301) }]) {
    assert.equal((await hit("/public/sample/enquiries", { method: "POST", body })).status, 400); assert.equal(saved, null);
  }
});
test("unknown or inactive public lab is not available for callbacks", async () => {
  found = false; assert.equal((await hit("/public/unknown/enquiries", { method: "POST", body: valid })).status, 404); assert.equal(saved, null);
});
test("callback rate limit blocks excessive submissions", async () => {
  bucketCount = 6; assert.equal((await hit("/public/sample/enquiries", { method: "POST", body: valid })).status, 429); assert.equal(saved, null);
});
test("dashboard callback list ignores another lab supplied by the browser", async () => {
  assert.equal((await hit(`/dashboard/enquiries?status=all&lab=${LAB_B}`, { auth: true })).status, 200);
  assert.equal(seen.length, 2); for (const filter of seen) assert.equal(filter.lab, LAB_A);
});
test("dashboard callback update always filters by both id and signed-in lab", async () => {
  const result = await hit(`/dashboard/enquiries/${ID}`, { method: "PATCH", auth: true, body: { status: "contacted", lab: LAB_B } });
  assert.equal(result.status, 200); assert.deepEqual(seen[0], { _id: ID, lab: LAB_A }); assert.equal(result.data.enquiry.status, "contacted");
});
test("another lab's callback cannot be updated", async () => {
  returnEnquiry = false;
  assert.equal((await hit(`/dashboard/enquiries/${ID}`, { method: "PATCH", auth: true, body: { status: "closed" } })).status, 404);
});
test("unauthenticated callback lists and updates are refused", async () => {
  assert.equal((await hit("/dashboard/enquiries")).status, 401);
  assert.equal((await hit(`/dashboard/enquiries/${ID}`, { method: "PATCH", body: { status: "closed" } })).status, 401);
  assert.equal(seen.length, 0);
});
test("inactive owner lab cannot access callback data", async () => {
  active = false; assert.equal((await hit("/dashboard/enquiries", { auth: true })).status, 403); assert.equal(seen.length, 0);
});
test("invalid filters, ids and statuses are rejected", async () => {
  assert.equal((await hit("/dashboard/enquiries?status=wrong", { auth: true })).status, 400);
  assert.equal((await hit("/dashboard/enquiries?page=0", { auth: true })).status, 400);
  assert.equal((await hit("/dashboard/enquiries/not-an-id", { method: "PATCH", auth: true, body: { status: "closed" } })).status, 400);
  assert.equal((await hit(`/dashboard/enquiries/${ID}`, { method: "PATCH", auth: true, body: { status: "unknown" } })).status, 400);
});
