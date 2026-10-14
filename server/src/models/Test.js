import mongoose from "mongoose";

/**
 * One test offered by one lab. The catalog seed gives every new lab a starting
 * set; the lab then edits names, prices and what it actually offers.
 */
const testSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },

    code: { type: String, required: true, trim: true },  // "cbc" — stable id within a lab
    name: { type: String, required: true, trim: true },  // "Complete Blood Count (CBC)"
    alias: { type: String, default: "" },                // what patients call it locally
    category: { type: String, required: true, trim: true },
    sample: {
      type: String,
      enum: ["Blood", "Urine", "Stool", "Swab", "Sputum", "Scan", "Other"],
      default: "Blood",
    },
    price: { type: Number, default: null },              // null = "ask the lab"
    fasting: { type: String, default: "" },              // "10 to 12 hours fasting"
    reportTime: { type: String, default: "" },           // "Same day"
    homeCollectable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testSchema.index({ lab: 1, code: 1 }, { unique: true });
testSchema.index({ lab: 1, name: "text", alias: "text" });

export const Test = mongoose.model("Test", testSchema);
