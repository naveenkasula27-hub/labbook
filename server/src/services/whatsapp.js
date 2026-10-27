/**
 * WhatsApp through Meta's Cloud API, called straight from this server.
 *
 * No n8n, no Zapier, no middleman. One POST per message.
 *
 * While WHATSAPP_ACCESS_TOKEN is blank, every send is skipped and logged
 * instead, so the whole app runs and can be demoed without a Meta account.
 *
 * Note on templates: Meta only allows free-form text within 24 hours of the
 * person messaging you. A booking confirmation or a reminder we send first
 * must use an approved template. sendTemplate() is for those.
 */
import { config } from "../config.js";

const GRAPH = "https://graph.facebook.com/v21.0";

async function post(body) {
  if (!config.whatsapp.enabled) {
    console.log("[whatsapp skipped — no token]", JSON.stringify(body));
    return { skipped: true };
  }

  const res = await fetch(`${GRAPH}/${config.whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(`WhatsApp send failed (${res.status}): ${msg}`);
  }
  return data;
}

/** Plain text. Only valid inside a 24 hour window opened by the person. */
export function sendText(to, body) {
  return post({ to, type: "text", text: { preview_url: false, body } });
}

/** An approved template, for messages we start. */
export function sendTemplate(to, name, languageCode, bodyParams = []) {
  return post({
    to,
    type: "template",
    template: {
      name,
      language: { code: languageCode },
      components: bodyParams.length
        ? [{ type: "body", parameters: bodyParams.map((t) => ({ type: "text", text: String(t) })) }]
        : [],
    },
  });
}

/* ---------- The messages this app actually sends ---------- */

export function bookingLinesForLab(lab, booking) {
  const items = booking.items.map((i) => i.name).join(", ") || "see notes";
  const when = [booking.date, booking.slot].filter(Boolean).join(", ") || "not chosen";
  const lines = [
    `New booking — ${booking.reference}`,
    `${booking.patient.name}, ${booking.patient.age} ${booking.patient.gender}`,
    `Phone: ${booking.patient.phone}`,
    `Tests: ${items}`,
    `Sample: ${booking.visitType === "home" ? "Home collection" : "At the lab"}`,
  ];
  if (booking.visitType === "home" && booking.address) lines.push(`Address: ${booking.address}`);
  lines.push(`When: ${when}`);
  if (booking.notes) lines.push(`Notes: ${booking.notes}`);
  return lines.join("\n");
}

// Approved 27 Oct 2026. Its body has seven slots: {{1}} lab name, {{2}}
// patient name, {{3}} age, {{4}} gender, {{5}} patient phone, {{6}} tests,
// {{7}} when. A plain-text alert to the lab owner has the same 24-hour-window
// problem the reminder had, so this is a template too — it has nothing to do
// with whether the number belongs to the lab or a stranger.
export const NEW_BOOKING_ALERT_TEMPLATE =
  process.env.WHATSAPP_NEW_BOOKING_ALERT_TEMPLATE || "new_booking_alert";

function newBookingAlertParams(lab, booking) {
  const items = booking.items.map((i) => i.name).join(", ") || "see notes";
  const when = [booking.date, booking.slot].filter(Boolean).join(", ") || "not chosen";
  return [
    param(lab.name),
    param(booking.patient.name),
    param(booking.patient.age),
    param(booking.patient.gender),
    param(booking.patient.phone),
    param(items),
    param(when),
  ];
}

export async function notifyLabOfBooking(lab, booking) {
  if (!lab.whatsapp || !lab.notify?.whatsappOnBooking) return { skipped: true };
  return sendTemplate(lab.whatsapp, NEW_BOOKING_ALERT_TEMPLATE, TEMPLATE_LANG, newBookingAlertParams(lab, booking));
}

export async function confirmToPatient(lab, booking) {
  const when = [booking.date, booking.slot].filter(Boolean).join(", ");

  // On a sample lab the message must not read like a real appointment. Someone
  // who gets "please come to Main Road" and acts on it has wasted a trip, and
  // the notice on the page is easy to scroll past.
  if (lab.isDemo) {
    const body = [
      `This is a demo of a lab booking page. Nothing has been booked.`,
      `${lab.name} is a sample lab, not a real business, so no appointment`,
      `exists and nobody is expecting you.`,
      ``,
      `Reference: ${booking.reference}`,
      when ? `Slot you picked: ${when}` : "",
      ``,
      `Built by UnityWebWorks. Questions? Call ${lab.phone}.`,
    ]
      .filter((line) => line !== undefined)
      .join("\n");
    return sendText(booking.patient.phone, body);
  }

  // Approved 27 Oct 2026. Its body has five slots: {{1}} lab name, {{2}}
  // booking reference, {{3}} tests, {{4}} where to go / what happens next,
  // {{5}} lab phone. A patient booking through the website has never
  // messaged this WhatsApp number, so it's always outside the 24-hour
  // window — this has to be a template, not plain text.
  const items = booking.items.map((i) => i.name).join(", ") || "see notes";
  const where =
    booking.visitType === "home"
      ? "Our person will come to your address."
      : `Please come to ${lab.address || lab.name}.`;
  return sendTemplate(booking.patient.phone, BOOKING_CONFIRMATION_TEMPLATE, TEMPLATE_LANG, [
    param(lab.name),
    param(booking.reference),
    param(items),
    param(where),
    param(lab.phone),
  ]);
}

// Approved 27 Oct 2026, same shape as appointment_reminder's body but for the
// moment of booking rather than the day before.
export const BOOKING_CONFIRMATION_TEMPLATE =
  process.env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE || "booking_confirmation";

/* ---------- Day-before reminder (approved template) ---------- */

// The reminder is a message we start, so it has to use a Meta-approved
// template. "appointment_reminder" was approved on 25 Oct 2026. Its body has
// five slots: {{1}} lab name, {{2}} booking reference, {{3}} date and slot,
// {{4}} where to come / fasting, {{5}} lab phone.
// Both can be overridden from the environment without a code change.
export const REMINDER_TEMPLATE = process.env.WHATSAPP_REMINDER_TEMPLATE || "appointment_reminder";
export const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en";

/**
 * Meta rejects a template parameter that is empty or contains new lines, tabs
 * or more than four spaces in a row, so every value is cleaned first.
 */
function param(text, fallback = "-") {
  const clean = String(text ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  return (clean || fallback).slice(0, 900);
}

/** "2026-10-27" -> "27 Oct 2026". Anything else is passed through. */
function prettyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** The five values for the appointment_reminder template, in order. */
export function reminderParams(lab, booking, fastingNote = "") {
  const when = [prettyDate(booking.date), booking.slot].filter(Boolean).join(", ");
  const where =
    booking.visitType === "home"
      ? "Our person will come to your address."
      : `Please come to ${lab.address || lab.name}.`;
  const note = [where, fastingNote ? `${fastingNote}.` : ""].filter(Boolean).join(" ");
  return [
    param(lab.name),
    param(booking.reference),
    param(when, "tomorrow"),
    param(note, "No special preparation needed."),
    param(lab.phone || lab.whatsapp, lab.name),
  ];
}

/** Sends the approved reminder template with ready-made parameters. */
export function sendReminder(to, params) {
  return sendTemplate(to, REMINDER_TEMPLATE, TEMPLATE_LANG, params);
}

/** fastingNote is worked out by the caller, which has the Test rows to hand. */
export async function remindPatient(lab, booking, fastingNote = "") {
  // A sample lab never sends reminders. A message saying "reminder for
  // tomorrow" the morning after somebody poked at a demo is the worst version
  // of this problem.
  if (lab.isDemo) return { skipped: true };
  // The lab can switch day-before reminders off in Settings.
  if (lab.notify?.reminderDayBefore === false) return { skipped: true };

  return sendReminder(booking.patient.phone, reminderParams(lab, booking, fastingNote));
}

// Approved 27 Oct 2026. Its body has three slots: {{1}} lab name, {{2}}
// booking reference, {{3}} lab phone. Same 24-hour-window reasoning as the
// other two — this is a message we start, so it needs a template.
export const REPORT_READY_TEMPLATE =
  process.env.WHATSAPP_REPORT_READY_TEMPLATE || "report_ready";

export async function reportReady(lab, booking) {
  return sendTemplate(booking.patient.phone, REPORT_READY_TEMPLATE, TEMPLATE_LANG, [
    param(lab.name),
    param(booking.reference),
    param(lab.phone),
  ]);
}
