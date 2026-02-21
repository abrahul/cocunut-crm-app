import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema(
  {
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // plain-text admin password
    passwordHash: { type: String, select: false }, // legacy hash field (migration only)
    passwordSalt: { type: String, select: false }, // legacy salt field (migration only)
    otpSessionId: String,
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: Date,
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpiresAt: Date,
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetOtpLastSentAt: Date,
  },
  { timestamps: true }
);

export default models.Admin || mongoose.model("Admin", AdminSchema);
