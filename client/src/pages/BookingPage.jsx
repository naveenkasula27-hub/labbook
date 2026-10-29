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
import DemoStrip from "../components/DemoStrip.jsx";
import LangToggle from "../components/LangToggle.jsx";
import AudienceTiles from "../components/AudienceTiles.jsx";
import AboutIllustration from "../components/AboutIllustration.jsx";
import { LangProvider, useLang } from "../lib/i18n.jsx";

export default function BookingPage() {
  return (
    <LangProvider>
      <BookingPageInner />
    </LangProvider>
  );
}

function BookingPageInner() {
  const { t } = useLang();
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  // What the patient has picked
  const [picked, setPicked] = useState({ tests: new Set(), packages: new Set() });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Dismissing the "Need help?" bar should only last for this one visit —
  // closing the tab and opening the site again should show it, falling in,
  // like a first-time visitor. sessionStorage (cleared when the tab closes)
  // is right for that; localStorage would hide it forever after one click,
  // which is the bug this replaced. Fails silently in case a browser blocks it.
  const [helpDismissed, setHelpDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("labbook-help-dismissed") === "1";
    } catch {
      return false;
    }
  });
  function dismissHelp() {
    setHelpDismissed(true);
    try {
      sessionStorage.setItem("labbook-help-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

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

  // Picks made on the "Men"/"Women"/"Kids"/"Seniors" checkup guide page
  // arrive here through sessionStorage, since that's a separate route with
  // no shared React state. Pull them into the basket once the real test
  // list has loaded (so only codes this lab actually has get added), then
  // clear the key so a later visit doesn't re-apply the same picks.
  useEffect(() => {
    if (!data) return;
    let codes = [];
    try {
      const raw = sessionStorage.getItem(`labbook-pending-tests:${slug}`);
      codes = raw ? JSON.parse(raw) : [];
    } catch {
      codes = [];
    }
    if (Array.isArray(codes) && codes.length) {
      const valid = codes.filter((c) => byCode[c]);
      if (valid.length) {
        setPicked((p) => {
          const tests = new Set(p.tests);
          for (const c of valid) tests.add(c);
          return { ...p, tests };
        });
      }
    }
    try {
      sessionStorage.removeItem(`labbook-pending-tests:${slug}`);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, slug]);
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

  /**
   * Picking anything after a booking means the patient has started a new one,
   * so the old confirmation goes away.
   *
   * Without this they were stuck: the confirmation stayed on screen, and the
   * bar at the bottom of the screen hides itself while a confirmation is up,
   * so there was no visible way to continue. The only route forward was the
   * Confirm button far down the page, which is exactly the button people
   * cannot find.
   */
  function startNewIfConfirmed() {
    setConfirmed((c) => (c ? null : c));
  }

  function toggleTest(code) {
    startNewIfConfirmed();
    setPicked((p) => {
      const tests = new Set(p.tests);
      tests.has(code) ? tests.delete(code) : tests.add(code);
      return { ...p, tests };
    });
  }

  function togglePackage(code) {
    startNewIfConfirmed();
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
        <h1>{t.notAvailableTitle}</h1>
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
        <span className="center muted small" style={{ display: "block" }}>{t.loading}</span>
      </main>
    );
  }

  const pickedCount = picked.tests.size + picked.packages.size;

  return (
    <>
      {lab.isDemo && <DemoStrip labName={lab.name} />}

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
            {lab.mapsUrl && (
              <a href={lab.mapsUrl} target="_blank" rel="noopener noreferrer">
                {t.directions}
              </a>
            )}
            <LangToggle />
          </div>
        </div>
      </header>

      {/* The three things most people open this page to do, in one row they
          can't miss: call, message on WhatsApp, or check a booking they
          already made. Burying these in the header's small text links meant
          first-time visitors scrolled past them without noticing. */}
      <div className="hero">
        <div className="wrap">
          <input
            className="hero-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAria}
          />
          <div className="hero-actions">
            <a className="hero-action hero-action-call" href={`tel:${lab.phone.replace(/\s/g, "")}`}>
              <span className="hero-action-badge hero-action-badge-call" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2 2Z" />
                </svg>
              </span>
              <span className="hero-action-label">{t.heroCallUs}</span>
            </a>
            {lab.whatsapp && (
              <a
                className="hero-action hero-action-whatsapp"
                href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
                  `Hello ${lab.name}, I have a question.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hero-action-badge hero-action-badge-whatsapp" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm5.6 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.7 1.9.8 2 .1.2.1.4 0 .6-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.9 1.4 1.8 2.3 1.3 1.1 2.3 1.5 2.6 1.7.3.2.5.1.7-.1l.7-.8c.2-.3.4-.2.7-.1l1.8.9c.2.1.4.2.5.3.1.2.1.9-.1 1.5Z" />
                  </svg>
                </span>
                <span className="hero-action-label">{t.heroWhatsapp}</span>
              </a>
            )}
            <Link className="hero-action hero-action-check" to={`/${slug}/check`}>
              <span className="hero-action-badge hero-action-badge-check" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.3 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17.7 9.5l-7 7Z" />
                </svg>
              </span>
              <span className="hero-action-label">{t.heroCheckBooking}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* An "about" band using only facts that are actually true of this
          lab right now — its own description, its real test/package
          counts, its real phone and WhatsApp. No invented trust badges,
          no stock photos of people, no numbers we can't back up — just
          an original drawn illustration in the lab's own colour. */}
      <section className="about-band">
        <div className="wrap about-band-inner">
          <div className="about-band-text">
            <h2>{t.aboutHeading(lab.name)}</h2>
            {lab.about && <p className="about-band-copy">{lab.about}</p>}
            <div className="about-band-stats">
              <div className="about-band-stat">
                <strong>{data.tests.length}</strong>
                <span>{t.aboutStatTests(data.tests.length)}</span>
              </div>
              {data.packages.length > 0 && (
                <div className="about-band-stat">
                  <strong>{data.packages.length}</strong>
                  <span>{t.aboutStatPackages(data.packages.length)}</span>
                </div>
              )}
            </div>
            <div className="about-band-actions">
              {lab.whatsapp && (
                <a
                  className="btn btn-primary"
                  href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
                    `Hello ${lab.name}, I have a question.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.aboutChat}
                </a>
              )}
              <a className="btn btn-ghost" href={`tel:${lab.phone.replace(/\s/g, "")}`}>
                {t.aboutCall}
              </a>
            </div>
          </div>
          <div className="about-band-art">
            <AboutIllustration />
          </div>
        </div>
      </section>

      <div className="wrap">
        {confirmed && <Confirmation booking={confirmed} lab={lab} onDone={() => setConfirmed(null)} />}

        <div className="cols">
          <main>
            {data.packages.length > 0 && (
              <section className="card" id="packages">
                <h2>{t.audienceTitle}</h2>
                <AudienceTiles slug={slug} />

                <h2 style={{ marginTop: 18 }}>{t.packagesTitle}</h2>
                <p className="muted small">{t.packagesSub}</p>
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
              <h2>{t.findTitle}</h2>
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
              <h2>{t.yourBooking}</h2>
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
              <h2>{t.yourDetails}</h2>
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
          {/* The wrapper the layout rules target. Without it the contents sat
              hard against the left edge of the window with the button below
              them, instead of text left and button right. */}
          <div className="bar-inner">
            <span className="bar-cart" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6" />
                <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
              </svg>
              <span className="bar-badge">{pickedCount}</span>
            </span>

            <div className="bar-text">
              <span className="bar-count">{t.testsChosen(pickedCount)}</span>
              {basket.subtotal !== null && <> · {money(basket.subtotal, lab)}</>}
              {date && <div className="tiny muted">{prettyDate(date, lab)}{slot ? `, ${slot}` : ""}</div>}
            </div>

            <a className="btn btn-primary bar-go" href="#book">{t.continue}</a>
          </div>
        </div>
      )}

      {!helpDismissed && !(pickedCount > 0 && !confirmed) && (
        <div className="help-bar">
          <div className="wrap help-bar-inner">
            <div>
              <p className="help-bar-title">{t.needHelp}</p>
              <p className="help-bar-sub">{t.needHelpSub}</p>
            </div>
            <div className="help-bar-actions">
              <a className="btn btn-ghost" href={`tel:${lab.phone.replace(/\s/g, "")}`}>
                {t.callLabel(lab.phone)}
              </a>
              {lab.whatsapp && (
                <a
                  className="btn btn-primary"
                  href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
                    `Hello ${lab.name}, I have a question.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.whatsapp}
                </a>
              )}
              <button
                type="button"
                className="help-bar-close"
                onClick={dismissHelp}
                aria-label={t.close}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
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
