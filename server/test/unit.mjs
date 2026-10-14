/**
 * Tests that need no database.
 *
 *   node --test test/
 *
 * These cover the parts most likely to break quietly: phone numbers from
 * different countries, dates across time zones, and the test catalog.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { normalisePhone, looksLikeMobile, callingCode, maskPhone } from "../src/lib/phone.js";
import { todayInZone, dateInZone, addDays, isValidDateStr, prettyDate } from "../src/lib/dates.js";
import { makeReference } from "../src/lib/reference.js";
import { CATALOG, PACKAGE_TEMPLATES, CATEGORY_ORDER } from "../src/seed/catalog.js";

test("phone — Indian numbers", () => {
  assert.equal(normalisePhone("9949070916", "IN"), "919949070916");
  assert.equal(normalisePhone("09949070916", "IN"), "919949070916");
  assert.equal(normalisePhone("99490-70916", "IN"), "919949070916");
  assert.equal(normalisePhone("99490 70916", "IN"), "919949070916");
  assert.equal(normalisePhone("+91 99490 70916", "IN"), "919949070916");
  assert.equal(normalisePhone("919949070916", "IN"), "919949070916");
});

test("phone — rejects nonsense", () => {
  assert.equal(normalisePhone("", "IN"), null);
  assert.equal(normalisePhone("abc", "IN"), null);
  assert.equal(normalisePhone("12345", "IN"), null);
  assert.equal(normalisePhone(null, "IN"), null);
});

test("phone — Indian mobile rule", () => {
  assert.ok(looksLikeMobile("919949070916", "IN"));
  assert.ok(looksLikeMobile("916000000000", "IN"));
  // Landlines and old series are not mobiles.
  assert.ok(!looksLikeMobile("914023456789", "IN"));
  assert.ok(!looksLikeMobile("915949070916", "IN"));
  assert.ok(!looksLikeMobile("91994907091", "IN"));   // one digit short
  assert.ok(!looksLikeMobile("9199490709166", "IN")); // one too many
});

test("phone — other countries pass through", () => {
  assert.equal(normalisePhone("+971 50 123 4567", "AE"), "971501234567");
  assert.equal(normalisePhone("501234567", "AE"), "971501234567");
  assert.equal(normalisePhone("4155551234", "US"), "14155551234");
  assert.equal(normalisePhone("+44 7700 900123", "GB"), "447700900123");
  assert.ok(looksLikeMobile("14155551234", "US"));
  assert.ok(looksLikeMobile("971501234567", "AE"));
  assert.equal(callingCode("AE"), "971");
  assert.equal(callingCode("IN"), "91");
});

test("phone — unknown country does not crash", () => {
  const out = normalisePhone("12345678901", "ZZ");
  assert.equal(typeof out, "string");
  assert.equal(callingCode("ZZ"), "");
});

test("phone — masking hides the middle", () => {
  assert.equal(maskPhone("919949070916"), "919******916");
  assert.equal(maskPhone("123"), "");
});

test("dates — today is a valid date string", () => {
  assert.match(todayInZone("Asia/Kolkata"), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(todayInZone("America/New_York"), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(todayInZone("Not/AZone"), /^\d{4}-\d{2}-\d{2}$/); // falls back, no throw
});

test("dates — the time zone actually matters", () => {
  // 20:00 UTC on the 14th is already the 15th in India, still the 14th in New York.
  const instant = new Date("2026-10-14T20:00:00Z");
  assert.equal(dateInZone(instant, "Asia/Kolkata"), "2026-10-15");
  assert.equal(dateInZone(instant, "America/New_York"), "2026-10-14");
});

test("dates — adding days rolls over correctly", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // leap year
  assert.equal(addDays("2026-02-28", 1), "2026-03-01"); // not a leap year
  assert.equal(addDays("2026-10-15", 30), "2026-11-14");
});

test("dates — validation", () => {
  assert.ok(isValidDateStr("2026-10-15"));
  assert.ok(!isValidDateStr("2026-02-30"));
  assert.ok(!isValidDateStr("2026-13-01"));
  assert.ok(!isValidDateStr("2026-00-10"));
  assert.ok(!isValidDateStr("15-10-2026"));
  assert.ok(!isValidDateStr(""));
  assert.ok(!isValidDateStr(null));
});

test("dates — pretty printing per locale", () => {
  assert.match(prettyDate("2026-10-15", "en-IN", "Asia/Kolkata"), /15/);
  assert.match(prettyDate("2026-10-15", "en-IN", "Asia/Kolkata"), /Oct/);
  assert.equal(prettyDate("garbage"), "garbage");
});

test("reference — shape and uniqueness", () => {
  const r = makeReference("nandu");
  assert.match(r, /^NAN-[2-9A-HJ-NP-Z]{5}$/);
  assert.match(makeReference("x"), /^X-/);
  assert.match(makeReference(""), /^LAB-/);

  const seen = new Set();
  for (let i = 0; i < 5000; i++) seen.add(makeReference("nandu"));
  // 31^5 is about 28.6 million, so 5000 draws should almost never collide.
  assert.ok(seen.size > 4990, `too many collisions: ${5000 - seen.size}`);
});

test("reference — no letters that get misheard", () => {
  const joined = Array.from({ length: 400 }, () => makeReference("nandu").split("-")[1]).join("");
  for (const bad of ["0", "O", "1", "I", "L"]) {
    assert.ok(!joined.includes(bad), `reference contains ${bad}, which is easy to mishear`);
  }
});

test("catalog — no duplicate test codes", () => {
  const codes = CATALOG.map((t) => t.code);
  assert.equal(new Set(codes).size, codes.length);
});

test("catalog — every entry is complete", () => {
  for (const t of CATALOG) {
    assert.ok(t.code && /^[a-z0-9_]+$/.test(t.code), `bad code: ${t.code}`);
    assert.ok(t.name && t.name.length > 2, `bad name: ${t.code}`);
    assert.ok(t.category, `no category: ${t.code}`);
    assert.ok(
      ["Blood", "Urine", "Stool", "Swab", "Sputum", "Scan", "Other"].includes(t.sample),
      `bad sample type on ${t.code}: ${t.sample}`
    );
  }
});

test("catalog — package test codes all exist", () => {
  const codes = new Set(CATALOG.map((t) => t.code));
  for (const p of PACKAGE_TEMPLATES) {
    assert.ok(p.testCodes.length > 0, `empty package: ${p.code}`);
    for (const c of p.testCodes) {
      assert.ok(codes.has(c), `package ${p.code} points at missing test ${c}`);
    }
  }
});

test("catalog — no duplicate package codes", () => {
  const codes = PACKAGE_TEMPLATES.map((p) => p.code);
  assert.equal(new Set(codes).size, codes.length);
});

test("catalog — every category is in the display order", () => {
  for (const t of CATALOG) {
    assert.ok(CATEGORY_ORDER.includes(t.category), `category missing from order list: ${t.category}`);
  }
});

test("catalog — scans and ECG are not offered for home collection", () => {
  for (const code of ["xray_chest", "usg_abdomen", "ecg", "echo", "tmt"]) {
    const t = CATALOG.find((x) => x.code === code);
    assert.ok(t, `missing ${code}`);
    assert.equal(t.homeCollectable, false, `${code} should not be home collectable`);
  }
});

test("catalog — no prices are shipped", () => {
  for (const t of CATALOG) {
    assert.ok(!("price" in t), `${t.code} ships a price; labs must set their own`);
  }
});
