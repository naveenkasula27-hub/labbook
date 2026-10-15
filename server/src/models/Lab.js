import mongoose from "mongoose";

/**
 * A Lab is one tenant. Everything else in the database points at a lab,
 * so two labs on the same server never see each other's data.
 */
const slotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },   // "Morning"
    start: { type: String, required: true },   // "07:00"
    end: { type: String, required: true },     // "11:00"
    capacity: { type: Number, default: 20 },   // bookings allowed in this slot per day
  },
  { _id: false }
);

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, default: "" },
    about: { type: String, default: "" },

    /**
     * A sample lab rather than a real business.
     *
     * The booking page puts a notice at the top when this is on, so visitors
     * know not to enter real personal details and nobody mistakes the page for
     * a business that exists.
     */
    isDemo: { type: Boolean, default: false },

    phone: { type: String, required: true },          // local format, shown on the page
    whatsapp: { type: String, default: "" },          // full international, digits only: 919949070916
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    mapsUrl: { type: String, default: "" },

    // What makes this sellable outside India.
    country: { type: String, default: "IN" },         // ISO 3166-1 alpha-2
    currency: { type: String, default: "INR" },       // ISO 4217
    locale: { type: String, default: "en-IN" },
    timezone: { type: String, default: "Asia/Kolkata" }, // IANA name

    homeCollection: { type: Boolean, default: true },
    homeCollectionFee: { type: Number, default: 0 },
    homeCollectionNote: { type: String, default: "" },

    openDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0 = Sunday
    slots: { type: [slotSchema], default: () => [
      { label: "Morning", start: "07:00", end: "11:00", capacity: 20 },
      { label: "Afternoon", start: "11:00", end: "16:00", capacity: 20 },
      { label: "Evening", start: "16:00", end: "20:00", capacity: 20 },
    ] },

    theme: {
      primary: { type: String, default: "#0f766e" },  // header, headings
      accent: { type: String, default: "#0ea5e9" },   // links and small highlights

      /**
       * The colour of the buttons people press, when it should differ from the
       * header. Empty means use the header colour, which is how every lab
       * behaved before this existed. A brand that keeps one colour for actions,
       * like an orange on a navy header, sets it here.
       */
      cta: { type: String, default: "" },
    },
    logoUrl: { type: String, default: "" },
    photos: { type: [String], default: [] },

    plan: { type: String, enum: ["trial", "basic", "pro"], default: "trial" },
    active: { type: Boolean, default: true },

    notify: {
      whatsappOnBooking: { type: Boolean, default: true },
      emailOnBooking: { type: Boolean, default: false },
      reminderDayBefore: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Lab = mongoose.model("Lab", labSchema);
