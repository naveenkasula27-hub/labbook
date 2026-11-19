import { z } from "zod";
import { createRouter } from "../lib/router.js";
import { requireAuth, requireLab } from "../middleware/auth.js";
import { Enquiry, ENQUIRY_STATUSES } from "../models/Enquiry.js";

export const dashboardEnquiriesRouter = createRouter();
dashboardEnquiriesRouter.use(requireAuth, requireLab);
const listSchema = z.object({
  status: z.enum([...ENQUIRY_STATUSES, "all"]).default("new"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
dashboardEnquiriesRouter.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Choose a valid status and page." });
  const { status, page } = parsed.data;
  const filter = { lab: req.labId, ...(status === "all" ? {} : { status }) };
  const [rows, total] = await Promise.all([
    Enquiry.find(filter).select("reference name phone message status createdAt kind email preferredDate preferredTime doctorName").sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ rows, total, page, pages: Math.max(1, Math.ceil(total / 20)) });
});

dashboardEnquiriesRouter.patch("/:id", async (req, res) => {
  const parsed = z.object({ status: z.enum(ENQUIRY_STATUSES) }).safeParse(req.body);
  if (!/^[a-f0-9]{24}$/i.test(req.params.id) || !parsed.success) return res.status(400).json({ error: "Choose a valid callback request and status." });
  const row = await Enquiry.findOneAndUpdate({ _id: req.params.id, lab: req.labId }, { $set: { status: parsed.data.status } }, { new: true, runValidators: true }).select("reference name phone message status createdAt kind email preferredDate preferredTime doctorName").lean();
  if (!row) return res.status(404).json({ error: "Callback request not found." });
  res.json({ enquiry: row });
});
