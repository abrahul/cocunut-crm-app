import mongoose, { Schema, models } from "mongoose";

const LocationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default models.Location ||
  mongoose.model("Location", LocationSchema);
