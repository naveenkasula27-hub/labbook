/**
 * Creates one demo lab with the full catalog, packages, a login and a few bookings.
 *
 *   npm run seed
 *
 * Safe to run again: it updates the same lab instead of making a second one.
 */
import { connectDb, disconnectDb } from "../db.js";
import { Lab } from "../models/Lab.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { CATALOG, PACKAGE_TEMPLATES } from "./catalog.js";
import { makeReference } from "../lib/reference.js";

const DEMO = {
  name: "Nandu Diagnostics",
  slug: "nandu",
  tagline: "Blood tests and scans in Gajwel",
  about:
    "A local diagnostic centre doing routine blood work, fever panels and health checkups. " +
    "Home sample collection is available in and around town.",
  phone: "99490 70916",
  whatsapp: "919949070916",
  address: "Main Road, Gajwel, Siddipet district, Telangana",
  city: "Gajwel",
  country: "IN",
  currency: "INR",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  homeCollection: true,
  homeCollectionFee: 100,
  homeCollectionNote: "Free within 5 km. A small charge applies beyond that.",
};

/** Starting prices for the demo lab only, so the page does not look empty. */
const DEMO_PRICES = {
  cbc: 300, hb: 100, esr: 100, bloodgroup: 150, crp: 500,
  fbs: 80, ppbs: 80, rbs: 80, hba1c: 500, ogtt: 300,
  lipid: 600, chol_total: 200, triglycerides: 200,
  lft: 700, sgpt: 200, sgot: 200, bilirubin: 200,
  kft: 700, creatinine: 150, urea: 150, uric_acid: 200,
  tsh: 250, thyroid_profile: 500, ft3_ft4: 600,
  vit_d: 1200, vit_b12: 1100, iron_studies: 900, ferritin: 700, calcium: 200,
  widal: 250, malaria_card: 300, dengue_ns1: 700, dengue_igm: 800, typhidot: 500,
  hiv: 400, hbsag: 400, hcv: 500, vdrl: 250,
  urine_routine: 150, urine_culture: 600, urine_preg: 150,
  stool_routine: 200,
  pt_inr: 400, aptt: 400, ddimer: 900,
  psa: 800, ca125: 1100,
  xray_chest: 350, usg_abdomen: 900, usg_preg: 800, ecg: 200, echo: 1200,
};

const DEMO_PACKAGE_PRICES = {
  basic_health: 1500,
  full_body: 3500,
  diabetes_panel: 1400,
  fever_panel: 1200,
  thyroid_panel: 1100,
  heart_panel: 2800,
  pregnancy_first: 2500,
  women_wellness: 3200,
  senior_citizen: 4200,
};

async function run() {
  await connectDb();

  const lab = await Lab.findOneAndUpdate(
    { slug: DEMO.slug },
    { $set: DEMO },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Lab: ${lab.name} (${lab.slug})`);

  // Tests
  let testCount = 0;
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
    testCount++;
  }
  console.log(`Tests: ${testCount}`);

  // Packages
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

  // Dashboard login
  const email = "owner@nandu.test";
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({
      lab: lab._id,
      name: "Nandu Owner",
      email,
      passwordHash: await User.hashPassword("nandu1234"),
      role: "owner",
    });
    console.log(`Login created: ${email} / nandu1234`);
  } else {
    console.log(`Login already exists: ${email}`);
  }

  // A few bookings so the dashboard is not empty
  if ((await Booking.countDocuments({ lab: lab._id })) === 0) {
    const today = new Date();
    const dayStr = (offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };
    const samples = [
      {
        patient: { name: "Ramesh Goud", age: 54, gender: "Male", phone: "919000000001" },
        visitType: "home",
        address: "H.No 4-21, Ambedkar Nagar, Gajwel",
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
    ];
    for (const s of samples) {
      await Booking.create({
        lab: lab._id,
        reference: makeReference(lab.slug),
        currency: lab.currency,
        consent: true,
        estimatedTotal: s.items.reduce((sum, i) => sum + (i.price || 0), 0),
        statusLog: [{ status: s.status, by: "seed" }],
        ...s,
      });
    }
    console.log(`Bookings: ${samples.length}`);
  } else {
    console.log("Bookings already present, left alone");
  }

  console.log("\nDone.");
  console.log(`Booking page:  http://localhost:5173/${lab.slug}`);
  console.log(`Dashboard:     http://localhost:5173/dashboard`);
  await disconnectDb();
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
