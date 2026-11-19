import { useEffect, useState } from "react";
import { getDoctors, saveDoctor } from "../lib/dash.js";
const blank = { name: "", specialty: "", qualifications: "", description: "", fee: "", portrait: "general", photoUrl: "", active: true };
export default function DoctorsPage() {
  const [rows, setRows] = useState([]), [values, setValues] = useState(blank), [code, setCode] = useState("");
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  async function load() { setLoading(true); try { setRows((await getDoctors()).doctors); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  function edit(doctor) { setCode(doctor.code); setValues({ ...blank, ...doctor, fee: doctor.fee ?? "" }); setSuccess(""); document.getElementById("doctor-name")?.focus(); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try { await saveDoctor(code, { ...values, fee: values.fee === "" ? null : Number(values.fee) }); setCode(""); setValues(blank); setSuccess("Doctor profile saved."); await load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  return <section><h2>Doctor profiles</h2><p className="muted">Add the doctors who actually consult with your lab or clinic. Patients request a preferred date and time; your team confirms the appointment.</p>
    {error && <p className="err" role="alert">{error}</p>}{success && <p role="status">{success}</p>}
    <div className="card"><h3>{code ? "Edit doctor" : "Add a doctor"}</h3><form className="form" onSubmit={submit}>
      <div className="two"><label className="field-label">Doctor name<input id="doctor-name" className="input" value={values.name} onChange={set("name")} minLength={2} maxLength={80} required /></label><label className="field-label">Specialty<input className="input" value={values.specialty} onChange={set("specialty")} minLength={2} maxLength={80} required /></label></div>
      <label className="field-label">Qualifications (optional)<input className="input" value={values.qualifications} onChange={set("qualifications")} maxLength={160} /></label>
      <label className="field-label">Introduction (optional)<textarea className="textarea" value={values.description} onChange={set("description")} maxLength={300} /></label>
      <div className="two"><label className="field-label">Consultation fee (leave blank to confirm directly)<input className="input" type="number" min="0" max="1000000" value={values.fee} onChange={set("fee")} /></label><label className="field-label">Illustrative AI portrait<select className="select" value={values.portrait} onChange={set("portrait")}><option value="general">Portrait 1</option><option value="womens">Portrait 2</option><option value="specialist">Portrait 3</option></select></label></div>
      <label className="field-label">Real doctor photo URL (optional)<input className="input" placeholder="https://… or /images/doctors/…" value={values.photoUrl} onChange={set("photoUrl")} maxLength={500} /></label>
      <p className="muted small">Until a real photo is added, the booking page labels the AI portrait as illustrative.</p>
      <label className="check"><input type="checkbox" checked={values.active} onChange={set("active")} />Show this profile on the booking page</label>
      <div><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save doctor profile"}</button>{code && <button type="button" className="btn btn-ghost" onClick={() => { setValues(blank); setCode(""); }}>Cancel edit</button>}</div>
    </form></div>
    {loading ? <p role="status">Loading profiles…</p> : !rows.length ? <p>No real doctor profiles yet. Sample profiles appear only on a demo lab.</p> : rows.map((doctor) => <article className="card" key={doctor.code}><h3>{doctor.name}</h3><p>{doctor.specialty} · {doctor.active ? "Visible" : "Hidden"}</p><button type="button" className="btn btn-ghost" onClick={() => edit(doctor)}>Edit profile</button></article>)}
  </section>;
}
