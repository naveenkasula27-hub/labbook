/**
 * Sends a WhatsApp reminder to every patient with a booking tomorrow.
 *
 * Run once a day. Safe to run more than once in the same day — each booking
 * is only reminded once, tracked by booking.messages.reminderSent, so a
 * second run that morning finds nothing left to do.
 *
 * Demo labs are skipped entirely (see whatsapp.js — remindPatient already
 * refuses them, this just avoids the wasted query).
 *
 *   node src/jobs/send-reminders.js            real run, sends messages
 *   node src/jobs/send-reminders.js --dry-run  shows who would be messaged, sends nothing
 */
import { connectDb, disconnectDb } from "../db.js";
import { Lab } from "../models/Lab.js";
import { Booking } from "../models/Booking.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { remindPatient } from "../services/whatsapp.js";
import { config } from "../config.js";

const DRY_RUN = process.argv.includes("--dry-run");

/** "2026-10-17" for a lab in its own timezone, a given number of days ahead. */
function labLocalDate(timezone, daysAhead) {
  const at = new Date(Date.now() + daysAhead * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "Asia/Kolkata" }).format(at);
}

/** What to tell the patient to do before they arrive, if anything. */
async function fastingNoteFor(labId, items) {
  const testCodes = items.filter((i) => i.kind === "test").map((i) => i.code);
  const packageCodes = items.filter((i) => i.kind === "package").map((i) => i.code);
  const notes = new Set();

  if (testCodes.length) {
    const tests = await Test.find({ lab: labId, code: { $in: testCodes } }).select("fasting");
    for (const t of tests) if (t.fasting) notes.add(t.fasting);
  }
  if (packageCodes.length) {
    const packages = await Package.find({ lab: labId, code: { $in: packageCodes } }).select("fasting");
    for (const p of packages) if (p.fasting) notes.add(p.fasting);
  }

  return notes.size ? `Fasting needed: ${[...notes].join("; ")}` : "";
}

async function run() {
  if (!config.whatsapp.enabled && !DRY_RUN) {
    console.error("WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set. Nothing to do.");
    process.exit(1);
  }

  await connectDb();

  const labs = await Lab.find({ isDemo: { $ne: true } });
  let sent = 0;
  let failed = 0;

  for (const lab of labs) {
    const tomorrow = labLocalDate(lab.timezone, 1);

    const bookings = await Booking.find({
      lab: lab._id,
      date: tomorrow,
      status: { $nin: ["cancelled", "no_show", "completed"] },
      "messages.reminderSent": false,
    });

    for (const booking of bookings) {
      if (DRY_RUN) {
        console.log(`[dry run] would remind ${booking.patient.name} (${booking.reference}) — ${lab.name}`);
        continue;
      }

      try {
        const fastingNote = await fastingNoteFor(lab._id, booking.items);
        await remindPatient(lab, booking, fastingNote);
        booking.messages.reminderSent = true;
        await booking.save();
        sent++;
        console.log(`Reminded ${booking.patient.name} — ${booking.reference} (${lab.name})`);
      } catch (err) {
        failed++;
        // A send failing here most often means the message needs an approved
        // template — see the note in whatsapp.js. Logged and moved past, so
        // one bad number doesn't stop the rest of the day's reminders.
        console.error(`Failed for ${booking.reference} (${lab.name}): ${err.message}`);
      }
    }
  }

  console.log(`\nDone. Sent ${sent}, failed ${failed}.`);
  await disconnectDb();
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
