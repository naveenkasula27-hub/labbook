/**
 * A small original line illustration for the "About" band — a clipboard,
 * a test tube and a heartbeat line. Not a photo, not a stock image, not
 * any other lab's artwork: hand-built shapes using the lab's own brand
 * colour (currentColor), same approach as categoryIcons/audienceIcons.
 */
export default function AboutIllustration({ size = 220 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="110" cy="110" r="100" fill="currentColor" opacity="0.07" />

      {/* Clipboard */}
      <rect x="52" y="48" width="78" height="104" rx="10" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="78" y="40" width="26" height="14" rx="5" fill="currentColor" />
      <line x1="66" y1="82" x2="104" y2="82" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <line x1="66" y1="96" x2="112" y2="96" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <line x1="66" y1="110" x2="96" y2="110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M64 130l10 10 18-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Test tube */}
      <g transform="translate(118,70) rotate(18)">
        <path d="M0 0h26v62a13 13 0 0 1-26 0V0Z" fill="#fff" stroke="currentColor" strokeWidth="3" />
        <path d="M0 34h26v28a13 13 0 0 1-26 0V34Z" fill="currentColor" opacity="0.8" />
        <line x1="-4" y1="0" x2="30" y2="0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Heartbeat line under everything */}
      <path
        d="M30 176h34l10-20 12 34 10-24 8 10h86"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}
