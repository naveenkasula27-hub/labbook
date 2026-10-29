/**
 * The front page of the site.
 *
 * Who lands here: a lab owner who tapped an ad, on a phone, with about ten
 * seconds of patience. The page has one job, which is to get them into the
 * live demo and then onto WhatsApp.
 *
 * The hero shows both sides of a booking at once, because the question a lab
 * owner actually has is "what do I see when somebody books", and a sentence
 * answers that worse than a picture of the two screens does.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../landing.css";

const WHATSAPP = "917729069137";
const PHONE = "+917729069137";
const PHONE_SHOWN = "77290 69137";

/**
 * The UnityWebWorks Meta pixel, loaded on this page and nowhere else.
 *
 * Deliberately not in index.html, which would put it on every lab's booking
 * page too. A booking page is where somebody chooses a blood test, and sending
 * that to Meta means telling them which medical tests a named person looked at.
 * This page is a sales page for lab owners, which is a different thing.
 */
const PIXEL_ID = "1801056284665498";

const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** Fire an event, quietly doing nothing if the pixel never loaded. */
const track = (name) => {
  try {
    window.fbq?.("trackCustom", name);
  } catch {
    /* an ad blocker, or the script failed. Not worth breaking a click over. */
  }
};

export default function LandingPage() {
  useEffect(() => {
    document.title = "LabBook — online test booking for diagnostic labs";
  }, []);

  useEffect(() => {
    if (window.fbq) return; // already loaded, e.g. after a client-side nav back

    /* eslint-disable */
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }, []);

  return (
    <div className="lp">
      {/* ---------- top bar ---------- */}
      <div className="lp-top">
        <div className="lp-wrap">
          <a className="uww-lockup" href="https://unitywebworks.com" target="_blank" rel="noopener">
            <svg width="30" height="30" viewBox="0 0 100 100" role="img" aria-label="UnityWebWorks" className="uww-mark">
              <defs>
                <clipPath id="lp-u-l"><rect x="0" y="0" width="50" height="100" /></clipPath>
                <clipPath id="lp-u-r"><rect x="50" y="0" width="50" height="100" /></clipPath>
              </defs>
              <path d="M20,10 V60 A30,30 0 0 0 80,60 V10 H62 V60 A12,12 0 0 1 38,60 V10 Z" fill="#14213D" clipPath="url(#lp-u-l)" />
              <path d="M20,10 V60 A30,30 0 0 0 80,60 V10 H62 V60 A12,12 0 0 1 38,60 V10 Z" fill="#FF6A1F" clipPath="url(#lp-u-r)" />
            </svg>
            <span className="uww-words">
              <span className="uww-name">Unity<em>Web</em>Works</span>
              <span className="uww-tagline">Build · Grow · Automate</span>
            </span>
          </a>

          <div className="lp-top-links">
            <Link to="/signup" onClick={() => track("ClickedSignupTop")}>
              Sign up
            </Link>
            <a href={`tel:${PHONE}`}>
              Call<span className="lp-hide-sm"> {PHONE_SHOWN}</span>
            </a>
            <a
              className="lp-wa"
              href={waLink("Hello Naveen, I run a diagnostic lab and I saw your booking page.")}
              onClick={() => track("ClickedWhatsApp")}
              target="_blank"
              rel="noopener"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ---------- hero ---------- */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-grid">
            <div className="lp-hero-text">
              <h1>Your patients book tests from their phone. You see it on yours.</h1>
              <p className="lp-sub">
                A booking page for your lab, with your tests and your prices. Patients pick
                what they need and a time to come in. The booking shows up on your screen
                straight away. No app for anyone to install.
              </p>

              <div className="lp-actions">
                <Link className="lp-btn lp-btn-main" to="/maheera" onClick={() => track("OpenedDemo")}>
                  Open the live demo
                </Link>
                <a
                  className="lp-btn lp-btn-quiet"
                  href={waLink("Hello Naveen, I run a diagnostic lab and I want a booking page like the demo.")}
                  onClick={() => track("ClickedWhatsApp")}
                  target="_blank"
                  rel="noopener"
                >
                  Message me on WhatsApp
                </a>
              </div>
            </div>

            {/* The patient's side, then the lab's side. */}
            <div className="lp-screens">
            <div className="lp-phone" aria-hidden="true">
              <div className="lp-phone-head">Maheera Diagnostics</div>
              <div className="lp-field">
                <strong>Complete Blood Count</strong>
                ₹300 · report same day
              </div>
              <div className="lp-field">
                <strong>Ramesh Kumar</strong>
                54, Male · 99490 70916
              </div>
              <div className="lp-field">
                <strong>Tomorrow, 9:00 AM</strong>
                At the lab
              </div>
              <div className="lp-mini-btn">Confirm booking</div>
            </div>

            <div className="lp-arrow" aria-hidden="true">
              <svg width="54" height="22" viewBox="0 0 54 22" fill="none">
                <path d="M0 11h46M38 4l8 7-8 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="lp-screen" aria-hidden="true">
              <div className="lp-screen-head">
                <span className="lp-dot" />
                <span className="lp-dot" />
                <span className="lp-dot" />
                <span>Maheera Diagnostics · today</span>
              </div>
              <div className="lp-screen-body">
                <h3>Bookings</h3>
                <div className="lp-row lp-row-arriving">
                  <div>
                    <div className="lp-row-name">Ramesh Kumar</div>
                    <div className="lp-row-meta">9:00 AM · Complete Blood Count · ₹300</div>
                  </div>
                  <span className="lp-tag lp-tag-new">New</span>
                </div>
                <div className="lp-row">
                  <div>
                    <div className="lp-row-name">Sunitha K</div>
                    <div className="lp-row-meta">11:30 AM · Thyroid Profile · ₹500</div>
                  </div>
                  <span className="lp-tag">Sample taken</span>
                </div>
                <div className="lp-row">
                  <div>
                    <div className="lp-row-name">Imran Ali</div>
                    <div className="lp-row-meta">Home collection · Fever Panel · ₹1,200</div>
                  </div>
                  <span className="lp-tag">Report ready</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="lp-band">
        <div className="lp-wrap">
          <h2>How a booking reaches you</h2>

          <div className="lp-steps">
            <div className="lp-step">
              <h3>The patient picks</h3>
              <p>
                They open your page, choose tests or a health package, and pick a day and a
                time slot. They see the price before they book.
              </p>
            </div>
            <div className="lp-step">
              <h3>It lands on your screen</h3>
              <p>
                Name, age, phone, what they booked and when. You get a WhatsApp message too,
                so you know without checking.
              </p>
            </div>
            <div className="lp-step">
              <h3>You work through the day</h3>
              <p>
                Mark each one confirmed, sample taken, report ready. The patient gets a
                message when the report is done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- the demo ---------- */}
      <section className="lp-band lp-band-pale">
        <div className="lp-wrap">
          <h2>Try it before you talk to me</h2>
          <p>
            Maheera Diagnostics is a sample lab set up to show how this works. Book a test on
            it, then sign in and watch your own booking appear. Change the prices if you want.
            Everything resets, so nothing you do there matters.
          </p>

          <div className="lp-actions" style={{ marginTop: 22 }}>
            <Link className="lp-btn lp-btn-main" to="/maheera" onClick={() => track("OpenedDemo")}>
              Try booking a test — patient's view
            </Link>
            <Link
              className="lp-btn"
              to="/dashboard"
              onClick={() => track("OpenedDemoDashboard")}
              style={{ background: "#fff", color: "#14213D", boxShadow: "inset 0 0 0 1.5px #D9BCA6" }}
            >
              See the owner's dashboard
            </Link>
          </div>

          <div className="lp-creds">
            <span>Sign in with</span> demo@maheera.test <span>and</span> demo1234
          </div>
        </div>
      </section>

      {/* ---------- what you get ---------- */}
      <section className="lp-band">
        <div className="lp-wrap">
          <h2>What your lab gets</h2>
          <ul className="lp-list">
            <li>Your own page, with your lab's name, your tests and your prices</li>
            <li>Health checkup packages priced as a set</li>
            <li>Home sample collection, with the extra charge handled</li>
            <li>Time slots with a limit, so nine people cannot book the same 8 AM</li>
            <li>A dashboard that works on your phone, not just a computer</li>
            <li>WhatsApp confirmations to the patient and to you</li>
            <li>Nothing for patients to download or sign up for</li>
          </ul>
        </div>
      </section>

      {/* ---------- the offer ---------- */}
      <section className="lp-band lp-band-navy">
        <div className="lp-wrap">
          <h2>I build yours first. You decide after.</h2>
          <p>
            Send me your lab's name and the tests you do. I set up your page with your own
            tests and prices, and send you the link. You try it, show it to whoever you want,
            and take your time. If it is not useful to you, that is the end of it and you owe
            nothing.
          </p>

          <div className="lp-actions" style={{ marginTop: 26 }}>
            <a
              className="lp-btn lp-btn-main"
              href={waLink("Hello Naveen, I run a diagnostic lab and I want a booking page for it.")}
              onClick={() => track("ClickedWhatsApp")}
              target="_blank"
              rel="noopener"
            >
              WhatsApp {PHONE_SHOWN}
            </a>
            <a className="lp-btn lp-btn-quiet" href={`tel:${PHONE}`}>
              Call instead
            </a>
          </div>

          <p className="lp-signup-alt">
            In a hurry? <Link to="/signup" onClick={() => track("ClickedSignupBottom")}>Set up your own lab right now</Link> —
            no waiting on me, start on a free trial and add your own tests and prices.
          </p>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          Built by <a href="https://unitywebworks.com" target="_blank" rel="noopener">UnityWebWorks</a>,
          Medak and Hyderabad, Telangana. Maheera Diagnostics is a sample lab, not a real business.
          <br />
          <Link to="/privacy">Privacy policy</Link> · <Link to="/terms">Terms of service</Link>
        </div>
      </footer>
    </div>
  );
}
