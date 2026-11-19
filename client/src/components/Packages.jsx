import { useLang } from "../lib/i18n.jsx";
import { money } from "../lib/api.js";
import { packageImage } from "../lib/catalog.js";

export default function Packages({ packages, lab, byCode, picked, onToggle, onBook }) {
  const { t, lang } = useLang();
  return <ul className="package-grid">{packages.map((pack) => {
    const on = picked.has(pack.code);
    const names = pack.testCodes.map((code) => byCode[code]?.name).filter(Boolean);
    return <li className="catalog-card" data-selected={on} key={pack.code}>
      <div className="catalog-photo"><img {...packageImage(pack.name)} loading="lazy" width="480" height="280" /><span className="catalog-label">{t.packagesTitle}</span></div>
      <div className="catalog-body">
        <h3>{pack.name}</h3>
        {pack.description && <p className="catalog-meta">{pack.description}</p>}
        <p className="package-count">{t.pkgTests(names.length)}</p>
        <details className="catalog-details"><summary>See included tests & preparation</summary><ul>{names.map((name) => <li key={name}>{name}</li>)}</ul>{pack.fasting && <p>{pack.fasting}</p>}</details>
        <div className="catalog-bottom"><div><span className="catalog-price">{typeof pack.price === "number" ? money(pack.price, lab) : "Ask the lab"}</span><small>{typeof pack.price === "number" ? (pack.priceIsSample ? "Sample demo price" : "Package price") : "Price on request"}</small></div><div className="catalog-actions"><button type="button" className="add" data-on={on} aria-pressed={on} aria-label={`${on ? t.remove : t.add} ${pack.name}`} onClick={() => onToggle(pack.code)}>{on ? t.pkgAdded : t.pkgAdd}</button>{onBook && <button type="button" className="book-now" onClick={() => onBook(pack.code)}>{lang === "te" ? "బుక్ చేయండి" : "Book now"}</button>}</div></div>
      </div>
    </li>;
  })}</ul>;
}
