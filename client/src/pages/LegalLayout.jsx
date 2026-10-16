/**
 * The shell around the privacy policy and the terms.
 *
 * Both pages are read by two very different people: a patient who clicked a
 * link next to a consent box and wants to know who sees their phone number,
 * and a lab owner deciding whether to trust this with their business. So the
 * layout stays plain and the text does the work.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../landing.css";
import "../legal.css";

export default function LegalLayout({ title, updated, children }) {
  useEffect(() => {
    document.title = `${title} — LabBook by UnityWebWorks`;
  }, [title]);

  return (
    <div className="lp">
      <div className="lp-top">
        <div className="lp-wrap">
          <Link className="uww-lockup" to="/">
            <svg width="30" height="30" viewBox="0 0 100 100" role="img" aria-label="UnityWebWorks" className="uww-mark">
              <defs>
                <clipPath id="lg-u-l"><rect x="0" y="0" width="50" height="100" /></clipPath>
                <clipPath id="lg-u-r"><rect x="50" y="0" width="50" height="100" /></clipPath>
              </defs>
              <path d="M20,10 V60 A30,30 0 0 0 80,60 V10 H62 V60 A12,12 0 0 1 38,60 V10 Z" fill="#14213D" clipPath="url(#lg-u-l)" />
              <path d="M20,10 V60 A30,30 0 0 0 80,60 V10 H62 V60 A12,12 0 0 1 38,60 V10 Z" fill="#FF6A1F" clipPath="url(#lg-u-r)" />
            </svg>
            <span className="uww-words">
              <span className="uww-name">Unity<em>Web</em>Works</span>
              <span className="uww-tagline">Build · Grow · Automate</span>
            </span>
          </Link>

          <div className="lp-top-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>

      <article className="legal">
        <div className="legal-wrap">
          <h1>{title}</h1>
          <p className="legal-date">Last updated {updated}</p>
          {children}
        </div>
      </article>

      <footer className="lp-foot">
        <div className="lp-wrap">
          LabBook is built by <a href="https://unitywebworks.com" target="_blank" rel="noopener">UnityWebWorks</a>,
          Hyderabad and Medak, Telangana. Questions: 77290 69137 or hello@unitywebworks.com
        </div>
      </footer>
    </div>
  );
}
