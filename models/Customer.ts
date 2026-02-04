import mongoose, { Schema, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: { type: String },
    profession: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    remark: { type: String },
    lastDateOfService: { type: Date },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
  },
  { timestamps: true }
);

export default models.Customer ||
  mongoose.model("Customer", CustomerSchema);
