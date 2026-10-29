/**
 * One simple line icon per test category. Drawn as inline SVG paths, not
 * photos — nothing here implies a real person or a real lab that doesn't
 * exist. Every icon takes its colour from the surrounding chip (currentColor),
 * so it follows each lab's own brand colour automatically.
 *
 * Add a category here by its exact name from the catalog; anything not
 * listed falls back to the generic test-tube icon, so a new category a lab
 * adds later never renders blank.
 */
import { memo } from "react";

const paths = {
  All: "M4 7h16M4 12h16M4 17h10",
  Routine: "M4 7h16M4 12h16M4 17h10",
  Blood: "M12 3c3 4 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 3-7 6-11Z",
  Diabetes: "M12 3c3 4 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 3-7 6-11Z M9.5 14l2-3 1.5 2 1.5-2",
  Fever: "M9 3v10a3 3 0 1 0 6 0V3H9Z M10 3h4 M10.5 7h3 M10.5 10h3",
  Heart: "M12 21s-7-4.4-9.3-8.8C1.1 8.8 2.6 5.5 6 5c2-.3 3.6.8 4.6 2.2L12 9l1.4-1.8C14.4 5.8 16 4.7 18 5c3.4.5 4.9 3.8 3.3 7.2C19 16.6 12 21 12 21Z",
  Hormones: "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M17 9a3 3 0 1 0 0-6 M7 21a3 3 0 1 0 0-6",
  Infection: "M12 2v4 M12 18v4 M4.9 4.9l2.8 2.8 M16.3 16.3l2.8 2.8 M2 12h4 M18 12h4 M4.9 19.1l2.8-2.8 M16.3 7.7l2.8-2.8 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  Kidney: "M12 3C8 3 5 6.5 5 11c0 5 2.5 9.5 6 9.5 1.3 0 1.6-1.5 1-3-.7-1.7-.5-3.3 1-4.2 3-1.8 5-4.1 5-6.5C18 4 15.3 3 12 3Z",
  Liver: "M4 10c0-3 3-6 8-6 5.5 0 8 3.3 8 7 0 5-4 9-9 9-3.5 0-7-2-7-6 0-1.6.7-2.8 0-4Z",
  Markers: "M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z",
  Scans: "M4 4h16v16H4z M4 9h16 M9 4v16",
  Stool: "M6 10c0-3 2.7-5.5 6-5.5S18 7 18 10c2 1 2 5-1 6-1 2.5-3.5 4-7 4-4 0-7-2-7.5-5-2-1-1.6-4 .5-5Z",
  Thyroid: "M9.3 5c-2 .3-3 2.5-2.7 5.3.3 2.7 1.7 5.2 3.4 5.2.9 0 1.2-.8.9-2-.3-1.2-.3-2.3 0-3.5.4-1.7.1-3.3-.7-5 M14.7 5c2 .3 3 2.5 2.7 5.3-.3 2.7-1.7 5.2-3.4 5.2-.9 0-1.2-.8-.9-2 .3-1.2.3-2.3 0-3.5-.4-1.7-.1-3.3.7-5 M10.2 10.3h3.6",
  Urine: "M9 3h6v4l3 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8l3-4V3Z",
  Vitamins: "M12 2v6 M12 16v6 M4.9 4.9l4.2 4.2 M14.9 14.9l4.2 4.2 M2 12h6 M16 12h6 M4.9 19.1l4.2-4.2 M14.9 9.1l4.2-4.2",
  Clotting: "M12 3c3 4 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 3-7 6-11Z M9 13l2 2 4-4",
};

const FALLBACK = "M9 2h6v4.5l3.2 3.9c.5.6.8 1.4.8 2.2V19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6.4c0-.8.3-1.6.8-2.2L9 6.5V2Z M8 15h8";

function CategoryIcon({ category, size = 22 }) {
  const d = paths[category] || FALLBACK;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}

export default memo(CategoryIcon);
