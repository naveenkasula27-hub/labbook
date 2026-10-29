import { useLang } from "../lib/i18n.jsx";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Choose language">
      <button
        type="button"
        className="lang-btn"
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <button
        type="button"
        className="lang-btn"
        aria-pressed={lang === "te"}
        onClick={() => setLang("te")}
      >
        తె
      </button>
    </div>
  );
}
