import express from "express";
import { createRouter } from "../lib/router.js";
import { requireAuth, requireLab } from "../middleware/auth.js";
import { sharedLimit } from "../middleware/rate-limit.js";
import { Booking } from "../models/Booking.js";
import { Lab } from "../models/Lab.js";
import { Report } from "../models/Report.js";
import { normalisePhone } from "../lib/phone.js";
export const reportsRouter = createRouter();
const limit = sharedLimit("reports", 20, 10 * 60 * 1000, "Too many report requests. Try again later.");
function download(res, report) {
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="lab-report.pdf"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(report.data);
}
reportsRouter.put("/dashboard/:reference", requireAuth, requireLab,
  express.raw({ type: "application/pdf", limit: "2mb" }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 8 || req.body.subarray(0, 5).toString() !== "%PDF-") {
    return res.status(400).json({ error: "Choose a PDF report, up to 2 MB." });
  }
  const reference = String(req.params.reference).toUpperCase();
  const booking = await Booking.findOne({ lab: req.labId, reference }).lean();
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  await Report.findOneAndUpdate({ lab: req.labId, reference },
    { $set: { data: req.body, uploadedBy: req.user._id } }, { upsert: true, new: true, runValidators: true });
  res.json({ uploaded: true });
});
reportsRouter.get("/dashboard/:reference", requireAuth, requireLab, async (req, res) => {
  const report = await Report.findOne({ lab: req.labId, reference: String(req.params.reference).toUpperCase() }).select("+data");
  if (!report) return res.status(404).json({ error: "No report uploaded yet." });
  download(res, report);
});
reportsRouter.delete("/dashboard/:reference", requireAuth, requireLab, async (req, res) => {
  await Report.deleteOne({ lab: req.labId, reference: String(req.params.reference).toUpperCase() });
  res.json({ deleted: true });
});
// Report downloads require the complete phone number, not the four-digit status check.
reportsRouter.post("/public/:slug/:reference", limit, async (req, res) => {
  const lab = await Lab.findOne({ slug: String(req.params.slug).toLowerCase(), active: true }).lean();
  const phone = typeof req.body?.phone === "string" && lab ? normalisePhone(req.body.phone, lab.country) : null;
  const reference = String(req.params.reference).toUpperCase();
  const booking = phone && lab ? await Booking.findOne({ lab: lab._id, reference, "patient.phone": phone }).lean() : null;
  if (!booking || !["report_ready", "completed"].includes(booking.status)) return res.status(404).json({ error: "Report unavailable. Check your reference and full booking phone number, or contact the lab." });
  const report = await Report.findOne({ lab: lab._id, reference }).select("+data");
  if (!report) return res.status(404).json({ error: "No report uploaded yet. Contact the lab." });
  download(res, report);
});
