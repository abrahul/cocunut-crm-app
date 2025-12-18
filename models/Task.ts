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

    numberOfTrees: {
      type: Number,
      required: true,
    },

    ratePerTree: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default models.Task || mongoose.model("Task", TaskSchema);
