import { useState } from "react";
import { changePassword } from "../lib/dash.js";
export default function PasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(e) {
    e.preventDefault(); setMessage("");
    if (newPassword !== confirm) return setMessage("The new passwords do not match.");
    setBusy(true);
    try { await changePassword(currentPassword, newPassword); setCurrent(""); setNew(""); setConfirm(""); setMessage("Password changed. Your other sessions have been signed out."); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  return <section className="card"><h2>Change password</h2><form className="form" onSubmit={save}>
    <label>Current password<input className="input" type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrent(e.target.value)} /></label>
    <label>New password (12–72 characters)<input className="input" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={newPassword} onChange={e => setNew(e.target.value)} /></label>
    <label>Confirm new password<input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
    {message && <p role="status">{message}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
  </form></section>;
}
