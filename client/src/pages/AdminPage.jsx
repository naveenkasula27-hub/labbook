import { useEffect, useState } from "react";
import { listLabs, createLab, resetLabPassword } from "../lib/dash.js";
import PasswordForm from "../components/PasswordForm.jsx";
export default function AdminPage() {
  const [labs, setLabs] = useState([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [v, setV] = useState({ name: "", slug: "", phone: "", city: "", ownerName: "", email: "", password: "" });
  const [reset, setReset] = useState({ email: "", password: "" });
  async function load() { try { setLabs((await listLabs()).labs); } catch (err) { setMessage(err.message); } }
  useEffect(() => { load(); }, []);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try { const r = await createLab(v); setMessage(`Lab created: /${r.slug}. Send the owner their login privately.`); setV({ name: "", slug: "", phone: "", city: "", ownerName: "", email: "", password: "" }); await load(); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  async function resetPassword(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try { await resetLabPassword(reset); setReset({ email: "", password: "" }); setMessage("Password reset. Existing sessions were signed out."); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  return <><h2>Lab administration</h2>{message && <p className="notice" role="status">{message}</p>}
    <section className="card"><h2>Labs</h2><ul>{labs.map(l => <li key={l._id}><a href={`/${l.slug}`}>{l.name}</a> — {l.city} ({l.active ? "active" : "inactive"})</li>)}</ul></section>
    <section className="card"><h2>Add a diagnostic lab</h2><p>Creates a booking page, owner login, and catalog with prices ready to fill in.</p><form className="form" onSubmit={submit}>
      {[["name", "Lab name"], ["slug", "Booking address (lowercase letters, numbers, hyphens)"], ["phone", "Lab phone"], ["city", "City"], ["ownerName", "Owner name"], ["email", "Owner email"], ["password", "Initial password (12–72 characters)"]].map(([key, label]) => <label key={key}>{label}<input className="input" type={key === "password" ? "password" : key === "email" ? "email" : "text"} autoComplete={key === "password" ? "new-password" : "off"} required={key !== "city"} minLength={key === "password" ? 12 : undefined} maxLength={key === "password" ? 72 : undefined} value={v[key]} onChange={e => setV({ ...v, [key]: e.target.value })} /></label>)}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Create lab"}</button></form></section>
    <section className="card"><h2>Reset a lab owner's password</h2><form className="form" onSubmit={resetPassword}>
      <label>Owner email<input className="input" type="email" required value={reset.email} onChange={e => setReset({ ...reset, email: e.target.value })} /></label>
      <label>New password<input className="input" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={reset.password} onChange={e => setReset({ ...reset, password: e.target.value })} /></label>
      <button className="btn btn-primary" disabled={busy}>Reset password and sign out sessions</button></form></section><PasswordForm /></>;
}
