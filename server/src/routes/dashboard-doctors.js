import { z } from "zod";
import { createRouter } from "../lib/router.js";
import { requireAuth, requireLab } from "../middleware/auth.js";
import { Doctor } from "../models/Doctor.js";
export const dashboardDoctorsRouter = createRouter();
dashboardDoctorsRouter.use(requireAuth, requireLab);
const schema = z.object({
  name: z.string().trim().min(2).max(80), specialty: z.string().trim().min(2).max(80),
  qualifications: z.string().trim().max(160).default(""), description: z.string().trim().max(300).default(""),
  fee: z.number().min(0).max(1000000).nullable().default(null),
  portrait: z.enum(["general", "womens", "specialist"]).default("general"),
  photoUrl: z.string().trim().max(500).refine((value) => !value || /^https:\/\//i.test(value) || /^\/images\/[a-z0-9_./-]+$/i.test(value), "Use an HTTPS photo URL or a local /images/ path.").default(""),
  active: z.boolean().default(true),
});
dashboardDoctorsRouter.get("/", async (req, res) => {
  const doctors = await Doctor.find({ lab: req.labId }).sort({ name: 1 }).lean();
  res.json({ doctors });
});
dashboardDoctorsRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const doctor = await Doctor.create({ ...parsed.data, lab: req.labId });
  res.status(201).json({ doctor });
});
dashboardDoctorsRouter.patch("/:code", async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success || !/^[a-z0-9-]{4,50}$/.test(req.params.code)) return res.status(400).json({ error: "Enter valid doctor details." });
  const doctor = await Doctor.findOneAndUpdate({ lab: req.labId, code: req.params.code }, { $set: parsed.data }, { new: true, runValidators: true }).lean();
  if (!doctor) return res.status(404).json({ error: "Doctor profile not found." });
  res.json({ doctor });
});
