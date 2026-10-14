import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Who can log into the dashboard.
 * role "owner" / "staff" belong to one lab. role "admin" is you, across all labs.
 */
const userSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "owner", "staff"], default: "owner" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

export const User = mongoose.model("User", userSchema);
