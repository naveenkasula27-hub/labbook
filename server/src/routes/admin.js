import mongoose from "mongoose";
import { z } from "zod";
import { createRouter } from "../lib/router.js";
import { requireAuth } from "../middleware/auth.js";
import { Lab } from "../models/Lab.js";
import { User } from "../models/User.js";
import { Test } from "../models/Test.js";
import { Package } from "../models/Package.js";
import { CATALOG, PACKAGE_TEMPLATES } from "../seed/catalog.js";
export const adminRouter = createRouter();
adminRouter.use(requireAuth, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access required." });
  next();
});
adminRouter.get("/labs", async (req, res) => {
  const labs = await Lab.find({}).select("name slug active city").sort({ name: 1 }).lean();
  res.json({ labs });
});
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(50)
    .refine((s) => !["api", "dashboard", "privacy", "terms", "admin"].includes(s), "That address is reserved."),
  phone: z.string().trim().min(6).max(30), city: z.string().trim().max(80).default(""),
  ownerName: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128).refine(v => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes."),
});
adminRouter.post("/labs", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const v = parsed.data;
  const hash = await User.hashPassword(v.password);
  // All-or-nothing onboarding; MongoDB Atlas supports transactions.
  const session = await mongoose.startSession();
  let slug;
  try {
    await session.withTransaction(async () => {
      const [lab] = await Lab.create([{ name: v.name, slug: v.slug, phone: v.phone, city: v.city }], { session });
      await User.create([{ lab: lab._id, name: v.ownerName, email: v.email, passwordHash: hash, role: "owner" }], { session });
      await Test.insertMany(CATALOG.map((t, sort) => ({ ...t, lab: lab._id, sort, price: null, active: true })), { session });
      await Package.insertMany(PACKAGE_TEMPLATES.map((t, sort) => ({ ...t, lab: lab._id, sort, price: null, active: true })), { session });
      slug = lab.slug;
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That lab address or email is already in use." });
    throw err;
  } finally { await session.endSession(); }
  res.status(201).json({ slug });
});
adminRouter.post("/reset-password", async (req, res) => {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(12).max(128).refine(v => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes.") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter an email and a password of at least 12 characters and at most 72 UTF-8 bytes." });
  const user = await User.findOneAndUpdate({ email: parsed.data.email, role: { $in: ["owner", "staff"] } },
    { $set: { passwordHash: await User.hashPassword(parsed.data.password) }, $inc: { sessionVersion: 1 } }, { new: true });
  if (!user) return res.status(404).json({ error: "Lab user not found." });
  res.json({ reset: true });
});
