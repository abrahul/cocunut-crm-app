import mongoose, { Schema, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true, index: true },
    alternateMobile: { type: String },
    profession: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    numberOfTrees: { type: Number },
    email: { type: String },
    remark: { type: String },
    lastDateOfService: { type: Date },
    serviceDate: { type: Date },
    dueDate: { type: Date },
    isArchived: { type: Boolean, default: false },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ mobile: 1 }, { unique: true });

export default models.Customer ||
  mongoose.model("Customer", CustomerSchema);
