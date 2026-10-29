/**
 * What a lab's "Men / Women / Kids / Seniors" tile actually shows once
 * someone taps it: a real, standard age/gender screening panel, written out
 * as the codes used in the shared test catalog (server/src/seed/catalog.js).
 *
 * This is generic medical reference content — the same basic/advanced split
 * any pathology lab in India would recognise — not specific to any one lab.
 * A lab only shows a test here if it actually has that test in its own
 * catalog (matched by code against the lab's real `tests` array), so what
 * renders is always real tests at that lab's real prices, never invented
 * ones. A code with no match at a given lab is simply left out.
 *
 * Each code can be a plain string, or { code, badge } where `badge` is a
 * short qualifier shown next to that one test — an age threshold, or that
 * it's optional, rather than a blanket note for the whole group.
 */
export const AUDIENCE_GUIDE = {
  men: {
    ageNote: "30 and above",
    groups: [
      {
        title: "Basic panel",
        codes: ["cbc", "esr", "fbs", "hba1c", "lipid", "lft", "kft", "uric_acid", "urine_routine", "tsh"],
      },
      {
        title: "Advanced add-ons",
        codes: [
          "vit_d", "vit_b12", "calcium", "electrolytes", "crp", "ggt", "ecg", "xray_chest",
          { code: "psa", badge: "From age 45" },
        ],
      },
    ],
  },

  women: {
    ageNote: "30 and above",
    groups: [
      {
        title: "Basic panel",
        codes: ["cbc", "esr", "fbs", "hba1c", "lipid", "lft", "kft", "tsh", "urine_routine", "iron_studies"],
      },
      {
        title: "Advanced add-ons",
        codes: [
          "vit_d", "vit_b12", "calcium", "electrolytes", "crp", "ecg",
          "pap_smear",
          { code: "mammography", badge: "From age 40" },
        ],
      },
      {
        title: "PCOS add-on (optional)",
        codes: ["fsh_lh", "prolactin", "testosterone", { code: "usg_abdomen", badge: "Pelvis scan" }],
      },
    ],
  },

  kids: {
    ageNote: "3 to 14 years",
    groups: [
      {
        title: "Basic panel",
        codes: ["cbc", "esr", "bloodgroup", "fbs", "urine_routine", "stool_routine"],
      },
      {
        title: "Advanced add-ons",
        codes: [
          "pbs", "vit_d", "vit_b12", "iron_studies", "calcium",
          { code: "thyroid_profile", badge: "If advised by a doctor" },
          { code: "ige_total", badge: "Optional allergy panel" },
        ],
      },
    ],
  },

  seniors: {
    ageNote: "60 and above",
    groups: [
      {
        title: "Basic panel",
        codes: ["cbc", "esr", "fbs", "ppbs", "hba1c", "lipid", "lft", "kft", "electrolytes", "urine_routine", "ecg"],
      },
      {
        title: "Advanced add-ons",
        codes: [
          "uric_acid", "calcium", "phosphorus", "magnesium", "tsh", "vit_d", "vit_b12", "crp",
          "microalbumin", "xray_chest",
          { code: "psa", badge: "For men" },
          { code: "dexa", badge: "Optional" },
          { code: "echo", badge: "For those with heart history" },
        ],
      },
    ],
  },
};
