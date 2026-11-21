/**
 * Everything the public booking page needs. No login.
 *
 * Multi-tenant by lab slug in the URL: /api/public/nandu/tests
 */
import { cataloguePrice } from "../lib/demo-prices.js";
import { createRouter } from "../lib/router.js";
import { sharedLimit } from "../middleware/rate-limit.js";
import { z } from "zod";
import { Lab } from "../models/Lab.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { Booking } from "../models/Booking.js";
import { Enquiry } from "../models/Enquiry.js";
import { Doctor } from "../models/Doctor.js";
import { SAMPLE_DOCTORS } from "../lib/doctor-profiles.js";
import { makeReference } from "../lib/reference.js";
import { createBookingHoldingSlot } from "../lib/seats.js";
import { normalisePhone, looksLikeMobile } from "../lib/phone.js";
import { CATEGORY_ORDER } from "../seed/catalog.js";
import { config } from "../config.js";
import { notifyLabOfBooking, confirmToPatient } from "../services/whatsapp.js";
import { todayInZone, isValidDateStr, addDays } from "../lib/dates.js";

export const publicRouter = createRouter();

/** Look up the lab once and hang it on the request. */
async function loadLab(req, res, next) {
  const lab = await Lab.findOne({ slug: String(req.params.slug).toLowerCase(), active: true });
  if (!lab) return res.status(404).json({ error: "No lab found at this address." });
  req.lab = lab;
  next();
}

const publicLab = (lab) => ({
  name: lab.name,
  slug: lab.slug,
  tagline: lab.tagline,
  about: lab.about,
  isDemo: Boolean(lab.isDemo),
  phone: lab.phone,
  whatsapp: lab.whatsapp,
  address: lab.address,
  city: lab.city,
  mapsUrl: lab.mapsUrl,
  country: lab.country,
  currency: lab.currency,
  locale: lab.locale,
  timezone: lab.timezone,
  homeCollection: lab.homeCollection,
  homeCollectionFee: lab.homeCollectionFee,
  homeCollectionNote: lab.homeCollectionNote,
  openDays: lab.openDays,
  slots: lab.slots.map((s) => ({ label: s.label, start: s.start, end: s.end })),
  theme: lab.theme,
  logoUrl: lab.logoUrl,
  photos: lab.photos,
});

/* ---------- Lab profile, tests and packages in one call ---------- */

publicRouter.get("/:slug", loadLab, async (req, res) => {
  const [tests, packages] = await Promise.all([
    Test.find({ lab: req.lab._id, active: true })
      .select("code name alias category sample price fasting reportTime homeCollectable")
      .sort({ sort: 1 })
      .lean(),
    Package.find({ lab: req.lab._id, active: true })
      .select("code name description testCodes price fasting audience")
      .sort({ sort: 1 })
      .lean(),
  ]);

  const present = new Set(tests.map((t) => t.category));
  const categories = CATEGORY_ORDER.filter((c) => present.has(c));
  for (const c of present) if (!categories.includes(c)) categories.push(c);

  res.json({ lab: publicLab(req.lab), tests: tests.map(row => ({ ...row, ...cataloguePrice(row, req.lab) })), packages: packages.map(row => ({ ...row, ...cataloguePrice(row, req.lab, "package") })), categories });
});

publicRouter.get("/:slug/doctors", loadLab, async (req, res) => {
  const doctors = await Doctor.find({ lab: req.lab._id, active: true }).select("code name specialty qualifications description fee portrait photoUrl").sort({ name: 1 }).lean();
  res.json({ doctors: doctors.length ? doctors : (req.lab.isDemo ? SAMPLE_DOCTORS : []) });
});

/* Preferred dates on requests never reserve a collection or consultation slot. */
const enquiryLimiter = sharedLimit("enquiry", 5, 15 * 60 * 1000, "You have sent several requests. Please call the lab for help.");
const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z.string().trim().min(6).max(30),
  message: z.string().trim().max(300).default(""),
  kind: z.enum(["callback", "home_collection", "consultation"]).default("callback"),
  email: z.string().trim().max(160).email().or(z.literal("")).default(""),
  preferredDate: z.string().max(10).default(""),
  preferredTime: z.enum(["", "morning", "afternoon", "evening"]).default(""),
  doctorCode: z.string().max(50).default(""),
});
publicRouter.post("/:slug/enquiries", loadLab, enquiryLimiter, async (req, res) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const phone = normalisePhone(parsed.data.phone, req.lab.country);
  if (!looksLikeMobile(phone, req.lab.country)) return res.status(400).json({ error: "Enter a valid mobile number." });
  const details = parsed.data;
  if (details.kind !== "callback") {
    const today = todayInZone(req.lab.timezone);
    if (!isValidDateStr(details.preferredDate) || details.preferredDate < today || details.preferredDate > addDays(today, 90) || !details.preferredTime) {
      return res.status(400).json({ error: "Choose a preferred date in the next 90 days and a time period." });
    }
  }
  if (details.kind === "home_collection") {
    if (!req.lab.homeCollection) return res.status(400).json({ error: "This lab does not offer home collection." });
    const weekday = new Date(`${details.preferredDate}T12:00:00Z`).getUTCDay();
    if (!req.lab.openDays.includes(weekday)) return res.status(400).json({ error: "The lab is closed on that day. Choose another date." });
  }
  let doctor = null;
  if (details.kind === "consultation") {
    doctor = await Doctor.findOne({ lab: req.lab._id, code: details.doctorCode, active: true }).lean();
    if (!doctor && req.lab.isDemo) doctor = SAMPLE_DOCTORS.find((item) => item.code === details.doctorCode);
    if (!doctor) return res.status(400).json({ error: "This doctor is not available at this lab. Choose another profile." });
  }
  const enquiry = await Enquiry.create({ lab: req.lab._id, name: details.name, phone, message: details.message, kind: details.kind, email: details.email, preferredDate: details.preferredDate, preferredTime: details.preferredTime, doctorCode: doctor?.code || "", doctorName: doctor?.name || "" });
  res.status(201).json({ reference: enquiry.reference, isDemo: Boolean(req.lab.isDemo) });
});

