/**
 * One place that decides whether a lab is paid up, so the dashboard banner,
 * the login response and the admin script all agree.
 *
 * Billing is manual for now: Naveen collects by UPI outside the app and runs
 * `npm run lab:bill` to push paidUntil forward. Nothing here blocks the lab's
 * booking page or dashboard — it only decides what banner the owner sees.
 */
export function billingStatus(lab) {
  const monthlyFee = lab?.billing?.monthlyFee || 0;
  const paidUntilRaw = lab?.billing?.paidUntil || null;
  const paidUntil = paidUntilRaw ? new Date(paidUntilRaw) : null;

  if (lab?.plan === "trial") {
    return { status: "trial", paidUntil: paidUntil ? paidUntil.toISOString() : null, monthlyFee };
  }

  const isPaid = Boolean(paidUntil && paidUntil.getTime() > Date.now());
  return {
    status: isPaid ? "active" : "overdue",
    paidUntil: paidUntil ? paidUntil.toISOString() : null,
    monthlyFee,
  };
}