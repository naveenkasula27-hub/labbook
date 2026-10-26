/**
 * Sends ONE appointment_reminder to a number you choose, with sample values,
 * so you can see exactly what patients will receive. Touches no database.
 *
 *   node src/jobs/send-test-reminder.js 917729069137
 *
 * The number needs the country code and no "+" or spaces.
 */
import { config } from "../config.js";
import { reminderParams, sendReminder, REMINDER_TEMPLATE, TEMPLATE_LANG } from "../services/whatsapp.js";

const to = (process.argv[2] || "").replace(/[^0-9]/g, "");
if (!/^\d{10,15}$/.test(to)) {
  console.error("Give the number with country code, e.g. 917729069137");
  process.exit(1);
}
if (!config.whatsapp.enabled) {
  console.error("WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set.");
  process.exit(1);
}

const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
  new Date(Date.now() + 86400000)
);
const lab = { name: "Test Lab", address: "Main Road, Ramayampet", phone: "77290 69137" };
const booking = { reference: "LB-TEST-001", date: tomorrow, slot: "Morning", visitType: "lab" };
const params = reminderParams(lab, booking, "Fasting needed: 10 to 12 hours");

console.log(`Template: ${REMINDER_TEMPLATE} (${TEMPLATE_LANG})`);
console.log("Values:", params);

try {
  const res = await sendReminder(to, params);
  console.log("Sent. Meta replied:", JSON.stringify(res));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
