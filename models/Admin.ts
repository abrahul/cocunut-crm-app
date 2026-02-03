import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema(
  {
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otpSessionId: String,
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: Date,
  },
  { timestamps: true }
);

export default models.Admin || mongoose.model("Admin", AdminSchema);
