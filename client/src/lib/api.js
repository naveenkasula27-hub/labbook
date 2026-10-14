const BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Could not reach the lab's system. Check your internet and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.field = data.field;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getLab = (slug) => request(`/public/${slug}`);

export const getAvailability = (slug, date) =>
  request(`/public/${slug}/availability?date=${encodeURIComponent(date)}`);

export const createBooking = (slug, body) =>
  request(`/public/${slug}/bookings`, { method: "POST", body: JSON.stringify(body) });

export const findBooking = (slug, reference, phone) =>
  request(`/public/${slug}/bookings/${encodeURIComponent(reference)}?phone=${encodeURIComponent(phone)}`);

/** Money in the lab's own currency and language. */
export function money(amount, lab) {
  if (amount === null || amount === undefined) return "";
  try {
    return new Intl.NumberFormat(lab?.locale || "en-IN", {
      style: "currency",
      currency: lab?.currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

/** "Wed, 15 Oct" in the lab's language. */
export function prettyDate(dateStr, lab) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat(lab?.locale || "en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: lab?.timezone || "Asia/Kolkata",
    }).format(new Date(`${dateStr}T12:00:00Z`));
  } catch {
    return dateStr;
  }
}

/** Today in the lab's time zone, so the date picker does not allow yesterday. */
export function todayForLab(lab) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: lab?.timezone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
