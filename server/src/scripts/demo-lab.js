/**
 * The public demo lab: Maheera Diagnostics.
 *
 *   node src/scripts/demo-lab.js           create or update it
 *   node src/scripts/demo-lab.js --reset   wipe its bookings and put the samples back
 *
 * This is the lab anyone can look at. It is marked as a demo, so its booking
 * page carries a notice saying it is a sample rather than a real business.
 *
 * Nothing here touches any other lab. Every query is filtered on this lab's
 * own id, so Nandu Diagnostics and any real client is left alone.
 *
 * Safe to run as often as you like. Creating is an update when it already
 * exists, so you never end up with two.
 */
import { connectDb, disconnectDb } from "../db.js";
import { Lab } from "../models/Lab.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { CATALOG, PACKAGE_TEMPLATES } from "../seed/catalog.js";
import { DEMO_PRICES, DEMO_PACKAGE_PRICES } from "../seed/prices.js";
import { makeReference } from "../lib/reference.js";
import { createBookingHoldingSlot } from "../lib/seats.js";

const RESET = process.argv.includes("--reset");

/**
 * A made-up lab in a real town. The name is invented, the street is generic,
 * and the phone is Naveen's own, so anything a visitor sends reaches him and
 * no real business gets calls meant for a demo.
 */
const DEMO_LAB = {
  name: "Maheera Diagnostics",
  slug: "maheera",
  tagline: "Blood tests and scans in Ramayampet",
  about:
    "A local diagnostic centre doing routine blood work, fever panels and health checkups. " +
    "Home sample collection is available in and around town.",
  phone: "77290 69137",
  whatsapp: "917729069137",
  address: "Main Road, Ramayampet, Medak district, Telangana",
  city: "Ramayampet",
  country: "IN",
  currency: "INR",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  homeCollection: true,
  homeCollectionFee: 100,
  homeCollectionNote: "Free within 5 km. A small charge applies beyond that.",
  isDemo: true,

  /**
   * UnityWebWorks colours, from the brand guidelines: navy carries the page,
   * orange is kept for the things people click. Set per lab rather than in the
   * stylesheet, so a real client's site can be their own colours. That is part
   * of what the demo is showing.
   */
  theme: {
    primary: "#14213D", // Deep Navy, the header and headings
    accent: "#FF6A1F",  // Cursor Orange, links and highlights
    cta: "#FF6A1F",     // Cursor Orange, the buttons people press
  },
};

/** Published on the portfolio, so anyone can sign in and look around. */
const DEMO_LOGIN = {
  name: "Maheera Owner",
  email: "demo@maheera.test",
  password: "demo1234",
  role: "owner",
};

/** The bookings a visitor finds waiting in the dashboard. */
function sampleBookings() {
  const dayStr = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      patient: { name: "Ramesh Goud", age: 54, gender: "Male", phone: "919000000001" },
      visitType: "home",
      address: "H.No 4-21, Ambedkar Nagar, Ramayampet",
      items: [{ kind: "package", code: "diabetes_panel", name: "Diabetes Panel", price: 1400 }],
      date: dayStr(1),
      slot: "Morning",
      status: "confirmed",
    },
    {
      patient: { name: "Sunitha K", age: 31, gender: "Female", phone: "919000000002" },
      visitType: "lab",
      items: [
        { kind: "test", code: "cbc", name: "Complete Blood Count (CBC)", price: 300 },
        { kind: "test", code: "thyroid_profile", name: "Thyroid Profile — T3, T4, TSH", price: 500 },
      ],
      date: dayStr(0),
      slot: "Evening",
      status: "sample_collected",
    },
    {
      patient: { name: "Imran Ali", age: 8, gender: "Male", phone: "919000000003" },
      visitType: "lab",
      items: [{ kind: "package", code: "fever_panel", name: "Fever Panel", price: 1200 }],
      notes: "Fever for 3 days, doctor asked for a fever panel.",
      date: dayStr(0),
      slot: "Morning",
      status: "report_ready",
    },
    {
      patient: { name: "Lakshmi Devi", age: 62, gender: "Female", phone: "919000000004" },
      visitType: "home",
      address: "Near Bus Stand, Ramayampet",
      items: [{ kind: "package", code: "basic_health", name: "Basic Health Checkup", price: 1500 }],
      date: dayStr(2),
      slot: "Morning",
      status: "new",
    },
  ];
}

