import mongoose, { Schema, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String },
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
