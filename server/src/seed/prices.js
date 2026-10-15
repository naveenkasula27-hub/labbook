/**
 * Starting prices for demo labs, so a fresh page does not look empty.
 *
 * Kept out of seed.js so both the Nandu seed and the public demo seed can use
 * them without one importing the other and running it.
 *
 * These are plausible Telangana small-lab prices, not a real price list. A real
 * lab sets its own from the dashboard.
 */
export const DEMO_PRICES = {
  cbc: 300, hb: 100, esr: 100, bloodgroup: 150, crp: 500,
  fbs: 80, ppbs: 80, rbs: 80, hba1c: 500, ogtt: 300,
  lipid: 600, chol_total: 200, triglycerides: 200,
  lft: 700, sgpt: 200, sgot: 200, bilirubin: 200,
  kft: 700, creatinine: 150, urea: 150, uric_acid: 200,
  tsh: 250, thyroid_profile: 500, ft3_ft4: 600,
  vit_d: 1200, vit_b12: 1100, iron_studies: 900, ferritin: 700, calcium: 200,
  widal: 250, malaria_card: 300, dengue_ns1: 700, dengue_igm: 800, typhidot: 500,
  hiv: 400, hbsag: 400, hcv: 500, vdrl: 250,
  urine_routine: 150, urine_culture: 600, urine_preg: 150,
  stool_routine: 200,
  pt_inr: 400, aptt: 400, ddimer: 900,
  psa: 800, ca125: 1100,
  xray_chest: 350, usg_abdomen: 900, usg_preg: 800, ecg: 200, echo: 1200,
};

export const DEMO_PACKAGE_PRICES = {
  basic_health: 1500,
  full_body: 3500,
  diabetes_panel: 1400,
  fever_panel: 1200,
  thyroid_panel: 1100,
  heart_panel: 2800,
  pregnancy_first: 2500,
  women_wellness: 3200,
  senior_citizen: 4200,
};
