import { useMemo } from "react";
import { money } from "../lib/api.js";

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
  const shown = useMemo(() => {
    const q = norm(query).trim();
    const words = q ? q.split(/\s+/) : [];
    return tests.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!words.length) return true;
      const hay = norm(`${t.name} ${t.alias} ${t.category}`);
      return words.every((w) => hay.includes(w));
    });
  }, [tests, query, category]);

  const chips = ["All", ...categories];

  return (
    <>
      <div className="chips" role="group" aria-label="Test categories">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            aria-pressed={category === c}
            onClick={() => onCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="count">{shown.length === 1 ? "1 test" : `${shown.length} tests`}</p>

      {shown.length === 0 ? (
        <div className="empty">
          <p>
            No test found{query.trim() ? ` for “${query.trim()}”` : ""}.
            <br />
            Add it to your notes and the lab will check it for you.
          </p>
          {query.trim() && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onAddQueryToNotes(query.trim())}
            >
              Add “{query.trim()}” to my notes
            </button>
          )}
        </div>
      ) : (
        <ul className="tests">
          {shown.map((t) => {
            const on = picked.has(t.code);
            return (
              <li className="test" key={t.code}>
                <div>
                  <h3>{t.name}</h3>
                  {t.alias && <p className="test-alias">{t.alias}</p>}
                  <p className="test-meta">
                    {t.sample} sample
                    {typeof t.price === "number" ? ` · ${money(t.price, lab)}` : ""}
                    {t.reportTime ? ` · ${t.reportTime}` : ""}
                  </p>
                  {t.fasting && <p className="test-fast">{t.fasting}</p>}
                </div>
                <button
                  type="button"
                  className="add"
                  data-on={on}
                  onClick={() => onToggle(t.code)}
                  aria-label={`${on ? "Remove" : "Add"} ${t.name}`}
                >
                  {on ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
