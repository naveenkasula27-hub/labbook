/**
 * Standard diagnostic test catalog.
 *
 * These are generic test names used across pathology worldwide, written here
 * from scratch. No price list is copied from any lab or chain — `price` is left
 * null everywhere and each lab fills in its own.
 *
 * Every new lab starts with this list and then edits it: delete what it does
 * not offer, rename to local wording, set prices.
 */

export const CATALOG = [
  // ---------- Blood — routine ----------
  { code: "cbc", name: "Complete Blood Count (CBC)", alias: "Blood count", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "hb", name: "Haemoglobin (Hb)", alias: "HB test", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "esr", name: "Erythrocyte Sedimentation Rate (ESR)", alias: "ESR", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "platelet", name: "Platelet Count", alias: "", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "bloodgroup", name: "Blood Group and Rh Typing", alias: "Blood group", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "pbs", name: "Peripheral Blood Smear", alias: "", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "retic", name: "Reticulocyte Count", alias: "", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "crp", name: "C-Reactive Protein (CRP)", alias: "", category: "Routine", sample: "Blood", reportTime: "Same day" },
  { code: "crp_hs", name: "High Sensitivity CRP (hs-CRP)", alias: "", category: "Routine", sample: "Blood", reportTime: "Next day" },
  { code: "pct", name: "Procalcitonin", alias: "", category: "Routine", sample: "Blood", reportTime: "Next day" },

  // ---------- Diabetes ----------
  { code: "fbs", name: "Fasting Blood Sugar (FBS)", alias: "Sugar fasting", category: "Diabetes", sample: "Blood", fasting: "8 to 10 hours fasting", reportTime: "Same day" },
  { code: "ppbs", name: "Post Prandial Blood Sugar (PPBS)", alias: "Sugar after food", category: "Diabetes", sample: "Blood", reportTime: "Same day" },
  { code: "rbs", name: "Random Blood Sugar (RBS)", alias: "Sugar random", category: "Diabetes", sample: "Blood", reportTime: "Same day" },
  { code: "hba1c", name: "Glycated Haemoglobin (HbA1c)", alias: "3 month sugar average", category: "Diabetes", sample: "Blood", reportTime: "Same day" },
  { code: "ogtt", name: "Oral Glucose Tolerance Test (OGTT)", alias: "GTT", category: "Diabetes", sample: "Blood", fasting: "8 hours fasting, then 2 hours at the lab", reportTime: "Same day" },
  { code: "insulin_f", name: "Fasting Insulin", alias: "", category: "Diabetes", sample: "Blood", fasting: "8 to 10 hours fasting", reportTime: "Next day" },
  { code: "cpeptide", name: "C-Peptide", alias: "", category: "Diabetes", sample: "Blood", reportTime: "Next day" },
  { code: "fructosamine", name: "Fructosamine", alias: "", category: "Diabetes", sample: "Blood", reportTime: "2 days" },

  // ---------- Lipids and heart ----------
  { code: "lipid", name: "Lipid Profile", alias: "Cholesterol test", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "Same day" },
  { code: "chol_total", name: "Total Cholesterol", alias: "", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "Same day" },
  { code: "hdl", name: "HDL Cholesterol", alias: "Good cholesterol", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "Same day" },
  { code: "ldl", name: "LDL Cholesterol", alias: "Bad cholesterol", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "Same day" },
  { code: "triglycerides", name: "Triglycerides", alias: "", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "Same day" },
  { code: "apo_ab", name: "Apolipoprotein A1 and B", alias: "", category: "Heart", sample: "Blood", fasting: "10 to 12 hours fasting", reportTime: "2 days" },
  { code: "lpa", name: "Lipoprotein (a)", alias: "", category: "Heart", sample: "Blood", reportTime: "2 days" },
  { code: "homocysteine", name: "Homocysteine", alias: "", category: "Heart", sample: "Blood", fasting: "8 hours fasting", reportTime: "2 days" },
  { code: "trop_i", name: "Troponin I", alias: "", category: "Heart", sample: "Blood", reportTime: "Same day" },
  { code: "ck_mb", name: "CK-MB", alias: "", category: "Heart", sample: "Blood", reportTime: "Same day" },
  { code: "bnp", name: "NT-proBNP", alias: "", category: "Heart", sample: "Blood", reportTime: "Next day" },

  // ---------- Liver ----------
  { code: "lft", name: "Liver Function Test (LFT)", alias: "Liver profile", category: "Liver", sample: "Blood", fasting: "8 hours fasting preferred", reportTime: "Same day" },
  { code: "sgpt", name: "SGPT / ALT", alias: "", category: "Liver", sample: "Blood", reportTime: "Same day" },
  { code: "sgot", name: "SGOT / AST", alias: "", category: "Liver", sample: "Blood", reportTime: "Same day" },
  { code: "bilirubin", name: "Bilirubin — Total, Direct and Indirect", alias: "Jaundice test", category: "Liver", sample: "Blood", reportTime: "Same day" },
  { code: "alk_phos", name: "Alkaline Phosphatase (ALP)", alias: "", category: "Liver", sample: "Blood", reportTime: "Same day" },
  { code: "ggt", name: "Gamma GT (GGT)", alias: "", category: "Liver", sample: "Blood", reportTime: "Same day" },
  { code: "protein_alb", name: "Total Protein and Albumin", alias: "", category: "Liver", sample: "Blood", reportTime: "Same day" },

  // ---------- Kidney ----------
  { code: "kft", name: "Kidney Function Test (KFT)", alias: "Renal profile", category: "Kidney", sample: "Blood", fasting: "8 hours fasting preferred", reportTime: "Same day" },
  { code: "creatinine", name: "Serum Creatinine", alias: "", category: "Kidney", sample: "Blood", reportTime: "Same day" },
  { code: "urea", name: "Blood Urea", alias: "", category: "Kidney", sample: "Blood", reportTime: "Same day" },
  { code: "bun", name: "Blood Urea Nitrogen (BUN)", alias: "", category: "Kidney", sample: "Blood", reportTime: "Same day" },
  { code: "uric_acid", name: "Uric Acid", alias: "", category: "Kidney", sample: "Blood", reportTime: "Same day" },
  { code: "egfr", name: "Estimated GFR (eGFR)", alias: "", category: "Kidney", sample: "Blood", reportTime: "Same day" },
  { code: "cystatin_c", name: "Cystatin C", alias: "", category: "Kidney", sample: "Blood", reportTime: "2 days" },
  { code: "microalbumin", name: "Urine Microalbumin", alias: "", category: "Kidney", sample: "Urine", reportTime: "Same day" },
  { code: "acr", name: "Urine Albumin to Creatinine Ratio (ACR)", alias: "", category: "Kidney", sample: "Urine", reportTime: "Same day" },

  // ---------- Thyroid and hormones ----------
  { code: "tsh", name: "TSH", alias: "Thyroid", category: "Thyroid", sample: "Blood", reportTime: "Same day" },
  { code: "thyroid_profile", name: "Thyroid Profile — T3, T4, TSH", alias: "Full thyroid", category: "Thyroid", sample: "Blood", reportTime: "Same day" },
  { code: "ft3_ft4", name: "Free T3 and Free T4", alias: "", category: "Thyroid", sample: "Blood", reportTime: "Next day" },
  { code: "anti_tpo", name: "Anti-TPO Antibodies", alias: "", category: "Thyroid", sample: "Blood", reportTime: "2 days" },
  { code: "prolactin", name: "Prolactin", alias: "", category: "Hormones", sample: "Blood", reportTime: "Next day" },
  { code: "testosterone", name: "Testosterone — Total", alias: "", category: "Hormones", sample: "Blood", reportTime: "Next day" },
  { code: "estradiol", name: "Estradiol (E2)", alias: "", category: "Hormones", sample: "Blood", reportTime: "Next day" },
  { code: "fsh_lh", name: "FSH and LH", alias: "", category: "Hormones", sample: "Blood", reportTime: "Next day" },
  { code: "amh", name: "Anti-Mullerian Hormone (AMH)", alias: "", category: "Hormones", sample: "Blood", reportTime: "3 days" },
  { code: "cortisol", name: "Cortisol — Morning", alias: "", category: "Hormones", sample: "Blood", reportTime: "Next day" },
  { code: "pth", name: "Parathyroid Hormone (PTH)", alias: "", category: "Hormones", sample: "Blood", reportTime: "2 days" },
  { code: "hcg_beta", name: "Beta hCG — Quantitative", alias: "Pregnancy blood test", category: "Hormones", sample: "Blood", reportTime: "Same day" },

  // ---------- Vitamins and minerals ----------
  { code: "vit_d", name: "Vitamin D — 25 Hydroxy", alias: "Vitamin D", category: "Vitamins", sample: "Blood", reportTime: "Next day" },
  { code: "vit_b12", name: "Vitamin B12", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Next day" },
  { code: "folate", name: "Folic Acid (Folate)", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Next day" },
  { code: "iron_studies", name: "Iron Studies — Iron, TIBC, Ferritin", alias: "", category: "Vitamins", sample: "Blood", fasting: "8 hours fasting", reportTime: "Next day" },
  { code: "ferritin", name: "Ferritin", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Next day" },
  { code: "calcium", name: "Calcium — Serum", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Same day" },
  { code: "magnesium", name: "Magnesium", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Same day" },
  { code: "phosphorus", name: "Phosphorus", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Same day" },
  { code: "electrolytes", name: "Electrolytes — Sodium, Potassium, Chloride", alias: "", category: "Vitamins", sample: "Blood", reportTime: "Same day" },
  { code: "zinc", name: "Zinc", alias: "", category: "Vitamins", sample: "Blood", reportTime: "2 days" },

  // ---------- Fever and infection ----------
  { code: "widal", name: "Widal Test", alias: "Typhoid test", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "typhidot", name: "Typhidot — IgM and IgG", alias: "", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "malaria_card", name: "Malaria Antigen — Rapid", alias: "Malaria test", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "malaria_smear", name: "Malaria Parasite — Smear", alias: "", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "dengue_ns1", name: "Dengue NS1 Antigen", alias: "Dengue test", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "dengue_igm", name: "Dengue IgM and IgG", alias: "", category: "Fever", sample: "Blood", reportTime: "Same day" },
  { code: "chikungunya", name: "Chikungunya IgM", alias: "", category: "Fever", sample: "Blood", reportTime: "Next day" },
  { code: "scrub_typhus", name: "Scrub Typhus IgM", alias: "", category: "Fever", sample: "Blood", reportTime: "Next day" },
  { code: "leptospira", name: "Leptospira IgM", alias: "", category: "Fever", sample: "Blood", reportTime: "Next day" },
  { code: "blood_culture", name: "Blood Culture and Sensitivity", alias: "", category: "Fever", sample: "Blood", reportTime: "3 to 5 days" },

  // ---------- Infectious disease ----------
  { code: "hiv", name: "HIV I and II — Screening", alias: "", category: "Infection", sample: "Blood", reportTime: "Same day" },
  { code: "hbsag", name: "Hepatitis B Surface Antigen (HBsAg)", alias: "", category: "Infection", sample: "Blood", reportTime: "Same day" },
  { code: "hcv", name: "Hepatitis C Antibody (Anti-HCV)", alias: "", category: "Infection", sample: "Blood", reportTime: "Same day" },
  { code: "hav_igm", name: "Hepatitis A IgM", alias: "", category: "Infection", sample: "Blood", reportTime: "Next day" },
  { code: "hev_igm", name: "Hepatitis E IgM", alias: "", category: "Infection", sample: "Blood", reportTime: "Next day" },
  { code: "vdrl", name: "VDRL / RPR", alias: "", category: "Infection", sample: "Blood", reportTime: "Same day" },
  { code: "mantoux", name: "Mantoux Test", alias: "TB skin test", category: "Infection", sample: "Other", reportTime: "After 72 hours" },
  { code: "tb_gold", name: "TB Interferon Gamma Release Assay", alias: "", category: "Infection", sample: "Blood", reportTime: "3 days" },
  { code: "covid_rtpcr", name: "COVID-19 RT-PCR", alias: "", category: "Infection", sample: "Swab", reportTime: "Next day" },
  { code: "covid_antigen", name: "COVID-19 Rapid Antigen", alias: "", category: "Infection", sample: "Swab", reportTime: "Same day" },

  // ---------- Urine and stool ----------
  { code: "urine_routine", name: "Urine Routine and Microscopy", alias: "Urine test", category: "Urine", sample: "Urine", reportTime: "Same day" },
  { code: "urine_culture", name: "Urine Culture and Sensitivity", alias: "", category: "Urine", sample: "Urine", reportTime: "3 days" },
  { code: "urine_preg", name: "Urine Pregnancy Test", alias: "UPT", category: "Urine", sample: "Urine", reportTime: "Same day" },
  { code: "urine_24h_protein", name: "24 Hour Urine Protein", alias: "", category: "Urine", sample: "Urine", reportTime: "Next day" },
  { code: "stool_routine", name: "Stool Routine and Microscopy", alias: "", category: "Stool", sample: "Stool", reportTime: "Same day" },
  { code: "stool_occult", name: "Stool Occult Blood", alias: "", category: "Stool", sample: "Stool", reportTime: "Same day" },
  { code: "stool_culture", name: "Stool Culture and Sensitivity", alias: "", category: "Stool", sample: "Stool", reportTime: "3 days" },

  // ---------- Clotting ----------
  { code: "pt_inr", name: "Prothrombin Time with INR", alias: "PT INR", category: "Clotting", sample: "Blood", reportTime: "Same day" },
  { code: "aptt", name: "APTT", alias: "", category: "Clotting", sample: "Blood", reportTime: "Same day" },
  { code: "ddimer", name: "D-Dimer", alias: "", category: "Clotting", sample: "Blood", reportTime: "Same day" },
  { code: "fibrinogen", name: "Fibrinogen", alias: "", category: "Clotting", sample: "Blood", reportTime: "Next day" },
  { code: "bleeding_clotting", name: "Bleeding Time and Clotting Time", alias: "BT CT", category: "Clotting", sample: "Blood", reportTime: "Same day" },

  // ---------- Allergy and immunity ----------
  { code: "ige_total", name: "Total IgE", alias: "", category: "Allergy", sample: "Blood", reportTime: "2 days" },
  { code: "ana", name: "Antinuclear Antibody (ANA)", alias: "", category: "Allergy", sample: "Blood", reportTime: "3 days" },
  { code: "ra_factor", name: "Rheumatoid Factor (RA Factor)", alias: "", category: "Allergy", sample: "Blood", reportTime: "Next day" },
  { code: "aso", name: "ASO Titre", alias: "", category: "Allergy", sample: "Blood", reportTime: "Next day" },
  { code: "ccp", name: "Anti-CCP Antibodies", alias: "", category: "Allergy", sample: "Blood", reportTime: "3 days" },

  // ---------- Cancer markers ----------
  { code: "psa", name: "Prostate Specific Antigen (PSA)", alias: "", category: "Markers", sample: "Blood", reportTime: "Next day" },
  { code: "cea", name: "Carcinoembryonic Antigen (CEA)", alias: "", category: "Markers", sample: "Blood", reportTime: "2 days" },
  { code: "afp", name: "Alpha Fetoprotein (AFP)", alias: "", category: "Markers", sample: "Blood", reportTime: "2 days" },
  { code: "ca125", name: "CA 125", alias: "", category: "Markers", sample: "Blood", reportTime: "2 days" },
  { code: "ca15_3", name: "CA 15-3", alias: "", category: "Markers", sample: "Blood", reportTime: "2 days" },
  { code: "ca19_9", name: "CA 19-9", alias: "", category: "Markers", sample: "Blood", reportTime: "2 days" },

  // ---------- Scans and imaging (labs that have them) ----------
  { code: "xray_chest", name: "X-Ray Chest", alias: "", category: "Scans", sample: "Scan", homeCollectable: false, reportTime: "Same day" },
  { code: "usg_abdomen", name: "Ultrasound Abdomen and Pelvis", alias: "Scanning", category: "Scans", sample: "Scan", homeCollectable: false, fasting: "6 hours fasting", reportTime: "Same day" },
  { code: "usg_preg", name: "Ultrasound — Pregnancy", alias: "", category: "Scans", sample: "Scan", homeCollectable: false, reportTime: "Same day" },
  { code: "ecg", name: "ECG", alias: "", category: "Scans", sample: "Other", homeCollectable: false, reportTime: "Same day" },
  { code: "echo", name: "Echocardiogram (2D Echo)", alias: "", category: "Scans", sample: "Other", homeCollectable: false, reportTime: "Same day" },
  { code: "tmt", name: "Treadmill Test (TMT)", alias: "Stress test", category: "Scans", sample: "Other", homeCollectable: false, reportTime: "Same day" },
  { code: "pap_smear", name: "Pap Smear (Cervical Cytology)", alias: "Pap test", category: "Scans", sample: "Other", homeCollectable: false, reportTime: "3 to 5 days" },
  { code: "mammography", name: "Mammography", alias: "Breast screening", category: "Scans", sample: "Scan", homeCollectable: false, reportTime: "Same day" },
  { code: "dexa", name: "Bone Density Scan (DEXA)", alias: "DEXA scan", category: "Scans", sample: "Scan", homeCollectable: false, reportTime: "Same day" },
];

export const PACKAGE_TEMPLATES = [
  {
    code: "basic_health",
    name: "Basic Health Checkup",
    description: "A yearly check for an adult with no known problems.",
    testCodes: ["cbc", "fbs", "lipid", "lft", "kft", "tsh", "urine_routine"],
    fasting: "10 to 12 hours fasting",
  },
  {
    code: "full_body",
    name: "Full Body Checkup",
    description: "A wider check that adds vitamins, thyroid and electrolytes.",
    testCodes: ["cbc", "esr", "fbs", "hba1c", "lipid", "lft", "kft", "thyroid_profile", "vit_d", "vit_b12", "iron_studies", "electrolytes", "urine_routine"],
    fasting: "10 to 12 hours fasting",
  },
  {
    code: "diabetes_panel",
    name: "Diabetes Panel",
    description: "For anyone with diabetes or being checked for it.",
    testCodes: ["fbs", "ppbs", "hba1c", "kft", "lipid", "microalbumin"],
    fasting: "8 to 10 hours fasting",
  },
  {
    code: "fever_panel",
    name: "Fever Panel",
    description: "For fever lasting more than two days.",
    testCodes: ["cbc", "esr", "widal", "malaria_card", "dengue_ns1", "urine_routine"],
    fasting: "",
  },
  {
    code: "thyroid_panel",
    name: "Thyroid Panel",
    description: "Full thyroid check with antibodies.",
    testCodes: ["thyroid_profile", "ft3_ft4", "anti_tpo"],
    fasting: "",
  },
  {
    code: "heart_panel",
    name: "Heart Checkup",
    description: "Lipids, blood pressure markers, ECG and echo where available.",
    testCodes: ["lipid", "crp_hs", "homocysteine", "apo_ab", "ecg", "echo"],
    fasting: "10 to 12 hours fasting",
  },
  {
    code: "pregnancy_first",
    name: "Pregnancy — First Visit",
    description: "The usual first set once pregnancy is confirmed.",
    testCodes: ["cbc", "bloodgroup", "fbs", "tsh", "hiv", "hbsag", "vdrl", "urine_routine", "usg_preg"],
    fasting: "8 hours fasting",
  },
  {
    code: "women_wellness",
    name: "Women's Wellness",
    description: "Anaemia, thyroid, vitamins and hormones.",
    testCodes: ["cbc", "iron_studies", "vit_d", "vit_b12", "thyroid_profile", "fbs", "lipid", "urine_routine"],
    fasting: "10 to 12 hours fasting",
  },
  {
    code: "senior_citizen",
    name: "Senior Citizen Checkup",
    description: "For adults above 60, including kidney, liver and heart.",
    testCodes: ["cbc", "esr", "fbs", "hba1c", "lipid", "lft", "kft", "uric_acid", "thyroid_profile", "vit_d", "vit_b12", "electrolytes", "urine_routine", "ecg"],
    fasting: "10 to 12 hours fasting",
  },
];

/** Category display order on the booking page. */
export const CATEGORY_ORDER = [
  "Routine",
  "Diabetes",
  "Heart",
  "Liver",
  "Kidney",
  "Thyroid",
  "Hormones",
  "Vitamins",
  "Fever",
  "Infection",
  "Urine",
  "Stool",
  "Clotting",
  "Allergy",
  "Markers",
  "Scans",
];
