import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  getLab,
  getAvailability,
  createBooking,
  money,
  prettyDate,
  todayForLab,
} from "../lib/api.js";
import LabFooter from "../components/LabFooter.jsx";
import "../brand.css";
import NotFoundPage from "./NotFoundPage.jsx";
import TestList from "../components/TestList.jsx";
import Packages from "../components/Packages.jsx";
import SelectedPanel from "../components/SelectedPanel.jsx";
const BookingForm = lazy(() => import("../components/BookingForm.jsx"));
import Confirmation from "../components/Confirmation.jsx";
import DemoStrip from "../components/DemoStrip.jsx";
import LangToggle from "../components/LangToggle.jsx";
import AudienceTiles from "../components/AudienceTiles.jsx";
import { LangProvider, useLang } from "../lib/i18n.jsx";
import { matchesTest, normalize } from "../lib/catalog.js";
import "../storefront.css";
import CallbackDialog from "../components/CallbackDialog.jsx";
import { EXPERIENCE } from "../lib/experience.js";
import "../experience.css";
import ServiceHome from "../components/ServiceHome.jsx";
import BookingDialog from "../components/BookingDialog.jsx";
import "../appointments.css";
import "../services.css";

export default function BookingPage() {
  const { slug } = useParams();
  return (
    <LangProvider>
      <BookingPageInner key={slug} />
    </LangProvider>
  );
}

