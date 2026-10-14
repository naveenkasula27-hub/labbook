import "dotenv/config";

const isProduction = (process.env.NODE_ENV || "development") === "production";

/**
 * Read a setting. The fallback applies while developing only: in production a
 * missing setting stops the server rather than quietly running on a default,
 * because a live site silently pointed at a local database is worse than a
 * site that refuses to start.
 */
const required = (name, devFallback) => {
  const v = process.env[name];
  if (v !== undefined && v !== "") return v;

  if (isProduction) {
    throw new Error(
      `Missing ${name}. Set it in your hosting provider's environment variables.`
    );
  }
  if (devFallback === undefined) {
    throw new Error(`Missing ${name} in .env — copy .env.example to .env and fill it in.`);
  }
  return devFallback;
};

export const config = {
  port: Number(process.env.PORT || 4000),
  env: process.env.NODE_ENV || "development",
  isProduction,

  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/labbook"),
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),

  /**
   * Which websites are allowed to call this API. Comma separated, because a
   * Vercel project has both a main address and a different one per deployment.
   */
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174",

  // Bookings allowed from one IP per 10 minutes. Kept generous on purpose:
  // a whole village may share one mobile network address, and a family
  // booking for four people must not be mistaken for spam.
  bookingRateLimit: Number(process.env.BOOKING_RATE_LIMIT || 20),

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    get enabled() {
      return Boolean(this.phoneNumberId && this.accessToken);
    },
  },
};

if (isProduction && config.jwtSecret === "dev-only-insecure-secret") {
  throw new Error("Set a real JWT_SECRET before running in production.");
}

if (isProduction && /127\.0\.0\.1|localhost/.test(config.mongoUri)) {
  throw new Error(
    "MONGODB_URI points at a local database, which cannot work on a hosted server. " +
      "Use your MongoDB Atlas connection string."
  );
}
