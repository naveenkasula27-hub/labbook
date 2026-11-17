import { getToken } from "./dash.js";
const BASE = import.meta.env.VITE_API_BASE || "/api";
async function call(path, options) {
  const res = await fetch(BASE + "/reports" + path, { cache: "no-store", ...options });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Could not access the report."); }
  return res;
}
async function save(res) {
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a"); a.href = url; a.download = "lab-report.pdf"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const auth = () => ({ Authorization: `Bearer ${getToken()}` });
export async function uploadReport(reference, file) {
  if (file.size > 2 * 1024 * 1024 || file.size === 0) throw new Error("Choose a PDF up to 2 MB.");
  await call(`/dashboard/${encodeURIComponent(reference)}`, { method: "PUT", headers: { ...auth(), "Content-Type": "application/pdf" }, body: file });
}
export async function downloadLabReport(reference) { await save(await call(`/dashboard/${encodeURIComponent(reference)}`, { headers: auth() })); }
export async function deleteReport(reference) { await call(`/dashboard/${encodeURIComponent(reference)}`, { method: "DELETE", headers: auth() }); }
export async function downloadPatientReport(slug, reference, phone) {
  await save(await call(`/public/${encodeURIComponent(slug)}/${encodeURIComponent(reference)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) }));
}
