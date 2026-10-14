import { money } from "../lib/api.js";

export default function Packages({ packages, lab, byCode, picked, onToggle }) {
  return (
    <ul className="pkgs">
      {packages.map((p) => {
        const on = picked.has(p.code);
        const names = p.testCodes.map((c) => byCode[c]?.name).filter(Boolean);
        const shownNames = names.slice(0, 4).join(", ");
        const more = names.length - 4;

        return (
          <li className="pkg" key={p.code}>
            <h3>{p.name}</h3>
            {typeof p.price === "number" && (
              <p className="price" style={{ margin: "0 0 6px" }}>{money(p.price, lab)}</p>
            )}
            {p.description && <p>{p.description}</p>}
            <p>
              {names.length} tests
              {shownNames && `: ${shownNames}`}
              {more > 0 && ` and ${more} more`}
            </p>
            {p.fasting && <p className="test-fast">{p.fasting}</p>}
            <button
              type="button"
              className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => onToggle(p.code)}
            >
              {on ? "Added to booking" : "Add to booking"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
