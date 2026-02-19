import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema(
  {
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // legacy plain-text field
    passwordHash: { type: String, select: false },
    passwordSalt: { type: String, select: false },
    otpSessionId: String,
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: Date,
  },
  { timestamps: true }
);

export default models.Admin || mongoose.model("Admin", AdminSchema);
