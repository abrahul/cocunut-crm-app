import mongoose, { Schema, models } from "mongoose";

const AdminSchema = new Schema(
  {
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Admin || mongoose.model("Admin", AdminSchema);
