import mongoose from "mongoose";
const schema = new mongoose.Schema({
  lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
  reference: { type: String, required: true },
  data: { type: Buffer, required: true, select: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
schema.index({ lab: 1, reference: 1 }, { unique: true });
export const Report = mongoose.model("Report", schema);
