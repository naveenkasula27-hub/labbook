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

export function catalogImage(category) {
  const [file, alt] = photos[category] || ["lab", "Laboratory equipment used for diagnostic testing"];
  return { src: `/images/${file}.jpg`, alt };
}

export function packageImage(name) {
  if (/diabet|sugar/i.test(name)) return catalogImage("Diabetes");
  if (/heart|cardiac/i.test(name)) return catalogImage("Heart");
  if (/vitamin|nutrition/i.test(name)) return catalogImage("Vitamins");
  return { src: "/images/wellness.jpg", alt: "Outdoor meditation as part of a wellness routine" };
}
