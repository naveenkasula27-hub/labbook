/**
 * Bookings, as the lab sees them. Login required.
 *
 * Every query filters on req.labId, which comes from the token, never from
 * anything the browser sends. That is what keeps one lab out of another's data.
 */
import express from "express";
import { z } from "zod";
import { Booking, BOOKING_STATUSES } from "../models/Booking.js";
import { Lab } from "../models/Lab.js";
import { requireAuth, requireLab } from "../middleware/auth.js";
import { todayInZone, isValidDateStr, addDays } from "../lib/dates.js";
import { reportReady } from "../services/whatsapp.js";

export const dashboardBookingsRouter = express.Router();
dashboardBookingsRouter.use(requireAuth, requireLab);

/* ---------- Counts for the top of the screen ---------- */

dashboardBookingsRouter.get("/summary", async (req, res) => {
  const lab = await Lab.findById(req.labId).lean();
  const today = todayInZone(lab.timezone);
  const tomorrow = addDays(today, 1);

  const [todayCount, tomorrowCount, byStatus, unseen] = await Promise.all([
    Booking.countDocuments({ lab: req.labId, date: today, status: { $nin: ["cancelled", "no_show"] } }),
    Booking.countDocuments({ lab: req.labId, date: tomorrow, status: { $nin: ["cancelled", "no_show"] } }),
    Booking.aggregate([
      { $match: { lab: req.labId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Booking.countDocuments({ lab: req.labId, status: "new" }),
  ]);

  res.json({
    today,
    todayCount,
    tomorrowCount,
    newCount: unseen,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
  });
});

/* ---------- The list ---------- */

const listSchema = z.object({
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  status: z.enum([...BOOKING_STATUSES, "all", "open"]).optional(),
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

dashboardBookingsRouter.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { date, from, to, status, q, page, limit } = parsed.data;

  const where = { lab: req.labId };

  if (date) {
    if (!isValidDateStr(date)) return res.status(400).json({ error: "That date is not valid." });
    where.date = date;
  } else if (from || to) {
    where.date = {};
    if (from) {
      if (!isValidDateStr(from)) return res.status(400).json({ error: "That start date is not valid." });
      where.date.$gte = from;
    }
    if (to) {
      if (!isValidDateStr(to)) return res.status(400).json({ error: "That end date is not valid." });
      where.date.$lte = to;
    }
  }

  if (status === "open") {
    // Everything still needing the lab to do something.
    where.status = { $in: ["new", "confirmed", "sample_collected"] };
  } else if (status && status !== "all") {
    where.status = status;
  }

  if (q) {
    // Search by name, phone or reference. Escaped, so a search for "a.b"
    // does not become a wildcard.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    where.$or = [{ "patient.name": rx }, { "patient.phone": rx }, { reference: rx }];
  }

  const [rows, total] = await Promise.all([
    Booking.find(where)
      .sort({ date: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(where),
  ]);

  res.json({
    bookings: rows.map(shapeForLab),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/* ---------- One booking ---------- */

dashboardBookingsRouter.get("/:reference", async (req, res) => {
  const booking = await Booking.findOne({
    lab: req.labId,
    reference: String(req.params.reference).toUpperCase(),
  }).lean();

  if (!booking) return res.status(404).json({ error: "No booking with that reference." });
  res.json({ booking: { ...shapeForLab(booking), statusLog: booking.statusLog } });
});

/* ---------- Change the status ---------- */

const statusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  notifyPatient: z.boolean().optional(),
});

dashboardBookingsRouter.patch("/:reference/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "That status is not one we recognise." });
  }
  const { status, notifyPatient } = parsed.data;

  const booking = await Booking.findOne({
    lab: req.labId,
    reference: String(req.params.reference).toUpperCase(),
  });
  if (!booking) return res.status(404).json({ error: "No booking with that reference." });

  if (booking.status === status) {
    return res.json({ booking: shapeForLab(booking.toObject()), changed: false });
  }

  booking.status = status;
  booking.statusLog.push({ status, at: new Date(), by: req.user.email });
  await booking.save();

  // "Report ready" is the one status worth telling the patient about.
  let messaged = false;
  if (status === "report_ready" && notifyPatient !== false) {
    try {
      const lab = await Lab.findById(req.labId).lean();
      const r = await reportReady(lab, booking);
      messaged = !r?.skipped;
      if (messaged) {
        await Booking.updateOne({ _id: booking._id }, { $set: { "messages.reportNotified": true } });
      }
    } catch (err) {
      console.error(`[booking ${booking.reference}] report message failed:`, err.message);
    }
  }

  res.json({ booking: shapeForLab(booking.toObject()), changed: true, messaged });
});

/* ---------- Lab's own notes on a booking ---------- */

dashboardBookingsRouter.patch("/:reference/notes", async (req, res) => {
  const text = String(req.body?.labNotes ?? "");
  if (text.length > 1000) {
    return res.status(400).json({ error: "Notes are too long (1000 characters maximum)." });
  }

  const booking = await Booking.findOneAndUpdate(
    { lab: req.labId, reference: String(req.params.reference).toUpperCase() },
    { $set: { labNotes: text.trim() } },
    { new: true }
  ).lean();

  if (!booking) return res.status(404).json({ error: "No booking with that reference." });
  res.json({ booking: shapeForLab(booking) });
});

/** What the lab is allowed to see. Internal ids stay out. */
function shapeForLab(b) {
  return {
    reference: b.reference,
    patient: b.patient,
    visitType: b.visitType,
    address: b.address,
    items: b.items,
    notes: b.notes,
    labNotes: b.labNotes || "",
    estimatedTotal: b.estimatedTotal,
    currency: b.currency,
    date: b.date,
    slot: b.slot,
    status: b.status,
    source: b.source,
    messages: b.messages,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}
