import { money, prettyDate } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";

export default function Confirmation({ booking, lab, onDone }) {
  const { t } = useLang();

  return (
    <section className="card done" role="status" aria-live="polite">
      <h2 style={{ marginBottom: 2 }}>{lab.isDemo ? t.demoBannerTitle : t.bookingConfirmed}</h2>
      <p className="ref">{booking.reference}</p>

      {/* The notice at the top of a demo page is easy to scroll past. This is
          the moment somebody would write down a reference and plan a trip, so
          it has to be said here too. */}
      {lab.isDemo ? (
        <p className="notice notice-warn">
          <strong>{t.demoWarnBold}</strong> {t.demoWarnRest(lab.name)}
        </p>
      ) : (
        <p className="small">{t.keepRef(lab.name)}</p>
      )}

      <dl>
        {booking.date && (
          <>
            <dt>{t.when}</dt>
            <dd>
              {prettyDate(booking.date, lab)}
              {booking.slot ? `, ${booking.slot}` : ""}
            </dd>
          </>
        )}
        <dt>{t.sample}</dt>
        <dd>{booking.visitType === "home" ? t.atYourHome : t.atLab}</dd>
        <dt>{t.tests}</dt>
        <dd>{booking.items.map((i) => i.name).join(", ") || t.asPerNotes}</dd>
        {booking.estimatedTotal !== null && (
          <>
            <dt>{t.estimated}</dt>
            <dd>{money(booking.estimatedTotal, lab)}</dd>
          </>
        )}
      </dl>

      {/* Only on a real lab. On a demo it contradicted the notice above it,
          telling people to wait for a call that was never coming. */}
      {booking.whatsappNotified === false && !lab.isDemo && (
        <p className="small muted">{t.noWhatsappNote(lab.phone)}</p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {lab.whatsapp && (
          <a
            className="btn btn-primary"
            href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
              lab.isDemo
                ? "Hello, I just tried your demo booking page. I run a lab and I want one."
                : `Hello ${lab.name}, about my booking ${booking.reference}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* On a demo this is the point where somebody has just seen it work
                and is most likely to get in touch. */}
            {lab.isDemo ? t.wantOneForLab : t.messageLab}
          </a>
        )}
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          {t.bookAnother}
        </button>
      </div>
    </section>
  );
}
