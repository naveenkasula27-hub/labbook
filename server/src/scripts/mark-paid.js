/**
 * Marks a lab as paid for another stretch of time, after Naveen has
 * collected the payment by hand (UPI, cash, whatever).
 *
 *   node src/scripts/mark-paid.js <slug>                  30 days, same fee as before
 *   node src/scripts/mark-paid.js <slug> --days 30
 *   node src/scripts/mark-paid.js <slug> --fee 1000        also sets/updates the monthly fee
 *   node src/scripts/mark-paid.js <slug> --days 365 --fee 1000
 */
import { connectDb, disconnectDb } from "../db.js";
import { Lab } from "../models/Lab.js";

const [, , slug, ...rest] = process.argv;

function flag(name, fallback) {
  const i = rest.indexOf(`--${name}`);
  if (i === -1 || !rest[i + 1]) return fallback;
  const n = Number(rest[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}

async function run() {
  if (!slug) {
    console.error("Usage: node src/scripts/mark-paid.js <slug> [--days 30] [--fee 1000]");
    process.exit(1);
  }

  const days = flag("days", 30);
  const fee = flag("fee", undefined);

  await connectDb();

  const lab = await Lab.findOne({ slug: String(slug).toLowerCase() });
  if (!lab) {
    console.error(`No lab with slug "${slug}".`);
    await disconnectDb();
    process.exit(1);
  }

  const now = new Date();
  const current = lab.billing?.paidUntil ? new Date(lab.billing.paidUntil) : null;
  const base = current && current.getTime() > now.getTime() ? current : now;
  const paidUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const set = { "billing.paidUntil": paidUntil };
  if (fee !== undefined) set["billing.monthlyFee"] = fee;
  if (lab.plan === "trial") set.plan = "basic";

  await Lab.updateOne({ _id: lab._id }, { $set: set });

  console.log(`${lab.name} (/${lab.slug}) marked paid until ${paidUntil.toDateString()}.`);
  if (fee !== undefined) console.log(`Monthly fee set to ${fee}.`);

  await disconnectDb();
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});