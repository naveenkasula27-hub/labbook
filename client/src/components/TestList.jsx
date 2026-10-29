import { useMemo } from "react";
import { money } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";
import CategoryIcon from "../lib/categoryIcons.jsx";

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ");

export default function TestList({
  tests,
  categories,
  lab,
  query,
  category,
  onCategory,
  picked,
  onToggle,
  onAddQueryToNotes,
}) {
  const { t } = useLang();

  const shown = useMemo(() => {
    const q = norm(query).trim();
    const words = q ? q.split(/\s+/) : [];
    return tests.filter((test) => {
      if (category !== "All" && test.category !== category) return false;
      if (!words.length) return true;
      const hay = norm(`${test.name} ${test.alias} ${test.category}`);
      return words.every((w) => hay.includes(w));
    });
  }, [tests, query, category]);

  const chips = ["All", ...categories];

  return (
    <>
      <div className="icon-chips" role="group" aria-label={t.categoriesAria}>
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="icon-chip"
            aria-pressed={category === c}
            onClick={() => onCategory(c)}
          >
            <span className="icon-chip-circle">
              <CategoryIcon category={c} />
            </span>
            <span className="icon-chip-label">{c === "All" ? t.all : c}</span>
          </button>
        ))}
      </div>

      <p className="count">{t.countTests(shown.length)}</p>

      {shown.length === 0 ? (
        <div className="empty">
          <p>
            {t.noResult(query.trim())}
            <br />
            {t.noResultHint}
          </p>
          {query.trim() && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onAddQueryToNotes(query.trim())}
            >
              {t.addQueryToNotes(query.trim())}
            </button>
          )}
        </div>
      ) : (
        <ul className="tests test-cards">
          {shown.map((tst) => {
            const on = picked.has(tst.code);
            return (
              <li className="test-card" key={tst.code}>
                <div className="test-card-top">
                  <span className="test-card-icon" aria-hidden="true">
                    <CategoryIcon category={tst.category} size={20} />
                  </span>
                  <div className="test-card-body">
                    <h3>{tst.name}</h3>
                    {tst.alias && <p className="test-alias">{tst.alias}</p>}
                    <div className="test-card-badges">
                      {tst.reportTime && <span className="badge">{tst.reportTime}</span>}
                      <span className="badge badge-muted">{t.sampleType(tst.sample)}</span>
                    </div>
                    {tst.fasting && <p className="test-fast">{tst.fasting}</p>}
                  </div>
                </div>
                <div className="test-card-right">
                  {typeof tst.price === "number" && (
                    <span className="test-card-price">{money(tst.price, lab)}</span>
                  )}
                  <button
                    type="button"
                    className="add"
                    data-on={on}
                    onClick={() => onToggle(tst.code)}
                    aria-label={`${on ? t.added : t.add} ${tst.name}`}
                  >
                    {on ? t.added : t.add}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
