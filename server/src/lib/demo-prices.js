// Illustrative amounts for unpriced INR demo rows only. Never changes stored
// catalogue prices. The public catalogue and booking writer use the same rule.
const categoryPrices = { Routine: 250, Diabetes: 180, Heart: 550, Thyroid: 450, Liver: 500, Kidney: 450, Hormones: 650, Vitamins: 800, Fever: 450, Infection: 600, Urine: 150, Stool: 200, Clotting: 350, Allergy: 700, Markers: 900, Scans: 1200 };
export function cataloguePrice(row, lab, kind = 'test') {
  if (typeof row.price === 'number' && Number.isFinite(row.price)) return { price: row.price, priceIsSample: false };
  if (!lab.isDemo || (lab.currency && lab.currency !== 'INR')) return { price: null, priceIsSample: false };
  const base = kind === 'package' ? Math.max(699, (row.testCodes?.length || 1) * 180) : categoryPrices[row.category] || 350;
  const price = kind === 'test' && /profile|panel|function/i.test(row.name || '') ? Math.round(base * 1.4 / 10) * 10 : base;
  return { price, priceIsSample: true };
}
