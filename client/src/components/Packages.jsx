import { money } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";

export default function Packages({ packages, lab, byCode, picked, onToggle }) {
  const { t } = useLang();

  return (
    <ul className="pkgs">
      {packages.map((p) => {
        const on = picked.has(p.code);
        const names = p.testCodes.map((c) => byCode[c]?.name).filter(Boolean);
        const shownNames = names.slice(0, 4).join(", ");
        const more = names.length - 4;

        return (
          <li className="pkg" key={p.code}>
            <div className="pkg-top">
              <h3>{p.name}</h3>
              {typeof p.price === "number" && <span className="pkg-price">{money(p.price, lab)}</span>}
            </div>
            {p.description && <p>{p.description}</p>}
            <div className="pkg-badges">
              <span className="badge">{t.pkgTests(names.length)}</span>
              {p.fasting && <span className="badge badge-warn">{p.fasting}</span>}
            </div>
            {shownNames && (
              <p className="pkg-included">
                {shownNames}
                {more > 0 && <> {t.pkgMore(more)}</>}
              </p>
            )}
            <button
              type="button"
              className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => onToggle(p.code)}
            >
              {on ? t.pkgAdded : t.pkgAdd}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
