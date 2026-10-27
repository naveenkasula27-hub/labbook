/**
 * Login for the lab dashboard.
 *
 * There is no public sign-up yet: labs and their owner accounts are created by
 * the seed script. That comes in a later stage.
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
    lab: lab
      ? { name: lab.name, slug: lab.slug, currency: lab.currency, locale: lab.locale, timezone: lab.timezone, billing: billingStatus(lab) }
      : null,
  });
});

/** Lets the dashboard check on load whether a stored token is still good. */
authRouter.get("/me", requireAuth, async (req, res) => {
  const lab = req.labId ? await Lab.findById(req.labId).lean() : null;
  res.json({
    user: { name: req.user.name, email: req.user.email, role: req.user.role },
        lab: lab
      ? { name: lab.name, slug: lab.slug, currency: lab.currency, locale: lab.locale, timezone: lab.timezone, billing: billingStatus(lab) }
      : null,
  });
});
