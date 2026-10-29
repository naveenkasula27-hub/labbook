import { money } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";

export default function SelectedPanel({ basket, lab, fastingNotes, onRemove }) {
  const { t } = useLang();

  if (!basket.items.length) {
    return (
      <p className="muted small" style={{ margin: 0 }}>
        {t.nothingPicked}
      </p>
    );
  }

  return (
    <>
      <ul className="sel">
        {basket.items.map((i) => (
          <li key={`${i.kind}-${i.code}`}>
            <span>
              {i.name}
              {i.kind === "package" && <span className="muted tiny"> ({t.packageLabel})</span>}
            </span>
            <span style={{ display: "flex", gap: 10, alignItems: "baseline", flex: "none" }}>
              {typeof i.price === "number" && <span className="small">{money(i.price, lab)}</span>}
              <button type="button" className="link-btn" onClick={() => onRemove(i)}>
                {t.remove}
              </button>
            </span>
          </li>
        ))}
      </ul>

      {basket.subtotal !== null ? (
        <div className="total">
          <span>{t.estimatedTotal}</span>
          <span>{money(basket.subtotal, lab)}</span>
        </div>
      ) : (
        <p className="muted tiny" style={{ margin: 0 }}>
          {t.notAllPriced}
        </p>
      )}

      {fastingNotes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {fastingNotes.map((n) => (
            <p className="test-fast" key={n} style={{ marginRight: 6 }}>{n}</p>
          ))}
        </div>
      )}
    </>
  );
}