/* ---------- Which slots are still open on a date ---------- */

publicRouter.get("/:slug/availability", loadLab, async (req, res) => {
  const date = String(req.query.date || "");
  if (!isValidDateStr(date)) {
    return res.status(400).json({ error: "Pass a date as YYYY-MM-DD." });
  }
  if (date < todayInZone(req.lab.timezone)) {
    return res.status(400).json({ error: "That date has passed." });
  }

  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (!req.lab.openDays.includes(weekday)) {
    return res.json({ date, open: false, reason: "The lab is closed on this day.", slots: [] });
  }

  // holdsSlot is the one definition of "this booking occupies a place", kept
  // in step with the unique index that enforces it. Cancelled bookings and
  // bookings with no slot have it false.
  const taken = await Booking.aggregate([
    { $match: { lab: req.lab._id, date, holdsSlot: true } },
    { $group: { _id: "$slot", count: { $sum: 1 } } },
  ]);
  const used = Object.fromEntries(taken.map((t) => [t._id, t.count]));

  res.json({
    date,
    open: true,
    slots: req.lab.slots.map((s) => ({
      label: s.label,
      start: s.start,
      end: s.end,
      left: Math.max(0, s.capacity - (used[s.label] || 0)),
      full: (used[s.label] || 0) >= s.capacity,
    })),
  });
});

/* ---------- Create a booking ---------- */

const bookingLimiter = sharedLimit("booking", config.bookingRateLimit, 10 * 60 * 1000,
  "Too many bookings from this device. Please try again in a few minutes.");
const lookupLimiter = sharedLimit("lookup", 30, 10 * 60 * 1000, "Too many booking checks. Please try again later.");

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's name.").max(80),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  visitType: z.enum(["lab", "home"]).default("lab"),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  testCodes: z.array(z.string().trim()).default([]),
  packageCodes: z.array(z.string().trim()).default([]),
  date: z.string().trim().optional().or(z.literal("")),
  slot: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, { error: "Tick the consent box so the lab can contact you." }),
});

