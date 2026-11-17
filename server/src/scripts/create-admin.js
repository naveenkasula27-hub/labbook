import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { connectDb, disconnectDb } from "../db.js";
import { User } from "../models/User.js";
const rl = createInterface({ input: stdin, output: stdout });
try {
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const name = (await rl.question("Admin name: ")).trim();
  const password = await rl.question("Password (visible while typing, 12+ characters): ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) throw new Error("Invalid name, email or password.");
  await connectDb();
  if (await User.exists({ email })) throw new Error("That email already exists; no account was changed.");
  await User.create({ email, name, passwordHash: await User.hashPassword(password), role: "admin" });
  console.log("Admin created. Sign in at /dashboard.");
} catch (err) { console.error(err.message); process.exitCode = 1; }
finally { rl.close(); await disconnectDb(); }
