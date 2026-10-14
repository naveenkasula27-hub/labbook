import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { findBooking, money, prettyDate } from "../lib/api.js";

const STATUS_TEXT = {
  new: "Received. The lab will confirm shortly.",
  confirmed: "Confirmed.",
  sample_collected: "Your sample has been collected.",
  report_ready: "Your report is ready.",
  completed: "Completed.",
  cancelled: "This booking was cancelled.",
  no_show: "Marked as not attended.",
};

export default function CheckBookingPage() {
  const { slug } = useParams();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!reference.trim()) return setError("Enter your booking reference.");
    const last4 = phone.replace(/\D/g, "").slice(-4);
    if (last4.length < 4) return setError("Enter the last 4 digits of the booking phone number.");

    setBusy(true);
    try {
      setResult(await findBooking(slug, reference.trim().toUpperCase(), last4));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="site-head">
        <div className="wrap">
          <h1>Check a booking</h1>
          <div className="head-links">
            <Link to={`/${slug}`}>Back to booking</Link>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 60, maxWidth: 520 }}>
        <section className="card">
          <form className="form" onSubmit={submit} noValidate>
            <div>
              <label className="field-label" htmlFor="ref">Booking reference</label>
              <input
                id="ref"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="For example NAN-7K3QX"
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="ph">Last 4 digits of the phone number</label>
              <input
                id="ph"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="0916"
              />
            </div>
            {error && <div className="notice notice-bad" role="alert">{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? "Checking…" : "Check"}
            </button>
          </form>
        </section>

        {result && (
          <section className="card" role="status">
            <h2>{result.reference}</h2>
            <div className="notice notice-ok" style={{ marginTop: 8 }}>
              {STATUS_TEXT[result.status] || result.status}
            </div>
            <dl className="small" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", margin: 0 }}>
              {result.date && (
                <>
                  <dt className="muted">When</dt>
                  <dd style={{ margin: 0 }}>
                    {prettyDate(result.date)}{result.slot ? `, ${result.slot}` : ""}
                  </dd>
                </>
              )}
              <dt className="muted">Sample</dt>
              <dd style={{ margin: 0 }}>{result.visitType === "home" ? "At your home" : "At the lab"}</dd>
              <dt className="muted">Tests</dt>
              <dd style={{ margin: 0 }}>{result.items.map((i) => i.name).join(", ")}</dd>
              {result.estimatedTotal !== null && (
                <>
                  <dt className="muted">Estimated</dt>
                  <dd style={{ margin: 0 }}>
                    {money(result.estimatedTotal, { currency: result.currency })}
                  </dd>
                </>
              )}
            </dl>
          </section>
        )}
      </div>
    </>
  );
}
