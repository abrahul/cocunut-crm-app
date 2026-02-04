import mongoose, { Schema, models } from "mongoose";

const LocationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    defaultRate: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default models.Location ||
  mongoose.model("Location", LocationSchema);
