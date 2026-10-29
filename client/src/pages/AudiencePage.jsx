import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { getLab, money } from "../lib/api.js";
import { LangProvider, useLang } from "../lib/i18n.jsx";
import CategoryIcon from "../lib/categoryIcons.jsx";
import CATEGORY_PHOTOS from "../lib/categoryPhotos.jsx";
import { AUDIENCE_GUIDE } from "../lib/audienceGuide.js";
import LangToggle from "../components/LangToggle.jsx";
import menPhoto from "../assets/audience/men.jpg";
import womenPhoto from "../assets/audience/women.jpg";
import kidsPhoto from "../assets/audience/kids.jpg";
import seniorsPhoto from "../assets/audience/seniors.jpg";

const HERO_PHOTOS = { men: menPhoto, women: womenPhoto, kids: kidsPhoto, seniors: seniorsPhoto };

// Picks made on this page are handed to the booking page through
// sessionStorage rather than a shared cart, since this is a separate route
// from BookingPage and the two never share React state. BookingPage reads
// this key once on load, merges the codes into its own basket, and clears
// it — so it only ever applies once per visit here.
const pendingKey = (slug) => `labbook-pending-tests:${slug}`;

function readPending(slug) {
  try {
    const raw = sessionStorage.getItem(pendingKey(slug));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writePending(slug, set) {
  try {
    sessionStorage.setItem(pendingKey(slug), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export default function AudiencePage() {
  return (
    <LangProvider>
      <AudiencePageInner />
    </LangProvider>
  );
}

function AudiencePageInner() {
  const { t } = useLang();
  const { slug, audience } = useParams();
  const guide = AUDIENCE_GUIDE[audience];

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [added, setAdded] = useState(() => readPending(slug));

  function toggleAdd(code) {
    setAdded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      writePending(slug, next);
      return next;
    });
  }

  function addAllInGroup(items) {
    setAdded((prev) => {
      const next = new Set(prev);
      for (const item of items) next.add(item.code);
      writePending(slug, next);
      return next;
    });
  }

  useEffect(() => {
    if (!guide) return;
    let alive = true;
    setData(null);
    setLoadError("");
    getLab(slug)
      .then((d) => {
        if (!alive) return;
        if (!d || !d.lab) {
          setLoadError("This lab's booking page could not be loaded.");
          return;
        }
        setData({ lab: d.lab, tests: d.tests || [] });
      })
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [slug, guide]);

  const labelFor = {
    men: t.audienceMen,
    women: t.audienceWomen,
    kids: t.audienceKids,
    seniors: t.audienceSeniors,
  }[audience];

  useEffect(() => {
    if (!data) return;
    document.title = `${t.guideHeading(labelFor)} — ${data.lab.name}`;
    // Same lab-theme handoff as the booking page, so this page matches the
    // lab's own colours rather than LabBook's defaults.
    const root = document.documentElement;
    if (data.lab.theme?.primary) root.style.setProperty("--primary", data.lab.theme.primary);
    if (data.lab.theme?.accent) root.style.setProperty("--accent", data.lab.theme.accent);
    root.style.setProperty("--cta", data.lab.theme?.cta || data.lab.theme?.primary || "");
  }, [data, labelFor, t]);

  const byCode = useMemo(() => {
    const m = {};
    for (const test of data?.tests || []) m[test.code] = test;
    return m;
  }, [data]);

  // Each group's codes matched against what this lab actually has — a code
  // with no match at this lab is left out rather than shown as a fake row,
  // and a group that ends up with nothing real doesn't render at all.
  const groups = useMemo(() => {
    if (!guide) return [];
    return guide.groups
      .map((group) => {
        const items = group.codes
          .map((entry) => {
            const code = typeof entry === "string" ? entry : entry.code;
            const badge = typeof entry === "string" ? null : entry.badge;
            const test = byCode[code];
            return test ? { ...test, guideBadge: badge } : null;
          })
          .filter(Boolean);
        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  }, [guide, byCode]);

  if (!guide) return <Navigate to={`/${slug}`} replace />;

  if (loadError) {
    return (
      <main className="center">
        <div className="card">
          <h1>{t.notAvailableTitle}</h1>
          <p className="muted">{loadError}</p>
          <Link className="btn btn-ghost" to={`/${slug}`}>{t.guideBackToTests}</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="center">
        <p className="muted">{t.loading}</p>
      </main>
    );
  }

  const { lab } = data;

  return (
    <>
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
            <LangToggle />
          </div>
        </div>
      </header>

      <div className="guide-hero">
        <div className="wrap guide-hero-inner">
          <span className="guide-hero-photo">
            <img src={HERO_PHOTOS[audience]} alt="" />
          </span>
          <div>
            <h1>{t.guideHeading(labelFor)}</h1>
            <p>{guide.ageNote}</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <p style={{ margin: "16px 0" }}>
          <Link className="guide-back" to={`/${slug}`}>← {t.guideBackToTests}</Link>
        </p>

        {groups.length === 0 ? (
          <div className="card guide-empty">
            <h2>{t.guideEmptyTitle}</h2>
            <p className="muted">{t.guideEmptyBody(lab.name)}</p>
            <div className="guide-actions">
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
              <a className="btn btn-ghost" href={`tel:${lab.phone.replace(/\s/g, "")}`}>{t.aboutCall}</a>
            </div>
          </div>
        ) : (
          groups.map((group) => {
            const priced = group.items.filter((i) => typeof i.price === "number");
            const total = priced.length ? priced.reduce((sum, i) => sum + i.price, 0) : null;

            const allInGroupAdded = group.items.every((i) => added.has(i.code));

            return (
              <section className="card guide-group" key={group.title}>
                <div className="guide-group-head">
                  <h2>{group.title}</h2>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => addAllInGroup(group.items)}
                    disabled={allInGroupAdded}
                  >
                    {allInGroupAdded ? t.added : t.guideAddAll}
                  </button>
                </div>

                <ul className="tests test-cards">
                  {group.items.map((test) => {
                    const on = added.has(test.code);
                    return (
                      <li className="test-card" key={test.code}>
                        <div className="test-card-top">
                          <span className="test-card-icon guide-card-icon" aria-hidden="true">
                            {CATEGORY_PHOTOS[test.category] ? (
                              <img className="icon-chip-photo" src={CATEGORY_PHOTOS[test.category]} alt="" />
                            ) : (
                              <CategoryIcon category={test.category} size={26} />
                            )}
                          </span>
                          <div className="test-card-body">
                            <h3>{test.name}</h3>
                            <div className="test-card-badges">
                              {test.reportTime && <span className="badge">{test.reportTime}</span>}
                              <span className="badge badge-muted">{t.sampleType(test.sample)}</span>
                              {test.guideBadge && <span className="badge badge-warn">{test.guideBadge}</span>}
                            </div>
                            {test.fasting && <p className="test-fast">{test.fasting}</p>}
                          </div>
                        </div>
                        <div className="test-card-right">
                          <span className="test-card-price">
                            {typeof test.price === "number" ? money(test.price, lab) : t.guideAskLab}
                          </span>
                          <button
                            type="button"
                            className="add"
                            data-on={on}
                            onClick={() => toggleAdd(test.code)}
                            aria-label={`${on ? t.added : t.add} ${test.name}`}
                          >
                            {on ? t.added : t.add}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {total !== null && (
                  <p className="guide-total">
                    {t.guideEstimated}: {money(total, lab)}
                    {priced.length < group.items.length && (
                      <span className="muted small"> — {t.notAllPriced}</span>
                    )}
                  </p>
                )}
              </section>
            );
          })
        )}

        {groups.length > 0 && (
          <div className="guide-actions">
            <Link className="btn btn-primary" to={`/${slug}`}>
              {added.size > 0 ? t.guideGoToBookingWithCount(added.size) : t.guideGoToBooking}
            </Link>
            {lab.whatsapp && (
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(
                  `Hello ${lab.name}, I have a question about the ${labelFor} checkup.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.aboutChat}
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
