import { useEffect, useMemo, useState } from "react";
import { getTests, getPackages, updatePrices, updateTest, updatePackage } from "../lib/dash.js";
import { money } from "../lib/api.js";

export default function PricesPage({ lab }) {
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");

  // Edited prices not yet saved, keyed by test code.
  const [edits, setEdits] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function load() {
    setError("");
    try {
      const [t, p] = await Promise.all([getTests(), getPackages()]);
      setTests(t.tests);
      setCategories(t.categories);
      setPackages(p.packages);
      setEdits({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tests.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!needle) return true;
      return `${t.name} ${t.alias}`.toLowerCase().includes(needle);
    });
  }, [tests, category, q]);

  const unsaved = Object.keys(edits).length;
  const priced = tests.filter((t) => typeof t.price === "number").length;

  function edit(code, raw) {
    setSaved("");
    setEdits((prev) => {
      const next = { ...prev };
      const original = tests.find((t) => t.code === code);
      const trimmed = raw.trim();
      const value = trimmed === "" ? null : Number(trimmed);

      // Dropping an edit that matches what's already stored keeps the
      // "unsaved" count honest.
      const same = value === null ? original.price === null : value === original.price;
      if (same) delete next[code];
      else next[code] = value;
      return next;
    });
  }

  async function saveAll() {
    const bad = Object.entries(edits).find(
      ([, v]) => v !== null && (!Number.isFinite(v) || v < 0)
    );
    if (bad) {
      setError(`"${bad[1]}" is not a valid price. Use a number, or leave it empty.`);
      return;
    }

    setSaving(true);
    setError("");
    setSaved("");
    try {
      const prices = Object.entries(edits).map(([code, price]) => ({ code, price }));
      const res = await updatePrices(prices);
      await load();
      setSaved(`${res.updated} ${res.updated === 1 ? "price" : "prices"} saved.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(test) {
    setError("");
    try {
      await updateTest(test.code, { active: !test.active });
      setTests((prev) =>
        prev.map((t) => (t.code === test.code ? { ...t, active: !t.active } : t))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleAudience(pkg, tag) {
    const has = (pkg.audience || []).includes(tag);
    const next = has
      ? pkg.audience.filter((a) => a !== tag)
      : [...(pkg.audience || []), tag];
    setError("");
    try {
      const res = await updatePackage(pkg.code, { audience: next });
      setPackages((prev) => prev.map((p) => (p.code === pkg.code ? res.package : p)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePackagePrice(pkg, raw) {
    const trimmed = String(raw).trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setError("That package price is not valid.");
      return;
    }
    if (value === pkg.price) return;

    setError("");
    try {
      const res = await updatePackage(pkg.code, { price: value });
      setPackages((prev) => prev.map((p) => (p.code === pkg.code ? res.package : p)));
      setSaved("Package price saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <section className="card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 46, marginBottom: 10 }} />
        ))}
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <h2>Health checkup packages</h2>
        <p className="muted small">
          Set one price for the whole package. Leave it empty if you would rather quote it yourself.
        </p>

        <ul className="price-list">
          {packages.map((p) => (
            <li key={p.code} className="price-list-pkg">
              <div className="price-list-pkg-row">
                <div>
                  <strong>{p.name}</strong>
                  <span className="muted tiny"> · {p.testCodes.length} tests</span>
                </div>
                <PriceInput
                  value={p.price}
                  currency={lab?.currency}
                  onCommit={(raw) => savePackagePrice(p, raw)}
                  ariaLabel={`Price for ${p.name}`}
                />
              </div>
              <div className="audience-row">
                <span className="muted tiny">Who is this for?</span>
                {["men", "women", "kids", "seniors"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="audience-chip"
                    aria-pressed={(p.audience || []).includes(tag)}
                    onClick={() => toggleAudience(p, tag)}
                  >
                    {tag[0].toUpperCase() + tag.slice(1)}
                  </button>
                ))}
                {(!p.audience || p.audience.length === 0) && (
                  <span className="muted tiny">Everyone (no tile selected)</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="prices-head">
          <div>
            <h2>Test prices</h2>
            <p className="muted small" style={{ margin: 0 }}>
              {priced} of {tests.length} tests have a price. The rest show as "ask the lab".
            </p>
          </div>
          {unsaved > 0 && (
            <button className="btn btn-primary" type="button" disabled={saving} onClick={saveAll}>
              {saving ? "Saving…" : `Save ${unsaved} ${unsaved === 1 ? "change" : "changes"}`}
            </button>
          )}
        </div>

        {error && <div className="notice notice-bad" role="alert">{error}</div>}
        {saved && <div className="notice notice-ok" role="status">{saved}</div>}

        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tests"
          aria-label="Search tests"
        />

        <div className="chips" role="group" aria-label="Categories">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="count">{shown.length === 1 ? "1 test" : `${shown.length} tests`}</p>

        <ul className="price-list">
          {shown.map((t) => (
            <li key={t.code} className={t.active ? "" : "is-off"}>
              <div>
                <strong>{t.name}</strong>
                {t.alias && <span className="muted tiny"> · {t.alias}</span>}
                <div className="muted tiny">
                  {t.category} · {t.sample}
                  {t.fasting ? ` · ${t.fasting}` : ""}
                </div>
              </div>

              <div className="price-cell">
                <PriceInput
                  value={edits[t.code] !== undefined ? edits[t.code] : t.price}
                  dirty={edits[t.code] !== undefined}
                  currency={lab?.currency}
                  onChange={(raw) => edit(t.code, raw)}
                  ariaLabel={`Price for ${t.name}`}
                />
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => toggleActive(t)}
                  title={t.active ? "Stop offering this test" : "Offer this test again"}
                >
                  {t.active ? "Offered" : "Hidden"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {unsaved > 0 && (
          <div className="sticky-save">
            <span className="small">
              {unsaved} unsaved {unsaved === 1 ? "change" : "changes"}
            </span>
            <button className="btn btn-primary" type="button" disabled={saving} onClick={saveAll}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function PriceInput({ value, dirty, currency, onChange, onCommit, ariaLabel }) {
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value));

  useEffect(() => {
    setText(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const symbol = currency === "INR" ? "₹" : "";

  return (
    <span className={`price-input${dirty ? " is-dirty" : ""}`}>
      {symbol && <span className="price-symbol">{symbol}</span>}
      <input
        className="input"
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={text}
        aria-label={ariaLabel}
        placeholder="—"
        onChange={(e) => {
          setText(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={(e) => onCommit?.(e.target.value)}
      />
    </span>
  );
}
