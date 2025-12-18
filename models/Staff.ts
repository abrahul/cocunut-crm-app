import mongoose, { Schema, models } from "mongoose";

const StaffSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Staff ||
  mongoose.model("Staff", StaffSchema);