publicRouter.post("/:slug/bookings", bookingLimiter, loadLab, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    const field = parsed.error.issues[0];
    return res.status(400).json({ error: field.message, field: field.path.join(".") });
  }
  const b = parsed.data;
  const lab = req.lab;

  const phone = normalisePhone(b.phone, lab.country);
  if (!phone || !looksLikeMobile(phone, lab.country)) {
    return res.status(400).json({ error: "That mobile number does not look right.", field: "phone" });
  }

  if (b.visitType === "home") {
    if (!lab.homeCollection) {
      return res.status(400).json({ error: "This lab does not do home collection.", field: "visitType" });
    }
    if (!b.address) {
      return res.status(400).json({ error: "Enter the address for home collection.", field: "address" });
    }
  }

  // Resolve what was picked against this lab's own rows, never trusting
  // the names or prices the browser sent.
  const [tests, packages] = await Promise.all([
    b.testCodes.length
      ? Test.find({ lab: lab._id, code: { $in: b.testCodes }, active: true }).lean()
      : [],
    b.packageCodes.length
      ? Package.find({ lab: lab._id, code: { $in: b.packageCodes }, active: true }).lean()
      : [],
  ]);

  if (tests.length !== new Set(b.testCodes).size || packages.length !== new Set(b.packageCodes).size) {
    return res.status(400).json({ error: "Some selected tests or packages are no longer available. Refresh and try again." });
  }
  const items = [
    ...packages.map((p) => ({ kind: "package", code: p.code, name: p.name, price: cataloguePrice(p, lab, "package").price })),
    ...tests.map((t) => ({ kind: "test", code: t.code, name: t.name, price: cataloguePrice(t, lab).price })),
  ];

  if (!items.length && !b.notes) {
    return res.status(400).json({
      error: "Pick at least one test, or write what you need in the notes.",
      field: "testCodes",
    });
  }

  if (b.visitType === "home") {
    const packageTestCodes = [...new Set(packages.flatMap((p) => p.testCodes))];
    const packageTests = packageTestCodes.length
      ? await Test.find({ lab: lab._id, code: { $in: packageTestCodes } }).lean() : [];
    if (packageTests.length !== packageTestCodes.length) {
      return res.status(400).json({ error: "A package contains unavailable tests. Please contact the lab.", field: "visitType" });
    }
    const notAtHome = [...new Set([...tests, ...packageTests].filter((t) => !t.homeCollectable || !t.active).map((t) => t.name))];
    if (notAtHome.length) {
      return res.status(400).json({
        error: `These have to be done at the lab: ${notAtHome.join(", ")}.`,
        field: "visitType",
      });
    }
  }

  // Date and slot, when given
  let { date, slot } = b;
  if (date) {
    if (!isValidDateStr(date)) {
      return res.status(400).json({ error: "That date is not valid.", field: "date" });
    }
    if (date < todayInZone(lab.timezone)) {
      return res.status(400).json({ error: "That date has passed.", field: "date" });
    }
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (!lab.openDays.includes(weekday)) {
      return res.status(400).json({ error: "The lab is closed on that day.", field: "date" });
    }
  }
  // Capacity itself is checked on the write, further down, so that two people
  // booking the last place at the same moment cannot both succeed. Here we
  // only confirm the slot is one the lab actually offers.
  let slotCapacity = 0;
  if (slot) {
    const known = lab.slots.find((s) => s.label === slot);
    if (!known) {
      return res.status(400).json({ error: "That time is not one of the lab's slots.", field: "slot" });
    }
    slotCapacity = known.capacity;
  }

  const priced = items.filter((i) => typeof i.price === "number");
  const estimatedTotal =
    priced.length === items.length && items.length
      ? priced.reduce((sum, i) => sum + i.price, 0) +
        (b.visitType === "home" ? lab.homeCollectionFee || 0 : 0)
      : null;

  const { booking, full } = await createBookingHoldingSlot(
    {
      lab: lab._id,
      reference: makeReference(lab.slug),
      patient: { name: b.name, age: b.age, gender: b.gender, phone, email: b.email || "" },
      visitType: b.visitType,
      address: b.visitType === "home" ? b.address : "",
      items,
      notes: b.notes || "",
      estimatedTotal,
      currency: lab.currency,
      date: date || "",
      slot: slot || "",
      status: "new",
      statusLog: [{ status: "new", by: "patient" }],
      source: "web",
      consent: true,
    },
    slotCapacity
  );

  if (full) {
    return res.status(409).json({ error: "That slot is full. Please pick another.", field: "slot" });
  }

  // Messages go out after the booking is safely saved. A WhatsApp failure
  // must never lose the booking.
  const messages = { labNotified: false, patientConfirmed: false };
  try {
    const r = await notifyLabOfBooking(lab, booking);
    messages.labNotified = !r?.skipped;
  } catch (err) {
    console.error(`[booking ${booking.reference}] lab notify failed:`, err.message);
  }
  try {
    const r = await confirmToPatient(lab, booking);
    messages.patientConfirmed = !r?.skipped;
  } catch (err) {
    console.error(`[booking ${booking.reference}] patient confirm failed:`, err.message);
  }
  if (messages.labNotified || messages.patientConfirmed) {
    await Booking.updateOne({ _id: booking._id }, { $set: { messages } });
  }

  res.status(201).json({
    reference: booking.reference,
    status: booking.status,
    date: booking.date,
    slot: booking.slot,
    visitType: booking.visitType,
    items: booking.items.map((i) => ({ name: i.name, price: i.price })),
    estimatedTotal: booking.estimatedTotal,
    currency: booking.currency,
    whatsappNotified: messages.labNotified,
  });
});

/* ---------- Patient checks their own booking ---------- */

publicRouter.get("/:slug/bookings/:reference", lookupLimiter, loadLab, async (req, res) => {
  const booking = await Booking.findOne({
    lab: req.lab._id,
    reference: String(req.params.reference).toUpperCase(),
  }).lean();

  if (!booking) return res.status(404).json({ error: "No booking with that reference." });

  // The last 4 digits of the phone must match, so a guessed reference
  // does not hand over someone else's details.
  const last4 = String(req.query.phone || "").replace(/\D/g, "").slice(-4);
  if (last4.length !== 4 || !booking.patient.phone.endsWith(last4)) {
    return res.status(403).json({ error: "Add the last 4 digits of the booking phone number." });
  }

  res.json({
    reference: booking.reference,
    status: booking.status,
    date: booking.date,
    slot: booking.slot,
    visitType: booking.visitType,
    items: booking.items.map((i) => ({ name: i.name, price: i.price })),
    estimatedTotal: booking.estimatedTotal,
    currency: booking.currency,
    createdAt: booking.createdAt,
  });
});
