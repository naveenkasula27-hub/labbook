import { useEffect, useRef, useState } from "react";
import { requestCallback } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";
import { EXPERIENCE } from "../lib/experience.js";

export default function CallbackDialog({ lab, open, onClose, onExplore }) {
  const dialogRef = useRef(null);
  const { lang } = useLang();
  const copy = EXPERIENCE[lang];
  const [values, setValues] = useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (open) { dialog.close(); previouslyFocused?.focus?.(); } };
  }, [open]);
  async function submit(event) {
    event.preventDefault(); setError(""); setSending(true);
    try {
      const response = await requestCallback(lab.slug, values);
      setResult(response); setValues({ name: "", phone: "", message: "" });
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }
  return <dialog ref={dialogRef} className="lb-callback" aria-labelledby="callback-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="lb-callback-grid">
      <div className="lb-callback-story"><img src="/images/lab.jpg" alt="" width="600" height="800" /><div><p className="lb-eyebrow">{lab.name}</p><h2>{copy.title}</h2><p>{copy.intro}</p><span>{copy.eyebrow}</span></div></div>
      <div className="lb-callback-form"><button className="lb-dialog-close" type="button" onClick={onClose} aria-label={copy.close}>×</button>
        {result ? <div className="lb-callback-success" role="status"><p className="lb-eyebrow">{result.isDemo ? "DEMO" : lab.name}</p><h2 id="callback-title">{result.isDemo ? copy.demoSaved : copy.saved}</h2><p>{result.isDemo ? copy.demoBody : copy.savedBody}</p><p className="callback-reference"><small>{copy.reference}</small><strong>{result.reference}</strong></p><button type="button" className="btn btn-primary" onClick={onExplore}>{copy.done}</button><a href={`tel:${lab.phone.replace(/\s/g, "")}`}>{copy.call}: {lab.phone}</a></div> : <>
          <p className="lb-eyebrow">{copy.eyebrow}</p><h2 id="callback-title">{copy.formTitle}</h2><p>{copy.formIntro}</p>
          {lab.isDemo && <p className="lb-demo-note">{copy.demo}</p>}
          <form onSubmit={submit}>
            <label htmlFor="callback-name">{copy.name}</label><input id="callback-name" autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
            <label htmlFor="callback-phone">{copy.phone}</label><input id="callback-phone" type="tel" autoComplete="tel" required minLength={6} maxLength={30} value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
            <label htmlFor="callback-message">{copy.message}</label><textarea id="callback-message" maxLength={300} placeholder={copy.placeholder} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} />
            <p className="lb-form-fine">{copy.fine}</p>
            {error && <p className="err" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? copy.sending : copy.submit}</button>
          </form>
          <button type="button" className="lb-browse-link" onClick={onExplore}>{copy.browse}</button>
        </>}
      </div>
    </div>
  </dialog>;
}
