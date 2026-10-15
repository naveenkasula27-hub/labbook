import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getLab,
  getAvailability,
  createBooking,
  money,
  prettyDate,
  todayForLab,
} from "../lib/api.js";
import TestList from "../components/TestList.jsx";
import Packages from "../components/Packages.jsx";
import SelectedPanel from "../components/SelectedPanel.jsx";
import BookingForm from "../components/BookingForm.jsx";
import Confirmation from "../components/Confirmation.jsx";

export default function BookingPage() {
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  // What the patient has picked
  const [picked, setPicked] = useState({ tests: new Set(), packages: new Set() });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Date and slots
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [availability, setAvailability] = useState(null);

  const [confirmed, setConfirmed] = useState(null);
  const formRef = useRef(null);

  /* ---------- Load the lab ---------- */
  useEffect(() => {
    let alive = true;
    setData(null);
    setLoadError("");
    getLab(slug)
      .then((d) => {
        if (!alive) return;
        // Guard against a reply that came back 200 but is not a lab, for
        // example a proxy or hosting error page. Without this the page
        // would render against undefined and go blank.
        if (!d || !d.lab) {
          setLoadError("This lab's booking page could not be loaded.");
          return;
        }
        setData({ lab: d.lab, tests: d.tests || [], packages: d.packages || [], categories: d.categories || [] });
      })
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    document.title = `Book a test — ${data.lab.name}`;
    const root = document.documentElement;
    if (data.lab.theme?.primary) root.style.setProperty("--primary", data.lab.theme.primary);
    if (data.lab.theme?.accent) root.style.setProperty("--accent", data.lab.theme.accent);
    // Falls back to the header colour, which is what labs without a cta set
    // have always used.
    root.style.setProperty("--cta", data.lab.theme?.cta || data.lab.theme?.primary || "");
  }, [data]);

  /* ---------- Load slots when the date changes ---------- */
  useEffect(() => {
    if (!date || !data) {
      setAvailability(null);
      return;
    }
    let alive = true;
    setAvailability({ loading: true });
    getAvailability(slug, date)
      .then((a) => alive && setAvailability(a))
      .catch((err) => alive && setAvailability({ error: err.message }));
    return () => {
      alive = false;
    };
  }, [date, slug, data]);

  // If the chosen slot became full, drop it.
  useEffect(() => {
    if (!slot || !availability?.slots) return;
    const row = availability.slots.find((s) => s.label === slot);
    if (row?.full) setSlot("");
  }, [availability, slot]);

  const lab = data?.lab;
  const byCode = useMemo(
    () => Object.fromEntries((data?.tests || []).map((t) => [t.code, t])),
    [data]
  );
  const pkgByCode = useMemo(
    () => Object.fromEntries((data?.packages || []).map((p) => [p.code, p])),
    [data]
  );

  /* ---------- What is in the basket ---------- */
  const basket = useMemo(() => {
    const items = [
      ...[...picked.packages].map((c) => pkgByCode[c]).filter(Boolean).map((p) => ({
        kind: "package",
        code: p.code,
        name: p.name,
        price: p.price,
      })),
      ...[...picked.tests].map((c) => byCode[c]).filter(Boolean).map((t) => ({
        kind: "test",
        code: t.code,
        name: t.name,
        price: t.price,
      })),
    ];
    const allPriced = items.length > 0 && items.every((i) => typeof i.price === "number");
    const subtotal = allPriced ? items.reduce((s, i) => s + i.price, 0) : null;
    return { items, subtotal, allPriced };
  }, [picked, byCode, pkgByCode]);

  /* ---------- Fasting warnings for what was picked ---------- */
  const fastingNotes = useMemo(() => {
    const notes = new Set();
    for (const c of picked.tests) if (byCode[c]?.fasting) notes.add(byCode[c].fasting);
    for (const c of picked.packages) if (pkgByCode[c]?.fasting) notes.add(pkgByCode[c].fasting);
    return [...notes];
  }, [picked, byCode, pkgByCode]);

  /* ---------- Which picks cannot be done at home ---------- */
  const labOnly = useMemo(() => {
    const names = new Set();
    for (const c of picked.tests) {
      const t = byCode[c];
      if (t && !t.homeCollectable) names.add(t.name);
    }
    for (const c of picked.packages) {
      for (const tc of pkgByCode[c]?.testCodes || []) {
        const t = byCode[tc];
        if (t && !t.homeCollectable) names.add(t.name);
      }
    }
    return [...names];
  }, [picked, byCode, pkgByCode]);

  function toggleTest(code) {
    setPicked((p) => {
      const tests = new Set(p.tests);
      tests.has(code) ? tests.delete(code) : tests.add(code);
      return { ...p, tests };
    });
  }

  function togglePackage(code) {
    setPicked((p) => {
      const packages = new Set(p.packages);
      packages.has(code) ? packages.delete(code) : packages.add(code);
      return { ...p, packages };
    });
  }

  function addQueryToNotes(text) {
    setQuery("");
    formRef.current?.appendNote(text);
  }

  async function submit(fields) {
    const body = {
      ...fields,
      testCodes: [...picked.tests],
      packageCodes: [...picked.packages],
      date,
      slot,
    };
    const result = await createBooking(slug, body);
    setConfirmed(result);
    setPicked({ tests: new Set(), packages: new Set() });
    setDate("");
    setSlot("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return result;
  }

  /* ---------- Loading and error states ---------- */
  if (loadError) {
    return (
      <main className="center">
        <h1>This page is not available</h1>
        <p className="muted">{loadError}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="wrap" style={{ paddingTop: 28 }}>
        <div className="skeleton" style={{ height: 34, width: "55%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 18, width: "35%", marginBottom: 26 }} />
        <div className="skeleton" style={{ height: 230 }} />
        <span className="center muted small" style={{ display: "block" }}>Loading…</span>
      </main>
    );
  }

  const pickedCount = picked.tests.size + picked.packages.size;

  return (
    <>
      {lab.isDemo && (
        <div className="demo-strip">
          <div className="wrap">
            <p>
              <strong>Demo site.</strong> {lab.name} is a sample lab, not a real business.
              Please do not enter real personal details.
            </p>
            <p className="demo-by">Built by UnityWebWorks</p>
          </div>
        </div>
      )}

      <header className="site-head">
        <div className="wrap">
          <div className="head-row">
            {lab.logoUrl ? (
              <img className="logo" src={lab.logoUrl} alt="" />
            ) : (
              <div className="logo" aria-hidden="true" />
            )}
            <div>
              <h1>{lab.name}</h1>
              {lab.tagline && <p className="tagline">{lab.tagline}</p>}
            </div>
          </div>
          <div className="head-links">
            <a href={`tel:${lab.phone.replace(/\s/g, "")}`}>Call {lab.phone}</a>
            {lab.whatsapp && (
              <a
                href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
                  `Hello ${lab.name}, I have a question.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            )}
            {lab.mapsUrl && (
              <a href={lab.mapsUrl} target="_blank" rel="noopener noreferrer">
                Directions
              </a>
            )}
            <Link to={`/${slug}/check`}>Check a booking</Link>
          </div>
        </div>
      </header>

      <div className="wrap">
        {confirmed && <Confirmation booking={confirmed} lab={lab} onDone={() => setConfirmed(null)} />}

        <div className="cols">
          <main>
            {lab.about && (
              <section className="card">
                <p className="muted" style={{ margin: 0 }}>{lab.about}</p>
              </section>
            )}

            {data.packages.length > 0 && (
              <section className="card" id="packages">
                <h2>Health checkup packages</h2>
                <p className="muted small">
                  A set of tests at one price. You can also pick tests one by one below.
                </p>
                <Packages
                  packages={data.packages}
                  lab={lab}
                  byCode={byCode}
                  picked={picked.packages}
                  onToggle={togglePackage}
                />
              </section>
            )}

            <section className="card" id="tests">
              <h2>Find a test</h2>
              <input
                className="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a test name, for example sugar, thyroid, CBC"
                aria-label="Search tests"
              />
              <TestList
                tests={data.tests}
                categories={data.categories}
                lab={lab}
                query={query}
                category={category}
                onCategory={setCategory}
                picked={picked.tests}
                onToggle={toggleTest}
                onAddQueryToNotes={addQueryToNotes}
              />
            </section>
          </main>

          <aside className="side">
            <section className="card">
              <h2>Your booking</h2>
              <SelectedPanel
                basket={basket}
                lab={lab}
                fastingNotes={fastingNotes}
                onRemove={(item) =>
                  item.kind === "package" ? togglePackage(item.code) : toggleTest(item.code)
                }
              />
            </section>

            <section className="card" id="book">
              <h2>Your details</h2>
              <BookingForm
                ref={formRef}
                lab={lab}
                basket={basket}
                labOnly={labOnly}
                date={date}
                slot={slot}
                availability={availability}
                minDate={todayForLab(lab)}
                onDate={(d) => {
                  setDate(d);
                  setSlot("");
                }}
                onSlot={setSlot}
                onSubmit={submit}
              />
            </section>
          </aside>
        </div>
      </div>

      {pickedCount > 0 && !confirmed && (
        <div className="bar">
          <div className="bar-text">
            <span className="bar-count">
              {pickedCount} {pickedCount === 1 ? "item" : "items"}
            </span>
            {basket.subtotal !== null && <> · {money(basket.subtotal, lab)}</>}
            {date && <div className="tiny muted">{prettyDate(date, lab)}{slot ? `, ${slot}` : ""}</div>}
          </div>
          <a className="btn btn-primary" href="#book">Continue</a>
        </div>
      )}

      <footer className="site-foot">
        <div className="wrap">
          {lab.address && <p style={{ margin: 0 }}>{lab.address}</p>}
          <p style={{ margin: "4px 0 0" }}>{lab.name} · {lab.phone}</p>
        </div>
      </footer>
    </>
  );
}
