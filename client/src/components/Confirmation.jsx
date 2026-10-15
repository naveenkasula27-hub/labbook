import { money, prettyDate } from "../lib/api.js";

export default function Confirmation({ booking, lab, onDone }) {
  return (
    <section className="card done" role="status" aria-live="polite">
      <h2 style={{ marginBottom: 2 }}>{lab.isDemo ? "Demo booking saved" : "Booking confirmed"}</h2>
      <p className="ref">{booking.reference}</p>

      {/* The notice at the top of a demo page is easy to scroll past. This is
          the moment somebody would write down a reference and plan a trip, so
          it has to be said here too. */}
      {lab.isDemo ? (
        <p className="notice notice-warn">
          <strong>Nothing has actually been booked.</strong> {lab.name} is a sample lab used
          to show how this works. No appointment exists and no lab is expecting you.
        </p>
      ) : (
        <p className="small">
          Keep this reference. {lab.name} will contact you on the number you gave.
        </p>
      )}

      <dl>
        {booking.date && (
          <>
            <dt>When</dt>
            <dd>
              {prettyDate(booking.date, lab)}
              {booking.slot ? `, ${booking.slot}` : ""}
            </dd>
          </>
        )}
        <dt>Sample</dt>
        <dd>{booking.visitType === "home" ? "At your home" : "At the lab"}</dd>
        <dt>Tests</dt>
        <dd>{booking.items.map((i) => i.name).join(", ") || "As per your notes"}</dd>
        {booking.estimatedTotal !== null && (
          <>
            <dt>Estimated</dt>
            <dd>{money(booking.estimatedTotal, lab)}</dd>
          </>
        )}
      </dl>

      {booking.whatsappNotified === false && (
        <p className="small muted">
          Your booking is saved. If you do not hear from the lab, call {lab.phone}.
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {lab.whatsapp && (
          <a
            className="btn btn-primary"
            href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
              `Hello ${lab.name}, about my booking ${booking.reference}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message the lab
          </a>
        )}
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Book another test
        </button>
      </div>
    </section>
  );
}
