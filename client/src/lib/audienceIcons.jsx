/**
 * Line icons for the "who is this for" tiles (Men, Women, Kids, Seniors) on
 * the public booking page. Drawn the same way as categoryIcons.jsx — plain
 * inline SVG, no photos — for the same reason: nothing here should look like
 * a real person or a stock photo that was downloaded from somewhere else.
 */
import { memo } from "react";

const paths = {
  men: "M12 11a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5 20.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5 M10.3 14.3l1.7 2 1.7-2",
  women: "M12 11a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M8 14.6c-1.9 1.1-3 3.3-3 5.9h14c0-2.6-1.1-4.8-3-5.9-1.1 1.9-2.1 2.9-4 2.9s-2.9-1-4-2.9Z",
  kids: "M12 10.3a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z M7.3 19.8c0-3 2.1-5.4 4.7-5.4s4.7 2.4 4.7 5.4 M18.3 17a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z",
  seniors: "M12 11a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M6.3 20.5c0-3.5 2.5-6.3 5.9-6.5 M17.7 20.5c-.2-1.9-1.2-3.5-2.6-4.6 M16.3 14.6l1 6.3 M17.5 14.3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
};

const FALLBACK = paths.men;

function AudienceIcon({ audience, size = 24 }) {
  const d = paths[audience] || FALLBACK;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}

export default memo(AudienceIcon);
