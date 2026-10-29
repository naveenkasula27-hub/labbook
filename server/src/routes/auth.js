/**
 * Login and sign-up for the lab dashboard.
 *
 * Sign-up is self-serve: a lab owner creates their own Lab + owner User here
 * and starts on plan "trial" with no tests priced yet, since pricing is
 * entered by the owner on the Prices tab, not seeded by us. Billing stays
 * manual (see lib/billing.js) — nothing here talks to Razorpay.
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User.js";
import { Lab } from "../models/Lab.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { billingStatus } from "../lib/billing.js";

export const authRouter = express.Router();

const presentLab = (lab) => ({
  name: lab.name,
  slug: lab.slug,
  currency: lab.currency,
  locale: lab.locale,
  timezone: lab.timezone,
  billing: billingStatus(lab),
});

// Password guessing protection. Counted per IP, not per email, so someone
// cannot lock a real owner out of their own account by guessing at it.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait a few minutes." },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });

  // Same message whether the email is unknown or the password is wrong, so
  // this cannot be used to find out which emails exist.
  const WRONG = { error: "Email or password is not correct." };

  if (!user || !user.active) return res.status(401).json(WRONG);
  if (!(await user.checkPassword(password))) return res.status(401).json(WRONG);

  const lab = user.lab ? await Lab.findById(user.lab).lean() : null;
  if (user.lab && (!lab || !lab.active)) {
    return res.status(403).json({ error: "This lab account is not active." });
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  res.json({
    token: signToken(user),
    user: { name: user.name, email: user.email, role: user.role },
    lab: lab ? presentLab(lab) : null,
  });
});

/** Lets the dashboard check on load whether a stored token is still good. */
authRouter.get("/me", requireAuth, async (req, res) => {
  const lab = req.labId ? await Lab.findById(req.labId).lean() : null;
  res.json({
    user: { name: req.user.name, email: req.user.email, role: req.user.role },
    lab: lab ? presentLab(lab) : null,
  });
});

/* ---------- Sign up a new lab ---------- */

// Looser than login's limiter (this is a one-time action per lab, not
// something a real owner retries often), but still capped per IP so a
// script cannot mass-create labs.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-up attempts from this device. Please wait and try again." },
});

const signupSchema = z.object({
  labName: z.string().trim().min(2, "Enter your lab's name.").max(80),
  ownerName: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().trim().min(6, "Enter a phone number.").max(20),
  city: z.string().trim().max(80).optional().or(z.literal("")),
});

/** Turns "Maheera Diagnostics" into "maheera-diagnostics", kept short. */
function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

authRouter.post("/signup", signupLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    const field = parsed.error.issues[0];
    return res.status(400).json({ error: field.message, field: field.path.join(".") });
  }
  const { labName, ownerName, email, password, phone, city } = parsed.data;

  if (await User.findOne({ email })) {
    return res.status(409).json({ error: "An account with that email already exists.", field: "email" });
  }

  // Find a free slug, starting from the lab's name and adding "-2", "-3", …
  // only if that address is already taken by an earlier lab.
  const base = slugify(labName) || "lab";
  let slug = base;
  for (let n = 2; await Lab.findOne({ slug }); n++) {
    slug = `${base}-${n}`;
  }

  const lab = await Lab.create({
    name: labName,
    slug,
    phone,
    city: city || "",
    plan: "trial",
    isDemo: false,
  });

  const user = await User.create({
    lab: lab._id,
    name: ownerName,
    email,
    passwordHash: await User.hashPassword(password),
    role: "owner",
  });

  res.status(201).json({
    token: signToken(user),
    user: { name: user.name, email: user.email, role: user.role },
    lab: presentLab(lab),
  });
});
