import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "new",
  "confirmed",
  "sample_collected",
  "report_ready",
  "completed",
  "cancelled",
  "no_show",
];

const itemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["test", "package"], required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },   // copied in, so a later rename doesn't rewrite history
    price: { type: Number, default: null },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    reference: { type: String, required: true, unique: true }, // "NDU-7K3QX" — what the patient quotes

    patient: {
      name: { type: String, required: true, trim: true },
      age: { type: Number, required: true },
      gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
      phone: { type: String, required: true },      // digits only, international
      email: { type: String, default: "" },
    },

    visitType: { type: String, enum: ["lab", "home"], default: "lab" },
    address: { type: String, default: "" },

    items: { type: [itemSchema], default: [] },
    notes: { type: String, default: "" },      // what the patient wrote
    labNotes: { type: String, default: "" },   // the lab's own notes, never shown to the patient
    estimatedTotal: { type: Number, default: null },
    currency: { type: String, default: "INR" },

    date: { type: String, default: "" },          // "2026-10-15", the lab's local date
    slot: { type: String, default: "" },          // slot label

    status: { type: String, enum: BOOKING_STATUSES, default: "new", index: true },
    statusLog: {
      type: [
        {
          status: { type: String, enum: BOOKING_STATUSES },
          at: { type: Date, default: Date.now },
          by: { type: String, default: "system" },
          _id: false,
        },
      ],
      default: [],
    },

    source: { type: String, enum: ["web", "whatsapp", "phone", "walkin"], default: "web" },
    consent: { type: Boolean, default: false },

    messages: {
      labNotified: { type: Boolean, default: false },
      patientConfirmed: { type: Boolean, default: false },
      reminderSent: { type: Boolean, default: false },
      reportNotified: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ lab: 1, date: 1 });
bookingSchema.index({ lab: 1, createdAt: -1 });
bookingSchema.index({ lab: 1, "patient.phone": 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
