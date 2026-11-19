import mongoose from "mongoose";
import { randomBytes } from "node:crypto";

export const ENQUIRY_STATUSES = ["new", "contacted", "closed"];
const schema = new mongoose.Schema({
  lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
  reference: { type: String, required: true, unique: true, default: () => `CB-${randomBytes(6).toString("hex").toUpperCase()}` },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true },
  message: { type: String, default: "", maxlength: 300 },
  status: { type: String, enum: ENQUIRY_STATUSES, default: "new" },
}, { timestamps: true });
schema.index({ lab: 1, status: 1, createdAt: -1 });
export const Enquiry = mongoose.model("Enquiry", schema);