async function putSampleBookingsBack(lab) {
  for (const s of sampleBookings()) {
    const capacity = lab.slots.find((x) => x.label === s.slot)?.capacity ?? 0;
    await createBookingHoldingSlot(
      {
        lab: lab._id,
        reference: makeReference(lab.slug),
        currency: lab.currency,
        consent: true,
        estimatedTotal: s.items.reduce((sum, i) => sum + (i.price || 0), 0),
        statusLog: [{ status: s.status, by: "demo" }],
        ...s,
      },
      capacity
    );
  }
}

async function run() {
  await connectDb();

  /* ---------- reset: clear what visitors left behind ---------- */

  if (RESET) {
    const lab = await Lab.findOne({ slug: DEMO_LAB.slug });
    if (!lab) {
      console.error(`No demo lab yet. Run it without --reset first.`);
      await disconnectDb();
      process.exit(1);
    }

    const removed = await Booking.deleteMany({ lab: lab._id });
    console.log(`Removed ${removed.deletedCount} booking(s) from ${lab.name}.`);

    await putSampleBookingsBack(lab);
    console.log(`Put ${sampleBookings().length} sample booking(s) back.`);

    // Prices and settings get changed by visitors too, so put those back.
    await Lab.updateOne({ _id: lab._id }, { $set: DEMO_LAB });
    for (const t of CATALOG) {
      await Test.updateOne(
        { lab: lab._id, code: t.code },
        { $set: { price: DEMO_PRICES[t.code] ?? null, active: true } }
      );
    }
    for (const p of PACKAGE_TEMPLATES) {
      await Package.updateOne(
        { lab: lab._id, code: p.code },
        { $set: { price: DEMO_PACKAGE_PRICES[p.code] ?? null, active: true } }
      );
    }
    console.log("Prices, tests and settings put back to how they started.");

    // The password too, in case a visitor changed it.
    await User.updateOne(
      { email: DEMO_LOGIN.email },
      { $set: { passwordHash: await User.hashPassword(DEMO_LOGIN.password) } }
    );
    console.log(`Password reset to ${DEMO_LOGIN.password}.`);

    console.log("\nDone.");
    await disconnectDb();
    return;
  }

  /* ---------- create or update ---------- */

  const lab = await Lab.findOneAndUpdate(
    { slug: DEMO_LAB.slug },
    { $set: DEMO_LAB },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Lab: ${lab.name} (/${lab.slug})`);

  for (const [i, t] of CATALOG.entries()) {
    await Test.findOneAndUpdate(
      { lab: lab._id, code: t.code },
      {
        $set: {
          lab: lab._id,
          code: t.code,
          name: t.name,
          alias: t.alias || "",
          category: t.category,
          sample: t.sample,
          fasting: t.fasting || "",
          reportTime: t.reportTime || "",
          homeCollectable: t.homeCollectable !== false,
          price: DEMO_PRICES[t.code] ?? null,
          sort: i,
          active: true,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Tests: ${CATALOG.length}`);

  for (const [i, p] of PACKAGE_TEMPLATES.entries()) {
    await Package.findOneAndUpdate(
      { lab: lab._id, code: p.code },
      {
        $set: {
          lab: lab._id,
          code: p.code,
          name: p.name,
          description: p.description,
          testCodes: p.testCodes,
          fasting: p.fasting || "",
          price: DEMO_PACKAGE_PRICES[p.code] ?? null,
          sort: i,
          active: true,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Packages: ${PACKAGE_TEMPLATES.length}`);

  const existing = await User.findOne({ email: DEMO_LOGIN.email });
  if (existing) {
    existing.lab = lab._id;
    existing.passwordHash = await User.hashPassword(DEMO_LOGIN.password);
    await existing.save();
    console.log(`Login updated: ${DEMO_LOGIN.email} / ${DEMO_LOGIN.password}`);
  } else {
    await User.create({
      lab: lab._id,
      name: DEMO_LOGIN.name,
      email: DEMO_LOGIN.email,
      passwordHash: await User.hashPassword(DEMO_LOGIN.password),
      role: DEMO_LOGIN.role,
    });
    console.log(`Login created: ${DEMO_LOGIN.email} / ${DEMO_LOGIN.password}`);
  }

  if ((await Booking.countDocuments({ lab: lab._id })) === 0) {
    await putSampleBookingsBack(lab);
    console.log(`Bookings: ${sampleBookings().length}`);
  } else {
    console.log("Bookings already present, left alone. Use --reset to replace them.");
  }

  console.log(`\nBooking page: /${lab.slug}`);
  console.log(`Dashboard:    demo@maheera.test / ${DEMO_LOGIN.password}`);

  await disconnectDb();
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
