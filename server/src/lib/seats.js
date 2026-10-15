/**
 * Who gets the last place in a slot.
 *
 * The problem this solves: counting the bookings in a slot and then writing a
 * new one leaves a gap. Two requests arriving together both count four of five
 * taken, both decide there is room, and both write. The slot now holds six.
 *
 * The fix is to make the database arbitrate. Each booking claims a numbered
 * place in its slot, and a unique index on (lab, date, slot, seat) means the
 * second claim on the same number is refused outright. A refusal is not an
 * error to show the patient: it means somebody else got that number a moment
 * earlier, so we look again and take the next free one. If none is free, the
 * slot really is full.
 */
import { Booking } from "../models/Booking.js";

const DUPLICATE_KEY = 11000;

/** Statuses that mean the patient is not coming, so the place goes back. */
export const FREES_THE_SLOT = ["cancelled", "no_show"];

/**
 * The lowest place number not already taken, or -1 if the slot is full.
 *
 * Numbers are reused: cancelling the third of five bookings frees number 2,
 * and the next booking takes it rather than number 5, which does not exist.
 *
 * @param {number[]} takenSeats place numbers currently held
 * @param {number} capacity how many the lab allows in this slot
 */
export function firstFreeSeat(takenSeats, capacity) {
  const taken = new Set(takenSeats);
  for (let i = 0; i < capacity; i++) {
    if (!taken.has(i)) return i;
  }
  return -1;
}

/** Place numbers currently held for one lab, date and slot. */
async function takenSeats(lab, date, slot) {
  const rows = await Booking.find({ lab, date, slot, holdsSlot: true }).select("seat").lean();
  return rows.map((r) => r.seat).filter((s) => typeof s === "number");
}

/**
 * A duplicate-key error can come from the place index or from the booking
 * reference, which is also unique. Only the first is worth retrying: a
 * repeated reference means something else is wrong and should be raised.
 */
function isSeatClash(err) {
  return Boolean(err?.keyPattern && Object.prototype.hasOwnProperty.call(err.keyPattern, "seat"));
}

/**
 * Create a booking, claiming a place in its slot if it has one.
 *
 * @param {object} fields everything the booking needs, including lab, date, slot
 * @param {number} capacity places the lab allows in that slot
 * @returns {Promise<{booking?: object, full?: boolean}>} `full` when there is no room
 */
export async function createBookingHoldingSlot(fields, capacity) {
  const { lab, date, slot } = fields;

  // No date or no slot means no place to hold. Walk-in enquiries and bookings
  // the lab will schedule later go straight in. Same for anything created
  // already cancelled, which happens when old records are imported.
  if (!date || !slot || FREES_THE_SLOT.includes(fields.status)) {
    const booking = await Booking.create({ ...fields, seat: null, holdsSlot: false });
    return { booking };
  }

  // At most one attempt per place, so a slot of five never tries more than
  // six times however many requests arrive together.
  for (let attempt = 0; attempt <= capacity; attempt++) {
    const seat = firstFreeSeat(await takenSeats(lab, date, slot), capacity);
    if (seat === -1) return { full: true };

    try {
      const booking = await Booking.create({ ...fields, seat, holdsSlot: true });
      return { booking };
    } catch (err) {
      if (err?.code === DUPLICATE_KEY && isSeatClash(err)) continue; // somebody beat us to it
      throw err;
    }
  }

  return { full: true };
}

/**
 * Give up the place this booking holds.
 *
 * Called when a booking is cancelled or marked no-show. The place number is
 * kept on the record as history; `holdsSlot` is what the index looks at.
 */
export async function releaseSlot(booking) {
  if (!booking.holdsSlot) return false;
  booking.holdsSlot = false;
  await booking.save();
  return true;
}

/**
 * Take a place back, for a booking being moved out of cancelled.
 *
 * Can fail: the slot may have filled up while the booking sat cancelled.
 *
 * @returns {Promise<{ok: true} | {ok: false, reason: "full"}>}
 */
export async function reclaimSlot(booking, capacity) {
  if (booking.holdsSlot) return { ok: true };
  if (!booking.date || !booking.slot) {
    booking.holdsSlot = false;
    booking.seat = null;
    return { ok: true };
  }

  for (let attempt = 0; attempt <= capacity; attempt++) {
    const seat = firstFreeSeat(await takenSeats(booking.lab, booking.date, booking.slot), capacity);
    if (seat === -1) return { ok: false, reason: "full" };

    booking.seat = seat;
    booking.holdsSlot = true;
    try {
      await booking.save();
      return { ok: true };
    } catch (err) {
      if (err?.code === DUPLICATE_KEY && isSeatClash(err)) continue;
      throw err;
    }
  }

  return { ok: false, reason: "full" };
}
