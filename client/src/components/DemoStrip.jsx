import { useLang } from "../lib/i18n.jsx";

/**
 * The bar above a demo lab's page.
 *
 * Two jobs. It tells visitors the lab is a sample rather than a real business,
 * so nobody enters real personal details or thinks they are booking a test.
 * And it says who built the thing, since the whole point of a public demo is
 * that somebody sees the work and gets in touch.
 *
 * The mark is drawn rather than loaded as an image: it stays sharp at any size,
 * costs no extra request, and takes its colours from the brand palette.
 */

/** The split-U: left half navy, right half orange. */
function UnityMark({ size = 30 }) {
  // One closed path forms the U, then each half is clipped out of it.
  const U = "M20,10 V60 A30,30 0 0 0 80,60 V10 H62 V60 A12,12 0 0 1 38,60 V10 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="UnityWebWorks"
      className="uww-mark"
    >
      <defs>
        <clipPath id="uww-left">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id="uww-right">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      <path d={U} fill="#14213D" clipPath="url(#uww-left)" />
      <path d={U} fill="#FF6A1F" clipPath="url(#uww-right)" />
    </svg>
  );
}

export default function DemoStrip({ labName }) {
  const { t } = useLang();
  return (
    <div className="demo-strip">
      <div className="wrap demo-strip-inner">
        <a
          className="uww-lockup"
          href="https://unitywebworks.com"
          target="_blank"
          rel="noopener"
        >
          <UnityMark />
          <span className="uww-words">
            <span className="uww-name">
              Unity<em>Web</em>Works
            </span>
            <span className="uww-tagline">Build · Grow · Automate</span>
          </span>
        </a>

        <p className="demo-note">
          {/* A slow pulse, so the eye lands here first. Nothing slides or
              scrolls: moving text on a lab's page looks like an advert and is
              hard to read. */}
          <span className="demo-pip" aria-hidden="true" />
          <strong>{t.demoSiteBold}</strong> {t.demoSiteRest(labName)}
        </p>
      </div>
    </div>
  );
}
