import crypto from "node:crypto";

// No 0/O/1/I/L, so a reference read out over the phone is not misheard.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * A short booking reference the patient can quote: "NDU-7K3QX".
 * Random, not sequential, so one lab cannot guess another's volume.
 */
export function makeReference(labSlug = "lab", length = 5) {
  const prefix = labSlug.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "LAB";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${out}`;
}
