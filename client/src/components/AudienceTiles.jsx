import { useLang } from "../lib/i18n.jsx";
import AudienceIcon from "../lib/audienceIcons.jsx";

const TAGS = ["men", "women", "kids", "seniors"];

/**
 * "Who is this for?" tile row above the packages list. Each tile is a tag a
 * lab owner sets on their own packages in the dashboard (see PricesPage) —
 * clicking one filters the package list below to just that tag, instead of
 * making people read every package name to find the one meant for them.
 */
export default function AudienceTiles({ active, onSelect }) {
  const { t } = useLang();
  const labelFor = { men: t.audienceMen, women: t.audienceWomen, kids: t.audienceKids, seniors: t.audienceSeniors };

  return (
    <div className="audience-tiles" role="group" aria-label={t.audienceTitle}>
      {TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          className="audience-tile"
          aria-pressed={active === tag}
          onClick={() => onSelect(active === tag ? null : tag)}
        >
          <span className="audience-tile-icon" aria-hidden="true">
            <AudienceIcon audience={tag} size={28} />
          </span>
          <span className="audience-tile-label">{labelFor[tag]}</span>
        </button>
      ))}
    </div>
  );
}
