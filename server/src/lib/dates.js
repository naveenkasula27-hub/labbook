/**
 * Dates are handled in each lab's own time zone.
 *
 * A booking date is stored as a plain "YYYY-MM-DD" string, which is what the
 * patient and the lab both mean by "the 15th". Storing a UTC timestamp instead
 * makes a morning booking in Dubai land on the previous day in the database.
 */

/** Today's date in a lab's time zone, as YYYY-MM-DD. */
export function todayInZone(timeZone = "Asia/Kolkata") {
  return dateInZone(new Date(), timeZone);
}

/** Any instant, as the YYYY-MM-DD it falls on in that zone. */
export function dateInZone(instant, timeZone = "Asia/Kolkata") {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant);
  } catch {
    // Unknown zone: fall back to UTC rather than throwing.
    return instant.toISOString().slice(0, 10);
  }
}

/** Tomorrow in a lab's time zone. */
export function tomorrowInZone(timeZone = "Asia/Kolkata") {
  return addDays(todayInZone(timeZone), 1);
}

/** Shift a YYYY-MM-DD string by whole days. */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "Wed, 15 Oct 2026" in the lab's language and zone. */
export function prettyDate(dateStr, locale = "en-IN", timeZone = "Asia/Kolkata") {
  if (!isValidDateStr(dateStr)) return dateStr || "";
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateStr}T12:00:00Z`));
  } catch {
    return dateStr;
  }
}
