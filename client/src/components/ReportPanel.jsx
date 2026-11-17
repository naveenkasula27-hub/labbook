import { useState } from "react";
import { uploadReport, downloadLabReport, deleteReport } from "../lib/reports.js";
export default function ReportPanel({ reference }) {
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function act(fn, success) { setBusy(true); setMessage(""); try { await fn(); setMessage(success); } catch (e) { setMessage(e.message); } finally { setBusy(false); } }
  return <section><h3>Patient report</h3><p className="muted small">Upload a PDF up to 2 MB. Uploading replaces the previous report. Mark the booking report ready when the patient can download it.</p>
    <label>PDF report<input className="input" type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files[0] || null)} /></label>
    <div className="row-gap"><button type="button" className="btn btn-primary btn-sm" disabled={busy || !file} onClick={() => act(() => uploadReport(reference, file), "Report uploaded.")}>Upload report</button>
    <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act(() => downloadLabReport(reference), "Report downloaded.")}>Download report</button>
    <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { if (window.confirm("Delete the uploaded report?")) act(() => deleteReport(reference), "Report deleted."); }}>Delete report</button></div>
    {message && <p role="status">{message}</p>}</section>;
}
