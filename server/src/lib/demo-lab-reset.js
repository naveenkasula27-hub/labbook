/**
 * The nightly reset for the public demo lab (Maheera Diagnostics).
 *
 * Shared by the manual script (src/scripts/demo-lab.js --reset) and the
 * /api/cron/reset-demo-lab route that Vercel Cron calls every night. Both
 * just call resetDemoLab() — this is the one place the actual steps live.
 *
 * Only ever touches the lab with slug "maheera". Nothing else, ever.
 */
import { Lab } from "../models/Lab.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { CATALOG, PACKAGE_TEMPLATES } from "../seed/catalog.js";
import { DEMO_PRICES, DEMO_PACKAGE_PRICES } from "../seed/prices.js";
import { makeReference } from "./reference.js";
import { createBookingHoldingSlot } from "./seats.js";

const DEMO_SLUG = "maheera";

const DEMO_LAB_FIELDS = {
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
  slots: [
    { label: "Morning", start: "07:00", end: "11:00", capacity: 4 },
    { label: "Afternoon", start: "11:00", end: "16:00", capacity: 4 },
    { label: "Evening", start: "16:00", end: "20:00", capacity: 4 },
  ],
  theme: {
    primary: "#14213D",
    accent: "#FF6A1F",
    cta: "#FF6A1F",
  },
};

const DEMO_LOGIN = {
  email: "demo@maheera.test",
  password: "demo1234",
};

function sampleBookings() {
  const dayStr = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      patient: { name: "Ramesh Kumar", age: 54, gender: "Male", phone: "919000000001" },
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

/**
 * Wipes whatever visitors left on the demo lab and puts the sample data back.
 * Assumes the database is already connected (the running server keeps its
 * own connection open; the standalone script connects before calling this).
 */
export async function resetDemoLab() {
  const lab = await Lab.findOne({ slug: DEMO_SLUG });
  if (!lab) {
    throw new Error(`No demo lab (slug "${DEMO_SLUG}") found — run the seed/demo-lab script first.`);
  }

  const removed = await Booking.deleteMany({ lab: lab._id });
  await putSampleBookingsBack(lab);

  await Lab.updateOne({ _id: lab._id }, { $set: DEMO_LAB_FIELDS });

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

  await User.updateOne(
    { email: DEMO_LOGIN.email },
    { $set: { passwordHash: await User.hashPassword(DEMO_LOGIN.password) } }
  );

  return {
    lab: lab.name,
    bookingsRemoved: removed.deletedCount,
    bookingsAdded: sampleBookings().length,
  };
}