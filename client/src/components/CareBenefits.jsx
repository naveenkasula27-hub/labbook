import { useLang } from "../lib/i18n.jsx";
import { EXPERIENCE } from "../lib/experience.js";

export default function CareBenefits({ lab }) {
  const { lang } = useLang();
  const copy = EXPERIENCE[lang];
  const cards = [
    [copy.choices, copy.choicesBody],
    [copy.price, copy.priceBody],
    [lab.homeCollection ? copy.collection : copy.labCollection, lab.homeCollection ? copy.collectionBody : copy.labCollectionBody],
    [copy.report, copy.reportBody],
  ];
  return <section className="lb-care" aria-labelledby="care-benefits-title">
    <div className="lb-care-heading"><p className="lb-eyebrow">{lab.name}</p><h2 id="care-benefits-title">{copy.mapTitle}</h2><p>{copy.mapIntro}</p></div>
    <div className="lb-care-map">
      <div className="lb-care-image"><img src="/images/care-anatomy-800.webp" srcSet="/images/care-anatomy-400.webp 400w, /images/care-anatomy-800.webp 800w" sizes="(max-width: 760px) calc(100vw - 48px), 380px" decoding="async" alt={lang === "te" ? "గుండె, ఊపిరితిత్తులను చూపించే వైద్య విద్యా చిత్రం" : "Educational illustration of the heart and lungs"} loading="lazy" width="800" height="875" /></div>
      {cards.map(([title, description], index) => <article className={`lb-care-note lb-care-note-${index}`} key={title}><span className="lb-care-line" aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}
    </div>
  </section>;
}
