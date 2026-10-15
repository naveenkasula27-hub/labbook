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

    /**
     * Which place in the slot this booking holds, counting from 0.
     *
     * Two people pressing Book at the same moment used to be able to take the
     * same last place, because the old code counted the bookings and then wrote
     * a new one, with a gap in between. Now each booking claims a numbered
     * place, and the unique index below makes the database refuse the second
     * claim on the same number. Capacity is enforced by never handing out a
     * number at or above it.
     *
     * Null for bookings with no date or no slot, which hold nothing.
     */
    seat: { type: Number, default: null },

    /**
     * Whether this booking currently occupies its place.
     *
     * False once cancelled or marked no-show, which frees the place for
     * somebody else. Also false for bookings with no date or slot, so those
     * stay out of the unique index entirely.
     */
    holdsSlot: { type: Boolean, default: false },

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

/**
 * One booking per place, per slot, per date, per lab.
 *
 * This is what actually stops double booking: the check happens inside the
 * database, on the write itself, so two requests arriving in the same
 * millisecond cannot both succeed. The partial filter keeps cancelled
 * bookings and bookings with no slot out of it, so they neither hold a place
 * nor collide with each other.
 */
bookingSchema.index(
  { lab: 1, date: 1, slot: 1, seat: 1 },
  { unique: true, partialFilterExpression: { holdsSlot: true } }
);

export const Booking = mongoose.model("Booking", bookingSchema);
