/**
 * Dashboard API calls and the login token.
 *
 * The token is kept in localStorage so a lab owner is not asked to log in every
 * time they open the page. It is read and written through try/catch because a
 * private window or blocked site data makes localStorage throw.
 */
const BASE = import.meta.env.VITE_API_BASE || "/api";
const KEY = "labbook.token";

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // No storage available. The session still works until the page reloads.
  }
}

export function clearToken() {
  setToken(null);
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not reach the server. Check your internet and try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearToken();
    const err = new Error(data.error || "Please log in again.");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    err.field = data.field;
    throw err;
  }

  return data;
}

/* ---------- auth ---------- */

export async function login(email, password) {
  const data = await request("/auth/login", { method: "POST", body: { email, password } });
  setToken(data.token);
  return data;
}

export async function signup(fields) {
  const data = await request("/auth/signup", { method: "POST", body: fields });
  setToken(data.token);
  return data;
}

export const me = () => request("/auth/me");

/* ---------- bookings ---------- */

export const getSummary = () => request("/dashboard/bookings/summary");

export function getBookings(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  return request(`/dashboard/bookings?${q}`);
}

export const getBooking = (reference) =>
  request(`/dashboard/bookings/${encodeURIComponent(reference)}`);

export const setStatus = (reference, status) =>
  request(`/dashboard/bookings/${encodeURIComponent(reference)}/status`, {
    method: "PATCH",
    body: { status },
  });

export const setLabNotes = (reference, labNotes) =>
  request(`/dashboard/bookings/${encodeURIComponent(reference)}/notes`, {
    method: "PATCH",
    body: { labNotes },
  });

/* ---------- catalog ---------- */

export const getTests = () => request("/dashboard/catalog/tests");

export const updateTest = (code, changes) =>
  request(`/dashboard/catalog/tests/${encodeURIComponent(code)}`, { method: "PATCH", body: changes });

export const updatePrices = (prices) =>
  request("/dashboard/catalog/tests", { method: "PATCH", body: { prices } });

export const getPackages = () => request("/dashboard/catalog/packages");

export const updatePackage = (code, changes) =>
  request(`/dashboard/catalog/packages/${encodeURIComponent(code)}`, { method: "PATCH", body: changes });

export const getSettings = () => request("/dashboard/catalog/settings");

export const updateSettings = (changes) =>
  request("/dashboard/catalog/settings", { method: "PATCH", body: changes });

/* ---------- display helpers ---------- */

export const STATUS_LABELS = {
  new: "New",
  confirmed: "Confirmed",
  sample_collected: "Sample collected",
  report_ready: "Report ready",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Did not attend",
};

/** The next step a lab would normally take from each status. */
export const NEXT_STATUS = {
  new: "confirmed",
  confirmed: "sample_collected",
  sample_collected: "report_ready",
  report_ready: "completed",
};
