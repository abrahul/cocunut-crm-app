import mongoose, { Schema, models } from "mongoose";

const StaffSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },

    otpHash: String,
    otpExpiresAt: Date,

    otpLastSentAt: Date,
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Staff || mongoose.model("Staff", StaffSchema);
