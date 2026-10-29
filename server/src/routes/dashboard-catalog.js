/**
 * The lab's own tests, packages and settings. Login required.
 *
 * This is how a lab sets its prices without anyone touching code.
 */
import express from "express";
import { z } from "zod";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { Lab } from "../models/Lab.js";
import { requireAuth, requireLab } from "../middleware/auth.js";

export const dashboardCatalogRouter = express.Router();
dashboardCatalogRouter.use(requireAuth, requireLab);

/**
 * A price, or no price at all.
 *
 * null and "" both mean "no price", which shows as "ask the lab" on the
 * booking page. Order matters here: z.coerce.number() turns null into 0, so if
 * the number rule were tried first, clearing a price would quietly set the
 * test to free. null is checked first for that reason.
 */
const priceOrNone = z
  .union([
    z.null(),
    z.literal(""),
    z.coerce.number().min(0, "A price cannot be negative.").max(1_000_000),
  ])
  .transform((v) => (v === "" ? null : v));

/* ---------- Tests ---------- */

dashboardCatalogRouter.get("/tests", async (req, res) => {
  const tests = await Test.find({ lab: req.labId })
    .select("code name alias category sample price fasting reportTime homeCollectable active sort")
    .sort({ sort: 1 })
    .lean();

  const categories = [...new Set(tests.map((t) => t.category))];
  res.json({ tests, categories });
});

const testUpdateSchema = z.object({
  // null means "no price set", which shows as "ask the lab" on the booking page.
  price: priceOrNone.optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  alias: z.string().trim().max(120).optional(),
  fasting: z.string().trim().max(120).optional(),
  reportTime: z.string().trim().max(60).optional(),
  homeCollectable: z.boolean().optional(),
});

dashboardCatalogRouter.patch("/tests/:code", async (req, res) => {
  const parsed = testUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).json({ error: issue.message, field: issue.path.join(".") });
  }
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to change." });
  }

  const test = await Test.findOneAndUpdate(
    { lab: req.labId, code: String(req.params.code) },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!test) return res.status(404).json({ error: "This lab does not have that test." });
  res.json({ test });
});

/** Set many prices in one go, for a lab filling in its whole list. */
const bulkSchema = z.object({
  prices: z
    .array(
      z.object({
        code: z.string().trim().min(1),
        price: priceOrNone,
      })
    )
    .min(1)
    .max(500),
});

dashboardCatalogRouter.patch("/tests", async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Could not read the price list." });
  }

  const ops = parsed.data.prices.map((p) => ({
    updateOne: {
      filter: { lab: req.labId, code: p.code },
      update: { $set: { price: p.price } },
    },
  }));

  const result = await Test.bulkWrite(ops, { ordered: false });
  res.json({ updated: result.modifiedCount, matched: result.matchedCount });
});

/* ---------- Packages ---------- */

dashboardCatalogRouter.get("/packages", async (req, res) => {
  const packages = await Package.find({ lab: req.labId })
    .select("code name description testCodes price fasting audience active sort")
    .sort({ sort: 1 })
    .lean();
  res.json({ packages });
});

const packageUpdateSchema = z.object({
  price: priceOrNone.optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(400).optional(),
  fasting: z.string().trim().max(120).optional(),
  // Who the package is for — picked from the dashboard, used to decide which
  // photo tile(s) on the public page show this package. Empty array is valid:
  // it means "everyone," so it's left off every tile.
  audience: z.array(z.enum(["men", "women", "kids", "seniors"])).max(4).optional(),
});

dashboardCatalogRouter.patch("/packages/:code", async (req, res) => {
  const parsed = packageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).json({ error: issue.message, field: issue.path.join(".") });
  }
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to change." });
  }

  const pkg = await Package.findOneAndUpdate(
    { lab: req.labId, code: String(req.params.code) },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!pkg) return res.status(404).json({ error: "This lab does not have that package." });
  res.json({ package: pkg });
});

/* ---------- The lab's own settings ---------- */

dashboardCatalogRouter.get("/settings", async (req, res) => {
  const lab = await Lab.findById(req.labId)
    .select("-__v -createdAt -updatedAt")
    .lean();
  if (!lab) return res.status(404).json({ error: "Lab not found." });
  delete lab._id;
  res.json({ lab });
});

const slotSchema = z.object({
  label: z.string().trim().min(1).max(30),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Use a time like 07:00."),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Use a time like 11:00."),
  capacity: z.coerce.number().int().min(1).max(500),
});

const settingsSchema = z.object({
  tagline: z.string().trim().max(160).optional(),
  about: z.string().trim().max(1000).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  mapsUrl: z.string().trim().url().optional().or(z.literal("")),
  homeCollection: z.boolean().optional(),
  homeCollectionFee: z.coerce.number().min(0).max(100000).optional(),
  homeCollectionNote: z.string().trim().max(200).optional(),
  openDays: z.array(z.coerce.number().int().min(0).max(6)).min(1).max(7).optional(),
  slots: z.array(slotSchema).min(1).max(10).optional(),
  notify: z
    .object({
      whatsappOnBooking: z.boolean().optional(),
      emailOnBooking: z.boolean().optional(),
      reminderDayBefore: z.boolean().optional(),
    })
    .optional(),
});

dashboardCatalogRouter.patch("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).json({ error: issue.message, field: issue.path.join(".") });
  }
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to change." });
  }

  const update = { ...parsed.data };

  // WhatsApp must be digits only for Meta's API, so clean it rather than
  // letting a lab save "+91 99490 70916" and wonder why messages fail.
  if (typeof update.whatsapp === "string") {
    update.whatsapp = update.whatsapp.replace(/\D/g, "");
  }

  // notify is nested, so merge instead of replacing the whole object.
  if (update.notify) {
    for (const [k, v] of Object.entries(update.notify)) update[`notify.${k}`] = v;
    delete update.notify;
  }

  // Two slots with the same label would make the capacity count meaningless.
  if (update.slots) {
    const labels = update.slots.map((s) => s.label.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      return res.status(400).json({ error: "Two time slots cannot have the same name.", field: "slots" });
    }
  }

  const lab = await Lab.findByIdAndUpdate(req.labId, { $set: update }, { new: true })
    .select("-__v -createdAt -updatedAt")
    .lean();

  if (!lab) return res.status(404).json({ error: "Lab not found." });
  delete lab._id;
  res.json({ lab });
});
