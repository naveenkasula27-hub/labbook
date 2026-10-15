/**
 * Sets a dashboard user's password.
 *
 *   node src/scripts/set-password.js owner@nandu.test
 *
 * It asks for the new password, hashes it, and writes the hash to the user.
 * The password is typed in rather than passed as an argument, so it does not
 * end up in your shell history.
 *
 * Use this instead of editing passwordHash by hand in Atlas. Every lab you set
 * up needs its own password, and doing it here means the hash is always
 * generated the same way the login check expects.
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { User } from "../models/User.js";

const email = (process.argv[2] || "").trim().toLowerCase();

const safeUri = (uri) => uri.replace(/\/\/[^@]*@/, "//***:***@");

async function main() {
  if (!email) {
    console.error("Which user? For example:\n");
    console.error("  node src/scripts/set-password.js owner@nandu.test\n");
    process.exit(1);
  }

  console.log(`Database: ${safeUri(config.mongoUri)}`);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`\nNo user with the email ${email}.`);
    const others = await User.find().select("email").lean();
    if (others.length) {
      console.error("\nUsers in this database:");
      for (const o of others) console.error(`  ${o.email}`);
    }
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`User found: ${user.email}\n`);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const password = (await rl.question("New password: ")).trim();
  const again = (await rl.question("Type it again:  ")).trim();
  rl.close();

  if (!password) {
    console.error("\nNothing entered. Nothing changed.");
    await mongoose.disconnect();
    process.exit(1);
  }
  if (password !== again) {
    console.error("\nThose do not match. Nothing changed.");
    await mongoose.disconnect();
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\nUse at least 8 characters. Nothing changed.");
    await mongoose.disconnect();
    process.exit(1);
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  console.log(`\nDone. ${user.email} now signs in with the new password.`);
  console.log("The old one no longer works.");
  console.log("\nClear your screen if anyone can see it: type  cls  and press Enter.");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\nFailed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
