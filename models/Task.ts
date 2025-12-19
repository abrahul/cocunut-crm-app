import mongoose, { Schema, models } from "mongoose";

const TaskSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    numberOfTrees: Number,
    ratePerTree: Number,
    totalAmount: Number,

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // Optional but useful
    adminEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default models.Task || mongoose.model("Task", TaskSchema);
