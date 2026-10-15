/**
 * Gives existing bookings a numbered place in their slot.
 *
 *   node src/scripts/backfill-seats.js            see what would change
 *   node src/scripts/backfill-seats.js --write    make the changes
 *
 * Run this once, against the same database the live site uses. Bookings made
 * before the capacity fix have no place number, so without this they neither
 * hold a place nor show up as taken, and a slot that looks full in the
 * dashboard would read as empty on the booking page.
 *
 * Safe to run more than once. Bookings that already hold a place are left
 * alone, and nothing is deleted.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { config } from "../config.js";
import { Booking } from "../models/Booking.js";
import { Lab } from "../models/Lab.js";

const WRITE = process.argv.includes("--write");
const FREES_THE_SLOT = ["cancelled", "no_show"];

const safeUri = (uri) => uri.replace(/\/\/[^@]*@/, "//***:***@");

async function main() {
  console.log(WRITE ? "Writing changes." : "Dry run. Nothing will be changed.");
  console.log(`Database: ${safeUri(config.mongoUri)}\n`);

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });

  const labs = await Lab.find().select("name slug slots").lean();
  const capacityFor = new Map();
  for (const lab of labs) {
    for (const s of lab.slots || []) {
      capacityFor.set(`${lab._id}|${s.label}`, s.capacity);
    }
  }

  // Oldest first, so whoever booked earliest keeps the lower place number and
  // anyone over capacity is at the end rather than chosen at random.
  const bookings = await Booking.find({ date: { $ne: "" }, slot: { $ne: "" } })
    .sort({ createdAt: 1 })
    .select("lab date slot status seat holdsSlot reference");

  const nextSeat = new Map();   // "lab|date|slot" -> next number to hand out
  let held = 0;
  let released = 0;
  let overCapacity = 0;

  for (const b of bookings) {
    const key = `${b.lab}|${b.date}|${b.slot}`;
    const shouldHold = !FREES_THE_SLOT.includes(b.status);

    if (!shouldHold) {
      if (b.holdsSlot || b.seat !== null) {
        if (WRITE) await Booking.updateOne({ _id: b._id }, { $set: { holdsSlot: false } });
        released++;
      }
      continue;
    }

    if (b.holdsSlot && typeof b.seat === "number") {
      // Already sorted. Make sure we do not hand the same number out again.
      nextSeat.set(key, Math.max(nextSeat.get(key) ?? 0, b.seat + 1));
      continue;
    }

    const seat = nextSeat.get(key) ?? 0;
    nextSeat.set(key, seat + 1);

    const capacity = capacityFor.get(`${b.lab}|${b.slot}`);
    if (typeof capacity === "number" && seat >= capacity) {
      overCapacity++;
      console.log(
        `  over capacity: ${b.reference} ${b.date} ${b.slot} ` +
          `gets place ${seat} of ${capacity}`
      );
    }

    if (WRITE) {
      await Booking.updateOne({ _id: b._id }, { $set: { seat, holdsSlot: true } });
    }
    held++;
  }

  console.log(`\nBookings with a date and slot: ${bookings.length}`);
  console.log(`Given a place:                 ${held}`);
  console.log(`Marked as not holding a place: ${released}`);
  if (overCapacity) {
    console.log(
      `\n${overCapacity} booking(s) sit past the slot's capacity. They keep their\n` +
        `place, so nobody is turned away, but those slots will read as full\n` +
        `until some of them are cancelled or completed.`
    );
  }

  if (WRITE) {
    console.log("\nBuilding the unique index that enforces capacity...");
    await Booking.syncIndexes();
    console.log("Done.");
  } else {
    console.log("\nNothing was changed. Run again with --write to apply.");
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\nFailed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
