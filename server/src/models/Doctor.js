import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
const schema = new mongoose.Schema({
  lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true },
  code: { type: String, default: () => `doc-${randomBytes(6).toString("hex")}`, required: true },
  name: { type: String, trim: true, required: true, maxlength: 80 },
  specialty: { type: String, trim: true, required: true, maxlength: 80 },
  qualifications: { type: String, trim: true, default: "", maxlength: 160 },
  description: { type: String, trim: true, default: "", maxlength: 300 },
  fee: { type: Number, default: null, min: 0 },
  portrait: { type: String, enum: ["general", "womens", "specialist"], default: "general" },
  photoUrl: { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ lab: 1, code: 1 }, { unique: true });
export const Doctor = mongoose.model("Doctor", schema);
