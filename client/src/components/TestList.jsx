import { useLang } from "../lib/i18n.jsx";
import { useMemo, useState, useEffect } from "react";
import { money } from "../lib/api.js";
import { catalogImage, matchesTest } from "../lib/catalog.js";

export default function TestList({ tests, categories, lab, query, category, onCategory, picked, onToggle, onAddQueryToNotes }) {
  const { t } = useLang();
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, category]);
  const shown = useMemo(() => tests.filter((test) =>
    (category === "All" || test.category === category) && matchesTest(test, query)
  ), [tests, query, category]);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = shown.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return <>
    <div className="chips" role="group" aria-label={t.categoriesAria}>
      {["All", ...categories].map((name) => <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => onCategory(name)}>{name === "All" ? t.all : name}</button>)}
    </div>
    <p className="count" role="status" aria-live="polite">{t.countTests(shown.length)}{query.trim() ? ` matching “${query.trim()}”` : " available"}{category !== "All" ? ` in ${category}` : ""}</p>
    {!shown.length ? <div className="empty">
      <h3>Let’s help you find your test</h3>
      <p>No matching test{query.trim() ? ` for “${query.trim()}”` : ""}. Try another name or category, or ask the lab.</p>
      {category !== "All" && <button type="button" className="btn btn-ghost" onClick={() => onCategory("All")}>Search all categories</button>}
      {query.trim() && <button type="button" className="btn btn-ghost" onClick={() => onAddQueryToNotes(query.trim())}>{t.addQueryToNotes(query.trim())}</button>}
    </div> : <>
      <ul className="test-grid">
        {pageItems.map((test) => {
          const on = picked.has(test.code);
          return <li className="catalog-card" data-selected={on} key={test.code}>
            <div className="catalog-photo"><img {...catalogImage(test.category)} loading="lazy" width="480" height="280" /><span className="catalog-label">{test.category}</span></div>
            <div className="catalog-body">
              <h3>{test.name}</h3>
              {test.alias && <p className="test-alias">{test.alias}</p>}
              <p className="catalog-meta">{t.sampleType(test.sample)} · {lab.homeCollection && test.homeCollectable ? "Home collection available" : "At the lab"}</p>
              {test.reportTime && <p className="catalog-meta">Reports: <strong>{test.reportTime}</strong></p>}
              <details className="catalog-details"><summary>Preparation details</summary><p>{test.fasting || "No fasting instruction listed. Confirm any preparation with the lab."}</p></details>
              <div className="catalog-bottom"><div><span className="catalog-price">{typeof test.price === "number" ? money(test.price, lab) : "Ask the lab"}</span><small>{typeof test.price === "number" ? "Test price" : "Price on request"}</small></div>
                <button type="button" className="add" data-on={on} aria-pressed={on} aria-label={`${on ? t.remove : t.add} ${test.name}`} onClick={() => onToggle(test.code)}>{on ? t.added : t.add}</button>
              </div>
            </div>
          </li>;
        })}
      </ul>
      {shown.length > PAGE_SIZE && <nav className="test-pager" aria-label={t.findTitle}>
        <button type="button" className="test-pager-btn" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← {t.prevPage}</button>
        <span className="test-pager-of">{t.pageOf(safePage, pageCount)}</span>
        <button type="button" className="test-pager-btn" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{t.nextPage} →</button>
      </nav>}
    </>}
  </>;
}
