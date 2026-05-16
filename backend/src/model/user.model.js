import mongoose from "mongoose";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("passwordHash")) {
    return;
  }

  const looksHashed =
    typeof this.passwordHash === "string" &&
    /^\$2[aby]\$/.test(this.passwordHash);
  if (looksHashed) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
});

export default mongoose.model("User", userSchema);
