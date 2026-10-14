/**
 * Phone handling.
 *
 * We store digits only, in international form, because WhatsApp needs that.
 * Validation stays deliberately loose: this product is meant to sell outside
 * India too, and a strict Indian-only rule would break the first foreign client.
 */

const CALLING_CODES = {
  IN: "91", US: "1", CA: "1", GB: "44", AE: "971", SA: "966", QA: "974",
  KW: "965", OM: "968", BH: "973", SG: "65", MY: "60", AU: "61", NZ: "64",
  ZA: "27", NG: "234", KE: "254", BD: "880", PK: "92", LK: "94", NP: "977",
  DE: "49", FR: "33", NL: "31", ES: "34", IT: "39", PH: "63", ID: "62",
};

export function callingCode(country = "IN") {
  return CALLING_CODES[String(country).toUpperCase()] || "";
}

/**
 * Turn whatever the patient typed into digits-only international form.
 * Returns null when it cannot be made sense of.
 */
export function normalisePhone(input, country = "IN") {
  if (!input) return null;
  let s = String(input).trim();

  const hadPlus = s.startsWith("+");
  s = s.replace(/\D/g, "");
  if (!s) return null;

  if (hadPlus) return s.length >= 8 && s.length <= 15 ? s : null;

  const cc = callingCode(country);

  // Already carries the country code.
  if (cc && s.startsWith(cc) && s.length > cc.length + 5) return s;

  // Local form with a trunk zero: 09949070916 -> 9949070916
  if (s.startsWith("0")) s = s.replace(/^0+/, "");

  if (!cc) return s.length >= 8 && s.length <= 15 ? s : null;

  const full = cc + s;
  return full.length >= 10 && full.length <= 15 ? full : null;
}

/** For India only, check it looks like a real mobile number. */
export function looksLikeMobile(digits, country = "IN") {
  if (!digits) return false;
  if (String(country).toUpperCase() === "IN") {
    return /^91[6-9]\d{9}$/.test(digits);
  }
  return digits.length >= 8 && digits.length <= 15;
}

/** Hide the middle, for logs and anything shown to another patient. */
export function maskPhone(digits) {
  if (!digits || digits.length < 6) return "";
  return digits.slice(0, 3) + "*".repeat(digits.length - 6) + digits.slice(-3);
}
