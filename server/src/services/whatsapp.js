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

export async function notifyLabOfBooking(lab, booking) {
  if (!lab.whatsapp || !lab.notify?.whatsappOnBooking) return { skipped: true };
  return sendText(lab.whatsapp, bookingLinesForLab(lab, booking));
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

  const body = [
    `${lab.name}: your booking is confirmed.`,
    `Reference: ${booking.reference}`,
    when ? `When: ${when}` : "",
    booking.visitType === "home"
      ? "Our person will come to your address."
      : `Please come to: ${lab.address || lab.name}`,
    `Questions? Call ${lab.phone}.`,
  ]
    .filter(Boolean)
    .join("\n");

  // Outside the 24 hour window this needs an approved template.
  // Swap to sendTemplate once yours is approved by Meta.
  return sendText(booking.patient.phone, body);
}

/** fastingNote is worked out by the caller, which has the Test rows to hand. */
export async function remindPatient(lab, booking, fastingNote = "") {
  // A sample lab never sends reminders. A message saying "reminder for
  // tomorrow" the morning after somebody poked at a demo is the worst version
  // of this problem.
  if (lab.isDemo) return { skipped: true };

  const body = [
    `${lab.name}: reminder for tomorrow.`,
    `Reference: ${booking.reference}`,
    [booking.date, booking.slot].filter(Boolean).join(", "),
    booking.visitType === "home"
      ? "Our person will come to your address."
      : `Please come to: ${lab.address || lab.name}`,
    fastingNote,
  ]
    .filter(Boolean)
    .join("\n");
  return sendText(booking.patient.phone, body);
}

export async function reportReady(lab, booking) {
  const body = [
    `${lab.name}: your report is ready.`,
    `Reference: ${booking.reference}`,
    `Collect it at the lab or call ${lab.phone}.`,
  ].join("\n");
  return sendText(booking.patient.phone, body);
}
