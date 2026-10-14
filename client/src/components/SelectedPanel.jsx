import { money } from "../lib/api.js";

export default function SelectedPanel({ basket, lab, fastingNotes, onRemove }) {
  if (!basket.items.length) {
    return (
      <p className="muted small" style={{ margin: 0 }}>
        Nothing picked yet. Choose a package or add tests, or just write what you need in the notes
        below.
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
              {i.kind === "package" && <span className="muted tiny"> (package)</span>}
            </span>
            <span style={{ display: "flex", gap: 10, alignItems: "baseline", flex: "none" }}>
              {typeof i.price === "number" && <span className="small">{money(i.price, lab)}</span>}
              <button type="button" className="link-btn" onClick={() => onRemove(i)}>
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>

      {basket.subtotal !== null ? (
        <div className="total">
          <span>Estimated total</span>
          <span>{money(basket.subtotal, lab)}</span>
        </div>
      ) : (
        <p className="muted tiny" style={{ margin: 0 }}>
          Some of these are not priced online. The lab will confirm the amount.
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
