import mongoose, { Schema, models } from "mongoose";
import "./Admin";

const AdminSessionSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    sessionName: { type: String, required: true, trim: true },
    loginAt: { type: Date, required: true, default: Date.now, index: true },
    lastActivityAt: { type: Date, required: true, default: Date.now },
    logoutAt: { type: Date, default: null },
    logoutReason: {
      type: String,
      enum: ["manual", "timeout"],
      default: null,
    },
  },
  { timestamps: true }
);

// Speeds up stale-session cleanup scans.
AdminSessionSchema.index({ logoutAt: 1, lastActivityAt: 1 });

export default models.AdminSession ||
  mongoose.model("AdminSession", AdminSessionSchema);
