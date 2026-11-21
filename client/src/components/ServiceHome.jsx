import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { catalogImage, sceneImage } from "../lib/catalog.js";
import { money } from "../lib/api.js";
import CareBenefits from "./CareBenefits.jsx";
import BookingFAQ from "./BookingFAQ.jsx";
import AudienceTiles from "./AudienceTiles.jsx";

function FeverTests({ tests, lab, picked, onToggle, onBook }) {
  const lane = useRef(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const fever = tests.filter((test) => test.category === 'Fever' || /\b(cbc|dengue|malaria|typhoid|widal)\b/i.test(`${test.code} ${test.name}`));
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (paused || interacting || fever.length < 2 || motion.matches) return;
    const el = lane.current;
    if (!el) return;
    let frame, previous, position = el.scrollLeft, atEnd = 0, visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(el);
    const tick = (time) => {
      const delta = previous === undefined ? 0 : Math.min(time - previous, 50);
      previous = time;
      if (visible && !document.hidden && !motion.matches) {
        const maximum = el.scrollWidth - el.clientWidth;
        if (maximum > 1) {
          position = Math.min(maximum, position + delta * 0.016);
          if (position >= maximum) {
            atEnd += delta;
            if (atEnd >= 1800) { position = 0; atEnd = 0; }
          }
          el.scrollLeft = position;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [paused, interacting, fever.length]);
  if (!fever.length) return null;
  const move = (direction) => { setPaused(true); lane.current?.scrollBy({left: direction * (lane.current.clientWidth * .85), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };
  return <section className="lb-fever" aria-labelledby="fever-heading">
    <div className="lb-fever-intro"><img className="lb-fever-care-photo" {...sceneImage("fever-care", "AI illustration of a clinician advising a patient with fever")} sizes="(max-width: 650px) 260px, 250px" width="960" height="720" loading="lazy" decoding="async" /><p className="lb-eyebrow">WHEN YOU NEED A CLOSER LOOK</p><h2 id="fever-heading">Fever tests,<br />easy to find.</h2><p>Find the test your clinician has advised and check the preparation details.</p><Link to={`/${lab.slug}/tests?category=Fever`}>View fever tests →</Link></div>
    <div className="lb-fever-content"><div className="lb-fever-heading"><p>Popular tests for fever investigations</p><div className="lb-lane-controls"><button type="button" aria-label="Previous fever tests" onClick={() => move(-1)}>←</button><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button><button type="button" aria-label="Next fever tests" onClick={() => move(1)}>→</button></div></div>
      <ul className="lb-fever-lane" ref={lane} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }} onPointerDown={() => setPaused(true)} tabIndex="0" aria-label="Fever tests; scroll for more">
        {fever.map((test) => <li className="lb-fever-card" key={test.code}><span className="lb-test-category">{test.category}</span><h3>{test.name}</h3><p>{test.sample} sample</p><p className="lb-report-line">Reports: <strong>{test.reportTime || 'Confirm with the lab'}</strong></p><div className="lb-fever-price"><div><strong>{typeof test.price === 'number' ? money(test.price, lab) : 'Ask the lab'}</strong><small>{test.priceIsSample ? 'Sample demo price' : 'Test price'}</small></div><button type="button" className="add" aria-pressed={picked.has(test.code)} aria-label={`${picked.has(test.code) ? 'Remove' : 'Add'} ${test.name}`} onClick={() => onToggle(test.code)}>{picked.has(test.code) ? 'Added ✓' : '+ Add'}</button></div><button className="lb-fever-book" type="button" onClick={() => onBook(test.code)}>Book this test →</button></li>)}
      </ul>
    </div>
  </section>;
}

export default function ServiceHome({ lab, tests, categories, picked, onToggle, onBook, onHelp }) {
  return <main>
    <section className="lb-hero" aria-labelledby="lb-hero-title"><div className="lb-hero-copy"><p className="lb-eyebrow">YOUR LOCAL LAB. A CLEAR NEXT STEP.</p><h2 id="lb-hero-title">Better care starts<br />with a simple<br /><em>health check.</em></h2><p>Tests, health checkups, and help with your booking. Find what you need at {lab.name}.</p><div className="lb-hero-actions"><Link className="btn btn-primary" to={`/${lab.slug}/tests`}>Find a test</Link><Link className="lb-home-cta" to={`/${lab.slug}/checkups`}>Explore checkups →</Link></div><p className="lb-hero-note">Choose your test · Pick a time · Follow your booking</p></div><div className="lb-hero-photo"><img src="/images/home-collection-1280.webp" srcSet="/images/home-collection-640.webp 640w, /images/home-collection-1280.webp 1280w" sizes="(max-width: 850px) 100vw, 55vw" alt="AI illustration of a healthcare professional preparing for sample collection" width="1200" height="800" fetchpriority="high" /><div className="lb-photo-note"><strong>A little help, at every step.</strong><span>Book directly with your lab.</span></div></div></section>
    <section className="lb-services-section" aria-labelledby="services-title"><div className="lb-section-heading"><div><p className="lb-eyebrow">HOW WE CAN HELP</p><h2 id="services-title">Care that fits your day</h2></div><p>A simpler way to plan your next test.</p></div><div className="lb-service-grid"><Link to={`/${lab.slug}/tests`}><span>01 / LAB TESTS</span><h3>The test you need</h3><p>Browse individual tests with clear sample, preparation, and report details.</p><b>Find a test →</b></Link><Link to={`/${lab.slug}/checkups`}><span>02 / HEALTH CHECKUPS</span><h3>A wider health picture</h3><p>Explore packages and see exactly which tests are included.</p><b>View checkups →</b></Link>{lab.homeCollection ? <button type="button" onClick={() => onHelp('home_collection')}><span>03 / HOME COLLECTION</span><h3>Care closer to home</h3><p>Request a home visit. The lab will contact you to confirm availability.</p><b>Request collection →</b></button> : <button type="button" onClick={() => onHelp()}><span>03 / BOOKING HELP</span><h3>A person to help you</h3><p>Ask the lab about test availability, preparation, and planning your visit.</p><b>Request a callback →</b></button>}<Link to={`/${lab.slug}/check`}><span>04 / YOUR REPORTS</span><h3>Keep up with your booking</h3><p>Use your booking reference to check progress and released reports.</p><b>Track your booking →</b></Link></div></section>
    {!!categories.length && <section className="lb-discover" aria-labelledby="category-title"><div className="lb-section-heading"><div><p className="lb-eyebrow">START WITH WHAT MATTERS TO YOU</p><h2 id="category-title">Explore by health category</h2></div><Link to={`/${lab.slug}/tests`}>All tests →</Link></div><div className="lb-category-grid">{categories.map((name) => <Link key={name} className="lb-category" to={`/${lab.slug}/tests?category=${encodeURIComponent(name)}`}><img {...catalogImage(name)} loading="lazy" width="120" height="120" /><span>{name}</span></Link>)}</div><p className="lb-swipe-hint">Scroll to explore more categories →</p></section>}
    <FeverTests {...{ tests, lab, picked, onToggle, onBook }} />
    <section className="lb-how"><p className="lb-eyebrow">HOW TO BOOK</p><h2>From choosing a test to getting your report</h2><ol><li><strong>Find & add your tests</strong><p>Choose a category or search by name. Add individual tests or choose a checkup.</p><Link to={`/${lab.slug}/tests`}>Explore tests →</Link></li><li><strong>Choose your collection</strong><p>Continue to booking, fill in your details, and choose an available date and time.</p></li><li><strong>Follow your booking</strong><p>Save your reference. Use it with your phone number to check status and released reports.</p><Link to={`/${lab.slug}/check`}>Check a booking →</Link></li></ol></section>
    <CareBenefits lab={lab} />
    <section className="lb-services-section"><p className="lb-eyebrow">CARE FOR EVERY STAGE</p><h2>Find a starting point for your checkup</h2><AudienceTiles slug={lab.slug} /></section>
    <BookingFAQ lab={lab} onHelp={() => onHelp()} />
    {lab.about && <section className="card"><h2>About {lab.name}</h2><p>{lab.about}</p></section>}
  </main>;
}
