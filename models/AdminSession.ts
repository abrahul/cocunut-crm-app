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

export default models.AdminSession ||
  mongoose.model("AdminSession", AdminSessionSchema);
