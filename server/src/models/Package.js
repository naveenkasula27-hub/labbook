import mongoose from "mongoose";

/** A bundle of tests at one price — "Full Body Checkup", "Fever Panel". */
const packageSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    testCodes: { type: [String], default: [] },   // Test.code values within the same lab
    price: { type: Number, default: null },
    fasting: { type: String, default: "" },
    // Who this package is meant for, set by the lab owner in the dashboard.
    // Drives the photo category tiles on the public page ("Men", "Women",
    // "Kids", "Seniors"). "Everyone" (or left empty) means it doesn't belong
    // under any one tile — it still shows in the normal package list.
    audience: {
      type: [String],
      enum: ["men", "women", "kids", "seniors"],
      default: [],
    },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

packageSchema.index({ lab: 1, code: 1 }, { unique: true });

export const Package = mongoose.model("Package", packageSchema);
