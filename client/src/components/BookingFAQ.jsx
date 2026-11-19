import { money } from "../lib/api.js";
import { useLang } from "../lib/i18n.jsx";
import { EXPERIENCE } from "../lib/experience.js";

export default function BookingFAQ({ lab, onHelp }) {
  const { lang } = useLang();
  const copy = EXPERIENCE[lang];
  const questions = lang === "te" ? [
    ["ఏ టెస్టు ఎంచుకోవాలో తెలియకపోతే?", "మీ డాక్టర్ సూచించిన టెస్టు పేరుతో వెతకండి. బుకింగ్‌లో సహాయం కోసం ల్యాబ్‌కు కాల్ చేయండి లేదా కాల్ అభ్యర్థించండి."],
    ["హోమ్ కలెక్షన్ అందుబాటులో ఉందా?", lab.homeCollection ? `అర్హత ఉన్న టెస్టులకు హోమ్ కలెక్షన్ ఉంది. సేకరణ రుసుము: ${money(lab.homeCollectionFee || 0, lab)}. చిరునామా, సమయాన్ని బుకింగ్ సమయంలో నిర్ధారించండి.` : "ఈ ల్యాబ్ ప్రస్తుతం ఆన్‌లైన్‌లో ల్యాబ్ సందర్శన బుకింగ్‌లను అందిస్తోంది."],
    ["ఉపవాసం అవసరమా?", "టెస్టును బట్టి సన్నాహాలు మారుతాయి. టెస్టు కార్డులోని వివరాలను చదవండి. సందేహం ఉంటే ల్యాబ్‌ను అడగండి."],
    ["రిపోర్ట్ ఎప్పుడు వస్తుంది?", "టెస్టు కార్డులో ఉన్న రిపోర్ట్ సమయాన్ని చూడండి. ల్యాబ్ విడుదల చేసిన తరువాత బుకింగ్ రిఫరెన్స్, పూర్తి ఫోన్ నంబర్‌తో రిపోర్ట్ పొందండి."],
    ["కాల్ అభ్యర్థనతో అపాయింట్‌మెంట్ బుక్ అవుతుందా?", "కాదు. అది ల్యాబ్ బృందం సహాయం కోసం మాత్రమే. అపాయింట్‌మెంట్ కోసం బుకింగ్ ఫారమ్ పూర్తి చేసి మీ బుకింగ్ రిఫరెన్స్ పొందండి."],
  ] : [
    ["Not sure which test to choose?", "Search for the test your doctor requested. For help with availability or booking, call the lab or request a callback."],
    ["Can I book home collection?", lab.homeCollection ? `Home collection is available for eligible tests. The collection fee is ${money(lab.homeCollectionFee || 0, lab)}. Confirm your address and collection choice in the booking form.${lab.homeCollectionNote ? ` ${lab.homeCollectionNote}` : ""}` : "This lab currently accepts online bookings for visits to the lab."],
    ["Do I need to fast before my test?", "Preparation depends on the test. Open the preparation details on the test card and check with the lab if anything is unclear."],
    ["When can I see my reports?", "Check the report time shown for your test. Once the lab releases your report, use your booking reference and full booking phone number to access it."],
    ["Does a callback request book an appointment?", "No. It asks the lab team to help you. To book an appointment, complete the booking form and keep the booking reference you receive."],
  ];
  return <section className="lb-faq" aria-labelledby="booking-faq-title"><div><p className="lb-eyebrow">{lab.name}</p><h2 id="booking-faq-title">{copy.faqTitle}</h2><p>{copy.faqIntro}</p><button type="button" className="btn btn-ghost" onClick={onHelp}>{copy.help}</button></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>;
}
