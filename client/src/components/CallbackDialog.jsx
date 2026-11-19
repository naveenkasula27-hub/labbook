import { useEffect, useRef, useState } from "react";
import { requestCallback, todayForLab } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";
import { EXPERIENCE } from "../lib/experience.js";

export default function CallbackDialog({ lab, open, kind = "callback", doctor, onClose, onExplore }) {
  const dialogRef = useRef(null); const { lang } = useLang(); const te = lang === "te"; const copy = EXPERIENCE[lang];
  const [values, setValues] = useState({ name: "", phone: "", email: "", preferredDate: "", preferredTime: "", message: "" });
  const [sending, setSending] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null);
  const appointment = kind !== "callback";
  const today = todayForLab(lab);
  const maxDate = new Date(new Date(`${today}T12:00:00Z`).getTime() + 90 * 86400000).toISOString().slice(0, 10);
  useEffect(() => { setResult(null); setError(""); }, [kind, doctor?.code]);
  useEffect(() => {
    const dialog = dialogRef.current; const previous = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (open) { dialog.close(); previous?.focus?.(); } };
  }, [open]);
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError(""); setSending(true);
    try {
      const response = await requestCallback(lab.slug, { ...values, kind, preferredDate: appointment ? values.preferredDate : "", preferredTime: appointment ? values.preferredTime : "", doctorCode: kind === "consultation" ? doctor?.code : "" });
      setResult(response); setValues({ name: "", phone: "", email: "", preferredDate: "", preferredTime: "", message: "" });
    } catch (err) { setError(err.message); } finally { setSending(false); }
  }
  const title = kind === "consultation" ? (te ? "డాక్టర్ సందర్శనను ప్లాన్ చేయండి" : "Plan your doctor visit") : kind === "home_collection" ? (te ? "హోమ్ కలెక్షన్‌ను సులభంగా కోరండి" : "Home collection, made simple") : copy.formTitle;
  return <dialog ref={dialogRef} className="lb-appointment-request" aria-labelledby="callback-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="lb-dialog-close" type="button" onClick={onClose} aria-label={copy.close}>×</button>
    {result ? <div className="lb-request-success" role="status"><p className="lb-eyebrow">{lab.name}</p><h2 id="callback-title">{result.isDemo ? copy.demoSaved : (appointment ? (te ? "అపాయింట్‌మెంట్ అభ్యర్థన అందింది" : "Your appointment request is in.") : copy.saved)}</h2><p>{result.isDemo ? copy.demoBody : (te ? "బృందం మీతో మాట్లాడి వివరాలను నిర్ధారిస్తుంది." : "The team will contact you to confirm the details. Your preferred time is not reserved yet.")}</p><p className="callback-reference"><small>{copy.reference}</small><strong>{result.reference}</strong></p><button type="button" className="btn btn-primary" onClick={onExplore}>{copy.done}</button><a href={`tel:${lab.phone.replace(/\s/g, "")}`}>{copy.call}: {lab.phone}</a></div> : <>
      <header className="lb-request-heading"><p className="lb-eyebrow">{lab.name}</p><h2 id="callback-title">{title}</h2><p>{kind === "consultation" ? `${doctor?.name || ""} · ${doctor?.specialty || ""}` : (te ? "మీ వివరాలు ఇవ్వండి. మిగతా విషయాల్లో బృందం సహాయం చేస్తుంది." : "Share a few details. We’ll help with the next step.")}</p></header>
      {lab.isDemo && <p className="lb-demo-note">{copy.demo}</p>}
      <form onSubmit={submit} className="lb-request-form">
        <fieldset disabled={sending}><div className="lb-request-fields">
          <label htmlFor="callback-name">{copy.name}<input id="callback-name" autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={set("name")} /></label>
          <label htmlFor="callback-phone">{copy.phone}<input id="callback-phone" type="tel" autoComplete="tel" required minLength={6} maxLength={30} value={values.phone} onChange={set("phone")} /></label>
          <label htmlFor="callback-email">{te ? "ఇమెయిల్ (ఐచ్ఛికం)" : "Email (optional)"}<input id="callback-email" type="email" autoComplete="email" maxLength={160} value={values.email} onChange={set("email")} /></label>
          {appointment && <label htmlFor="callback-date">{te ? "అనుకూలమైన తేదీ" : "Preferred date"}<input id="callback-date" type="date" required min={today} max={maxDate} value={values.preferredDate} onChange={set("preferredDate")} /></label>}
          {appointment && <label className="lb-request-wide" htmlFor="callback-time">{te ? "అనుకూలమైన సమయం" : "Preferred time period"}<select id="callback-time" required value={values.preferredTime} onChange={set("preferredTime")}><option value="">{te ? "సమయాన్ని ఎంచుకోండి" : "Choose a preferred time"}</option><option value="morning">{te ? "ఉదయం" : "Morning"}</option><option value="afternoon">{te ? "మధ్యాహ్నం" : "Afternoon"}</option><option value="evening">{te ? "సాయంత్రం" : "Evening"}</option></select></label>}
        </div><details className="lb-request-note"><summary>{te ? "ఒక నోట్ జోడించండి (ఐచ్ఛికం)" : "Add a note (optional)"}</summary><label className="sr-only" htmlFor="callback-message">{copy.message}</label><textarea id="callback-message" maxLength={300} placeholder={copy.placeholder} value={values.message} onChange={set("message")} /></details></fieldset>
        <p className="lb-request-fine">{appointment ? (te ? "ల్యాబ్ మీ తేదీ, సమయాన్ని నిర్ధారిస్తుంది." : "The lab will confirm your preferred date and time.") : copy.fine}</p>
        {error && <p className="err" role="alert">{error}</p>}
        <button type="submit" className="lb-request-submit" disabled={sending}>{sending ? copy.sending : (appointment ? (te ? "అపాయింట్‌మెంట్ కోరండి" : "Request appointment") : copy.submit)}</button>
      </form><button type="button" className="lb-browse-link" onClick={onExplore}>{copy.browse}</button>
    </>}
  </dialog>;
}
