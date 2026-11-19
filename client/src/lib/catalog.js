import CATEGORY_PHOTOS from "./categoryPhotos.jsx";
export const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function matchesTest(test, query) {
  const hay = normalize(`${test.code} ${test.name} ${test.alias || ""} ${test.category || ""}`);
  return normalize(query).split(" ").filter(Boolean).every((word) => hay.includes(word));
}

const photos = {
  Routine: ["blood", "Diagnostic laboratory with sample testing equipment"],
  Diabetes: ["diabetes", "Blood glucose monitoring equipment"],
  Heart: ["heart", "Stethoscope used during a health examination"],
  Vitamins: ["nutrition", "Fresh foods as part of a balanced diet"],
  Thyroid: ["care", "Healthcare professional reviewing a mobile device"],
  Kidney: ["lab", "Laboratory equipment used for diagnostic testing"],
  Liver: ["lab", "Laboratory equipment used for diagnostic testing"],
  Hormones: ["care", "Healthcare professional reviewing a mobile device"],
};

const supplied = "/images/supplied/";
const suppliedCategories = {
  Routine: "routine", Diabetes: "diabetes", Heart: "heart", Thyroid: "thyroid",
  Liver: "liver", Kidney: "kidney", Hormones: "hormones", Vitamins: "vitamins",
  Fever: "fever", Infection: "infection",
};

const scene = (name, alt) => ({ src: `${supplied}${name}.webp`, alt, "data-visual": "scene" });

export function catalogImage(category) {
  if (suppliedCategories[category]) return { src: `${supplied}${suppliedCategories[category]}.webp`, alt: `${category} health category illustration`, "data-visual": "cutout" };
  if (CATEGORY_PHOTOS[category]) return { src: CATEGORY_PHOTOS[category], alt: `${category} test category illustration` };
  const [file, alt] = photos[category] || ["lab", "Laboratory equipment used for diagnostic testing"];
  return { src: `/images/${file}.jpg`, alt };
}

export function testImage(test) {
  if (test.category === "Routine") return scene("blood-testing", "Illustration of a clinician preparing blood sample tubes");
  if (test.category === "Diabetes") return scene("diabetes-care", "Illustration of glucose testing equipment and a clinician reviewing a report");
  if (test.category === "Heart") return scene("heart-care", "Illustration of a clinician reviewing heart test information");
  return catalogImage(test.category);
}

export function packageImage(name) {
  if (/senior|elder/i.test(name)) return scene("senior-care", "Illustration of a clinician with an older adult at a checkup");
  if (/pregnan|antenatal/i.test(name)) return scene("pregnancy-care", "Illustration of an antenatal consultation");
  if (/diabet|sugar/i.test(name)) return scene("diabetes-care", "Illustration of a diabetes checkup and glucose testing equipment");
  if (/heart|cardiac/i.test(name)) return scene("heart-care", "Illustration of a heart health checkup");
  if (/thyroid/i.test(name)) return catalogImage("Thyroid");
  if (/fever/i.test(name)) return catalogImage("Fever");
  if (/vitamin|nutrition/i.test(name)) return catalogImage("Vitamins");
  if (/full\s*body|comprehensive|\bmen\b|\bmale\b/i.test(name)) return scene("full-body-care", "Illustration of a general health checkup consultation");
  return scene("routine-care", "Illustration of a clinician preparing for a routine health checkup");
}
