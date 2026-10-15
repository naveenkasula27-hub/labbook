/**
 * Picking a place in a slot. No database needed.
 *
 *   npm test
 *
 * The number handed out has to be the lowest free one, not the count of
 * bookings, because cancelling the second of three frees number 1 while the
 * count says 2.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { firstFreeSeat } from "../src/lib/seats.js";

test("an empty slot starts at zero", () => {
  assert.equal(firstFreeSeat([], 5), 0);
});

test("places are handed out in order", () => {
  assert.equal(firstFreeSeat([0], 5), 1);
  assert.equal(firstFreeSeat([0, 1], 5), 2);
  assert.equal(firstFreeSeat([0, 1, 2, 3], 5), 4);
});

test("a full slot gives nothing", () => {
  assert.equal(firstFreeSeat([0, 1, 2, 3, 4], 5), -1);
});

test("a cancelled place in the middle is reused", () => {
  // Three bookings, the one holding place 1 cancelled. The count is 2, but
  // handing out place 2 would leave a hole and eventually overfill the slot.
  assert.equal(firstFreeSeat([0, 2], 5), 1);
});

test("the first place is reused once freed", () => {
  assert.equal(firstFreeSeat([1, 2], 5), 0);
});

test("a capacity of one allows exactly one", () => {
  assert.equal(firstFreeSeat([], 1), 0);
  assert.equal(firstFreeSeat([0], 1), -1);
});

test("a capacity of zero allows nothing", () => {
  assert.equal(firstFreeSeat([], 0), -1);
});

test("numbers past capacity do not open up room", () => {
  // Can happen after a lab lowers a slot's capacity, or after the backfill
  // grandfathers old bookings in. The slot reads as full until some leave.
  assert.equal(firstFreeSeat([0, 1, 2], 2), -1);
});

test("duplicate numbers in the input are not double counted", () => {
  assert.equal(firstFreeSeat([0, 0, 1], 5), 2);
});