function BookingPageInner() {
  const { t, lang } = useLang();
  const copy = EXPERIENCE[lang];
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const view = location.pathname.endsWith('/checkups') ? 'packages' : location.pathname.endsWith('/tests') ? 'tests' : 'home';
  useEffect(() => {
    setCategory(new URLSearchParams(location.search).get('category') || 'All');
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view, location.search]);

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [missingLab, setMissingLab] = useState(false);

  // What the patient has picked
  const [picked, setPicked] = useState(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(`labbook-basket:${slug}`) || '{}'); return { tests: new Set(saved.tests || []), packages: new Set(saved.packages || []) }; }
    catch { return { tests: new Set(), packages: new Set() }; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(`labbook-basket:${slug}`, JSON.stringify({ tests: [...picked.tests], packages: [...picked.packages] })); } catch {}
  }, [picked, slug]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const searchMode = view === "packages" ? "packages" : "tests";
  const [homeOnly, setHomeOnly] = useState(false);
  const [sort, setSort] = useState("catalog");
  const [helpOpen, setHelpOpen] = useState(false);
  const [requestKind, setRequestKind] = useState("callback");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSeen, setBookingSeen] = useState(false);
  useEffect(() => { if (bookingOpen) setBookingSeen(true); }, [bookingOpen]);


  function openHelp(kind = "callback") {
    setRequestKind(kind); setHelpOpen(true);
  }

  useEffect(() => {
    setHelpOpen(false);
    if (!data || window.location.hash) return;
    const key = `labbook-welcome:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "shown");
      if (sessionStorage.getItem(`labbook-pending-tests:${slug}`)) return;
    } catch { /* Help remains available without browser storage. */ }
    setRequestKind(data.lab.homeCollection ? "home_collection" : "callback");
    setHelpOpen(true);
  }, [data, slug]);

  function exploreTests() {
    setHelpOpen(false);
    navigate(`/${slug}/tests`);
  }

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

  useEffect(() => {
    if (!data || !["#tests", "#packages", "#book", "#about", "#contact", "#how-to-book"].includes(window.location.hash)) return;
    if (window.location.hash === "#book") setBookingOpen(true);
    const frame = requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [data, location.hash]);

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
      .catch((err) => { if (alive) { setLoadError(err.message); setMissingLab(err.status === 404); } });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    document.title = `${view === "packages" ? "Health checkups" : view === "tests" ? "Lab tests" : "Book a test"} — ${data.lab.name}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Explore tests and health checkups, view preparation details, and book directly with ${data.lab.name}.`);
    if (data.lab.isDemo) document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex,follow');
    const root = document.documentElement;
    if (data.lab.theme?.primary) root.style.setProperty("--primary", data.lab.theme.primary);
    if (data.lab.theme?.accent) root.style.setProperty("--accent", data.lab.theme.accent);
    // Falls back to the header colour, which is what labs without a cta set
    // have always used.
    root.style.setProperty("--cta", data.lab.theme?.cta || data.lab.theme?.primary || "");
  }, [data, view]);

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
    setPicked((current) => ({ tests: new Set([...current.tests].filter(code => byCode[code])), packages: new Set([...current.packages].filter(code => data.packages.some(pack => pack.code === code))) }));
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
    setBookingOpen(true);
    requestAnimationFrame(() => formRef.current?.appendNote(text));
  }

  function bookItem(kind, code) {
    startNewIfConfirmed();
    setPicked((current) => ({ ...current, [kind]: new Set([...current[kind], code]) }));
    setBookingOpen(true);
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
    setBookingOpen(false);
    setPicked({ tests: new Set(), packages: new Set() });
    setDate("");
    setSlot("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return result;
  }

  /* ---------- Loading and error states ---------- */
  if (missingLab) return <NotFoundPage />;
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
  const compare = (a, b) => sort === "price" ? ((typeof a.price === "number" ? a.price : Infinity) - (typeof b.price === "number" ? b.price : Infinity)) || a.name.localeCompare(b.name) : sort === "name" ? a.name.localeCompare(b.name) : 0;
  const catalogTests = data.tests.filter((test) => !homeOnly || (lab.homeCollection && test.homeCollectable)).sort(compare);
  const visiblePackages = data.packages.filter((pack) => (!homeOnly || (lab.homeCollection && pack.testCodes.length > 0 && pack.testCodes.every((code) => byCode[code]?.homeCollectable))) && (!normalize(query) ||
    matchesTest({ name: pack.name, alias: pack.description, category: "checkup package" }, query) ||
    pack.testCodes.some((code) => byCode[code] && matchesTest(byCode[code], query)))).sort(compare);
  const browseCategories = data.categories.filter((name) => data.tests.some((test) => test.category === name));

  return (
    <div className={`lb-store lb-services ${view === "home" ? "lb-home" : "lb-browse"}`}>
      {lab.isDemo && <DemoStrip labName={lab.name} />}
      <CallbackDialog key={slug} lab={lab} kind={requestKind} open={helpOpen} onClose={() => setHelpOpen(false)} onExplore={exploreTests} />
      <BookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)}>
        {(bookingOpen || bookingSeen) && <Suspense fallback={<p role="status">Loading your booking form…</p>}>
        <SelectedPanel basket={basket} lab={lab} fastingNotes={fastingNotes} onRemove={(item) => item.kind === "package" ? togglePackage(item.code) : toggleTest(item.code)} />
        <BookingForm ref={formRef} lab={lab} basket={basket} labOnly={labOnly} date={date} slot={slot} availability={availability} minDate={todayForLab(lab)} onDate={(value) => { setDate(value); setSlot(""); }} onSlot={setSlot} onSubmit={submit} />
        </Suspense>}
      </BookingDialog>

      <header className="site-head">
        <div className="wrap">
          <div className="head-row">
            {lab.logoUrl ? (
              <img className="logo" src={lab.logoUrl} alt="" />
            ) : (
              <div className="lb-monogram" aria-hidden="true">{lab.name.slice(0, 1)}</div>
            )}
            <div>
              <h1>{lab.name}</h1>
              {lab.tagline && <p className="tagline">{lab.tagline}</p>}
            </div>
          </div>
          {/* A real menu, like the Book a Test / Health Checkup rows on the
              bigger diagnostic sites, instead of a bare Directions link —
              gives first-time visitors a way to jump straight to a section. */}
          <nav className="head-nav" aria-label={t.findTitle}>
            <Link to={`/${slug}`}>Home</Link><Link to={`/${slug}/tests`} aria-current={view === "tests" ? "page" : undefined}>{t.findTitle}</Link>
            {data.packages.length > 0 && <Link to={`/${slug}/checkups`} aria-current={view === "packages" ? "page" : undefined}>{t.packagesTitle}</Link>}
            <Link to={`/${slug}/check`}>{t.heroCheckBooking}</Link>
            <Link to={`/${slug}#about`}>About</Link><Link to={`/${slug}#contact`}>Contact</Link>
            {lab.mapsUrl && (
              <a href={lab.mapsUrl} target="_blank" rel="noopener noreferrer">
                {t.directions}
              </a>
            )}
          </nav>
          <div className="head-links">
            <a href={`tel:${lab.phone.replace(/\s/g, "")}`}>{t.heroCallUs}</a>
            {lab.whatsapp && <a href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(`Hello ${lab.name}, I have a question.`)}`} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}
            <LangToggle />
            <button type="button" className="lb-header-help" onClick={() => openHelp()}>{copy.help}</button>
          </div>
        </div>
      </header>

      <div className="wrap">
        {confirmed && <Confirmation booking={confirmed} lab={lab} onDone={() => setConfirmed(null)} />}

        {view === "home" && <ServiceHome lab={lab} tests={data.tests} categories={browseCategories} picked={picked.tests} onToggle={toggleTest} onBook={(code) => bookItem("tests", code)} onHelp={openHelp} />}
        {view !== "home" && <div className="lb-browse-top"><Link to={`/${slug}`}>← Back to home</Link><p className="lb-eyebrow">{lab.name}</p><h2>{view === "packages" ? "Health checkups" : category === "All" ? "Find your lab test" : `${category} tests`}</h2><p>Choose what you need. See the details and price before you book.</p><div className="lb-route-tabs"><Link to={`/${slug}/tests`} aria-current={view === "tests" ? "page" : undefined}>Individual tests</Link><Link to={`/${slug}/checkups`} aria-current={view === "packages" ? "page" : undefined}>Health checkups</Link></div></div>}
        {lab.isDemo && data.tests.some((test) => test.priceIsSample) && <p className="lb-sample-note">Demo catalogue: missing prices use illustrative sample amounts. Your lab sets its own prices.</p>}
        {view !== "home" && <div className="cols">

          <main>
            <section className="lb-catalog-section" id="tests">
              <p className="lb-eyebrow">{view === "packages" ? "A CHECKUP FOR YOUR NEXT STEP" : "FIND THE TEST YOU’RE LOOKING FOR"}</p>
              <h2>{view === "packages" ? "Choose a checkup" : t.findTitle}</h2>
              <p className="muted small">Search by test name, abbreviation, or health category.</p>
              <div className="lb-search-box">
              <input
                id="catalog-search"
                className="search"
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCategory("All"); }}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAria}
                aria-controls="catalog-results"
              />
              {query && <button type="button" onClick={() => { setQuery(""); document.getElementById("catalog-search")?.focus(); }} aria-label="Clear search">Clear</button>}
              </div>
              <div className="lb-search-tools">

                <label className="lb-sort-label">{copy.sort}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="catalog">{copy.standard}</option><option value="price">{copy.low}</option><option value="name">{copy.nameSort}</option></select></label>
                {lab.homeCollection && <label className="lb-home-filter"><input type="checkbox" checked={homeOnly} onChange={(event) => setHomeOnly(event.target.checked)} />{copy.collectionOnly}</label>}
              </div>
              {view === "tests" && !query && <div className="lb-popular"><span>Try:</span>{["CBC", "Thyroid", "Sugar", "Vitamin"].map((term) => <button type="button" key={term} onClick={() => { setQuery(term); setCategory("All"); }}>{term}</button>)}</div>}
              <div id="catalog-results">
              {searchMode !== "packages" && <TestList
                tests={catalogTests}
                categories={data.categories}
                lab={lab}
                query={query}
                category={category}
                onCategory={(name) => navigate(`/${slug}/tests${name === "All" ? "" : `?category=${encodeURIComponent(name)}`}`)}
                picked={picked.tests}
                onToggle={toggleTest}
                onBook={(code) => bookItem("tests", code)}
                resetKey={`${homeOnly}:${sort}`}
                onAddQueryToNotes={addQueryToNotes}
              />}
              {searchMode !== "tests" && <div id="packages" className="lb-search-packages"><h3>{query.trim() ? (lang === "te" ? "సరిపోలిన చెకప్‌లు" : "Matching checkups") : t.packagesTitle}</h3>{visiblePackages.length ? <Packages packages={visiblePackages} lab={lab} byCode={byCode} picked={picked.packages} onToggle={togglePackage} onBook={(code) => bookItem("packages", code)} /> : <div className="empty" role="status"><h3>{copy.emptyPackages}</h3><p>{copy.tryAgain}</p><button type="button" className="btn btn-ghost" onClick={() => { setQuery(""); setHomeOnly(false); }}>{copy.available}</button></div>}</div>}
              </div>
            </section>

            {view === "packages" && !query.trim() && <section className="lb-catalog-section"><h2>{t.audienceTitle}</h2><AudienceTiles slug={slug} /></section>}

            {lab.about && <section className="card"><h2>{t.aboutHeading(lab.name)}</h2><p className="muted">{lab.about}</p></section>}
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

            <section className="card lb-booking-help" id="book">
              <h2>{lang === "te" ? "మీ సందర్శనకు సిద్ధమా?" : "Ready to plan your visit?"}</h2>
              <p className="muted small">{lang === "te" ? "టెస్టులు ఎంచుకుని మీకు అనుకూలమైన సమయాన్ని ఎంచుకోండి." : "Choose your tests, then select collection and an available time."}</p>
              <button type="button" className="btn btn-primary" onClick={() => setBookingOpen(true)}>{lang === "te" ? "బుకింగ్‌కు కొనసాగండి" : "Continue to booking"}</button>
              {lab.homeCollection && <button type="button" className="lb-browse-link" onClick={() => openHelp("home_collection")}>{lang === "te" ? "హోమ్ కలెక్షన్‌లో సహాయం" : "Need help with home collection?"}</button>}
            </section>
          </aside>
        </div>}
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

            <button type="button" className="btn btn-primary bar-go" onClick={() => setBookingOpen(true)}>{t.continue}</button>
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

      <LabFooter lab={lab} />
    </div>
  );
}
