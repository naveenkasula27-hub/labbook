import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Small, deliberately flat i18n for the patient-facing booking page.
 *
 * Only the page's own chrome is translated here — labels, buttons, notices.
 * Test names, package names, lab names, addresses and anything else a lab
 * owner typed in stay exactly as they typed it. Machine-translating a test
 * name risks a wrong medical term, and a lab's own words are the lab's own
 * words to keep. A lab can already give a test a local name via its alias
 * field if it wants one.
 */

export const STRINGS = {
  en: {
    callLabel: (phone) => `Call ${phone}`,
    whatsapp: "WhatsApp",
    directions: "Directions",
    checkBooking: "Check a booking",

    heroCallUs: "Call Us",
    heroWhatsapp: "WhatsApp",
    heroCheckBooking: "Check a booking",
    needHelp: "Need help?",
    needHelpSub: "Call us or message on WhatsApp",
    close: "Close",

    audienceTitle: "Who is this for?",
    audienceMen: "Men",
    audienceWomen: "Women",
    audienceKids: "Kids",
    audienceSeniors: "Seniors",
    audienceShowing: (label) => `Showing packages for ${label}`,
    audienceClear: "Show all packages",
    audienceEmpty: (label) => `No packages tagged for ${label} yet. Showing all packages instead.`,

    packagesTitle: "Health checkup packages",
    packagesSub: "A set of tests at one price. You can also pick tests one by one below.",
    pkgTests: (n) => (n === 1 ? "1 test" : `${n} tests`),
    pkgMore: (n) => `and ${n} more`,
    pkgAdd: "Add to booking",
    pkgAdded: "Added to booking",
    packageLabel: "package",

    findTitle: "Find a test",
    searchPlaceholder: "Type a test name, for example sugar, thyroid, CBC",
    searchAria: "Search tests",
    categoriesAria: "Test categories",
    all: "All",
    countTests: (n) => (n === 1 ? "1 test" : `${n} tests`),
    noResult: (q) => (q ? `No test found for “${q}”.` : "No test found."),
    noResultHint: "Add it to your notes and the lab will check it for you.",
    addQueryToNotes: (q) => `Add “${q}” to my notes`,
    add: "Add",
    added: "Added",
    sampleType: (s) => `${s} sample`,
    prevPage: "Previous page",
    nextPage: "Next page",
    pageOf: (cur, total) => `Page ${cur} of ${total}`,

    aboutHeading: (name) => `About ${name}`,
    aboutStatTests: (n) => (n === 1 ? "1 test listed" : `${n} tests listed`),
    aboutStatPackages: (n) => (n === 1 ? "1 health package" : `${n} health packages`),
    aboutChat: "Chat on WhatsApp",
    aboutCall: "Call us",

    yourBooking: "Your booking",
    nothingPicked:
      "Nothing picked yet. Choose a package or add tests, or just write what you need in the notes below.",
    remove: "Remove",
    estimatedTotal: "Estimated total",
    notAllPriced: "Some of these are not priced online. The lab will confirm the amount.",

    yourDetails: "Your details",
    patientName: "Patient's full name",
    age: "Age",
    gender: "Gender",
    select: "Select",
    male: "Male",
    female: "Female",
    other: "Other",
    mobile: "Mobile number",
    mobileHint: "The lab sends your confirmation to this number on WhatsApp.",
    email: "Email",
    optional: "(optional)",
    sampleWhere: "Where should the sample be taken?",
    atLab: "At the lab",
    atHome: "At my home",
    homeFee: (amount, note) => `Home collection: ${amount}${note ? `. ${note}` : ""}`,
    homeAddress: "Home address",
    homeAddressPlaceholder: "House number, street, village or area",
    date: "Date",
    time: "Time",
    checking: "Checking…",
    slotFull: "Full",
    slotLeft: (n) => `${n} left`,
    notes: "Notes",
    notesPlaceholder: "Other tests, or what your doctor wrote",
    consentText: "The lab may call or send me a WhatsApp message about this booking.",
    consentLink: "How my details are handled",
    booking: "Booking…",
    confirmBooking: "Confirm booking",
    savedWith: (labName) => `Your booking is saved with ${labName} and they will contact you to confirm.`,

    eName: "Enter the patient's name.",
    eAge: "Enter an age between 0 and 120.",
    eGender: "Choose one.",
    ePhoneIN: "Enter a 10 digit mobile number.",
    ePhone: "Enter a valid mobile number.",
    eEmail: "That email does not look right.",
    eAddress: "Enter the address for home collection.",
    eVisitType: (names) => `These have to be done at the lab: ${names}.`,
    eNotes: "Pick at least one test, or write what you need here.",
    eConsent: "Tick this so the lab can contact you.",

    testsChosen: (n) => (n === 1 ? "1 test chosen" : `${n} tests chosen`),
    continue: "Continue",

    demoBannerTitle: "Demo booking saved",
    bookingConfirmed: "Booking confirmed",
    keepRef: (labName) => `Keep this reference. ${labName} will contact you on the number you gave.`,
    demoWarnBold: "Nothing has actually been booked.",
    demoWarnRest: (labName) =>
      `${labName} is a sample lab used to show how this works. No appointment exists and no lab is expecting you.`,
    when: "When",
    sample: "Sample",
    atYourHome: "At your home",
    tests: "Tests",
    asPerNotes: "As per your notes",
    estimated: "Estimated",
    noWhatsappNote: (phone) => `Your booking is saved. If you do not hear from the lab, call ${phone}.`,
    wantOneForLab: "I want one for my lab",
    messageLab: "Message the lab",
    bookAnother: "Book another test",

    loading: "Loading…",
    notAvailableTitle: "This page is not available",
    demoSiteBold: "Demo site.",
    demoSiteRest: (labName) => `${labName} is a sample lab, not a real business. Please do not enter real personal details.`,
  },

  te: {
    callLabel: (phone) => `కాల్ చేయండి ${phone}`,
    whatsapp: "వాట్సాప్",
    directions: "దారి చూపండి",
    checkBooking: "బుకింగ్ చూడండి",

    heroCallUs: "కాల్ చేయండి",
    heroWhatsapp: "వాట్సాప్",
    heroCheckBooking: "బుకింగ్ చూడండి",
    needHelp: "సహాయం కావాలా?",
    needHelpSub: "కాల్ చేయండి లేదా వాట్సాప్‌లో మెసేజ్ చేయండి",
    close: "మూసివేయండి",

    audienceTitle: "ఇది ఎవరి కోసం?",
    audienceMen: "పురుషులు",
    audienceWomen: "మహిళలు",
    audienceKids: "పిల్లలు",
    audienceSeniors: "వృద్ధులు",
    audienceShowing: (label) => `${label} కోసం ప్యాకేజీలు చూపిస్తోంది`,
    audienceClear: "అన్ని ప్యాకేజీలు చూపించు",
    audienceEmpty: (label) => `${label} కోసం ఇంకా ప్యాకేజీలు లేవు. అన్ని ప్యాకేజీలు చూపిస్తోంది.`,

    packagesTitle: "హెల్త్ చెకప్ ప్యాకేజీలు",
    packagesSub: "చాలా టెస్టులు ఒకే ధరలో. కింద ఒక్కొక్క టెస్టు కూడా ఎంచుకోవచ్చు.",
    pkgTests: (n) => `${n} టెస్టులు`,
    pkgMore: (n) => `మరో ${n} టెస్టులు`,
    pkgAdd: "బుకింగ్‌కి జోడించండి",
    pkgAdded: "జోడించబడింది",
    packageLabel: "ప్యాకేజీ",

    findTitle: "టెస్టు వెతకండి",
    searchPlaceholder: "టెస్టు పేరు టైప్ చేయండి, ఉదా. షుగర్, థైరాయిడ్, CBC",
    searchAria: "టెస్టులు వెతకండి",
    categoriesAria: "టెస్టు రకాలు",
    all: "అన్నీ",
    countTests: (n) => `${n} టెస్టులు`,
    noResult: (q) => (q ? `“${q}” కోసం టెస్టు కనపడలేదు.` : "టెస్టు కనపడలేదు."),
    noResultHint: "మీ నోట్స్‌లో రాయండి, ల్యాబ్ వారు చూసి చెప్తారు.",
    addQueryToNotes: (q) => `“${q}” ను నోట్స్‌లో చేర్చండి`,
    add: "జోడించు",
    added: "జోడించబడింది",
    sampleType: (s) => `${s === "Blood" ? "రక్తం" : s === "Urine" ? "మూత్రం" : s} నమూనా`,
    prevPage: "ముందు పేజీ",
    nextPage: "తర్వాత పేజీ",
    pageOf: (cur, total) => `పేజీ ${cur} / ${total}`,

    aboutHeading: (name) => `${name} గురించి`,
    aboutStatTests: (n) => `${n} టెస్టులు అందుబాటులో`,
    aboutStatPackages: (n) => `${n} హెల్త్ ప్యాకేజీలు`,
    aboutChat: "వాట్సాప్‌లో చాట్ చేయండి",
    aboutCall: "కాల్ చేయండి",

    yourBooking: "మీ బుకింగ్",
    nothingPicked:
      "ఇంకా ఏమీ ఎంచుకోలేదు. ప్యాకేజీ ఎంచుకోండి లేదా టెస్టులు జోడించండి, లేదా కింద నోట్స్‌లో మీకు కావాల్సింది రాయండి.",
    remove: "తీసివేయి",
    estimatedTotal: "అంచనా మొత్తం",
    notAllPriced: "వీటిలో కొన్నింటికి ఆన్‌లైన్ ధర లేదు. ల్యాబ్ వారు ధర చెప్తారు.",

    yourDetails: "మీ వివరాలు",
    patientName: "పేషెంట్ పూర్తి పేరు",
    age: "వయసు",
    gender: "లింగం",
    select: "ఎంచుకోండి",
    male: "పురుషుడు",
    female: "స్త్రీ",
    other: "ఇతర",
    mobile: "మొబైల్ నంబర్",
    mobileHint: "మీ బుకింగ్ నిర్ధారణ ఈ నంబర్‌కు వాట్సాప్‌లో పంపిస్తారు.",
    email: "ఇమెయిల్",
    optional: "(ఐచ్ఛికం)",
    sampleWhere: "నమూనా ఎక్కడ తీసుకోవాలి?",
    atLab: "ల్యాబ్‌లో",
    atHome: "ఇంటి వద్ద",
    homeFee: (amount, note) => `హోమ్ కలెక్షన్: ${amount}${note ? `. ${note}` : ""}`,
    homeAddress: "ఇంటి చిరునామా",
    homeAddressPlaceholder: "ఇంటి నంబర్, వీధి, గ్రామం లేదా ప్రాంతం",
    date: "తేదీ",
    time: "సమయం",
    checking: "చూస్తున్నాం…",
    slotFull: "నిండింది",
    slotLeft: (n) => `${n} మిగిలాయి`,
    notes: "నోట్స్",
    notesPlaceholder: "ఇతర టెస్టులు, లేదా మీ డాక్టర్ రాసింది",
    consentText: "ఈ బుకింగ్ గురించి ల్యాబ్ వారు కాల్ చేయవచ్చు లేదా వాట్సాప్ మెసేజ్ పంపవచ్చు.",
    consentLink: "మీ వివరాలు ఎలా వాడతారు",
    booking: "బుక్ చేస్తున్నాం…",
    confirmBooking: "బుకింగ్ నిర్ధారించండి",
    savedWith: (labName) => `మీ బుకింగ్ ${labName} వద్ద సేవ్ అయింది, వారు నిర్ధారణ కోసం మిమ్మల్ని సంప్రదిస్తారు.`,

    eName: "పేషెంట్ పేరు రాయండి.",
    eAge: "0 నుండి 120 మధ్య వయసు రాయండి.",
    eGender: "ఒకటి ఎంచుకోండి.",
    ePhoneIN: "10 అంకెల మొబైల్ నంబర్ రాయండి.",
    ePhone: "సరైన మొబైల్ నంబర్ రాయండి.",
    eEmail: "ఈ ఇమెయిల్ సరిగ్గా లేదు.",
    eAddress: "హోమ్ కలెక్షన్ కోసం చిరునామా రాయండి.",
    eVisitType: (names) => `ఇవి ల్యాబ్‌లోనే చేయాలి: ${names}.`,
    eNotes: "కనీసం ఒక టెస్టు ఎంచుకోండి, లేదా ఇక్కడ మీకు కావాల్సింది రాయండి.",
    eConsent: "ల్యాబ్ మిమ్మల్ని సంప్రదించడానికి దీన్ని టిక్ చేయండి.",

    testsChosen: (n) => `${n} టెస్టులు ఎంచుకున్నారు`,
    continue: "కొనసాగించు",

    demoBannerTitle: "డెమో బుకింగ్ సేవ్ అయింది",
    bookingConfirmed: "బుకింగ్ నిర్ధారించబడింది",
    keepRef: (labName) => `ఈ రిఫరెన్స్ దాచుకోండి. ${labName} మీరు ఇచ్చిన నంబర్‌కు సంప్రదిస్తారు.`,
    demoWarnBold: "ఇంకా ఏమీ బుక్ కాలేదు.",
    demoWarnRest: (labName) =>
      `${labName} ఇది ఎలా పనిచేస్తుందో చూపించడానికి ఉన్న ఒక నమూనా ల్యాబ్. ఎలాంటి అపాయింట్‌మెంట్ లేదు, ఏ ల్యాబ్ కూడా మీ కోసం ఎదురుచూడటం లేదు.`,
    when: "ఎప్పుడు",
    sample: "నమూనా",
    atYourHome: "మీ ఇంటి వద్ద",
    tests: "టెస్టులు",
    asPerNotes: "మీ నోట్స్ ప్రకారం",
    estimated: "అంచనా",
    noWhatsappNote: (phone) => `మీ బుకింగ్ సేవ్ అయింది. ల్యాబ్ నుండి సమాచారం రాకపోతే, ${phone}కు కాల్ చేయండి.`,
    wantOneForLab: "నా ల్యాబ్ కోసం ఇది కావాలి",
    messageLab: "ల్యాబ్‌కు మెసేజ్ చేయండి",
    bookAnother: "మరో టెస్టు బుక్ చేయండి",

    loading: "లోడ్ అవుతోంది…",
    notAvailableTitle: "ఈ పేజీ అందుబాటులో లేదు",
    demoSiteBold: "డెమో సైట్.",
    demoSiteRest: (labName) => `${labName} ఒక నమూనా ల్యాబ్, నిజమైన వ్యాపారం కాదు. దయచేసి నిజమైన వ్యక్తిగత వివరాలు నమోదు చేయవద్దు.`,
  },
};

const LangContext = createContext({ lang: "en", setLang: () => {}, t: STRINGS.en });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("labbook-lang") === "te" ? "te" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("labbook-lang", lang);
    } catch {
      /* private browsing or blocked storage — the toggle still works for this visit */
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: STRINGS[lang] }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
