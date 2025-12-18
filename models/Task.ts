import mongoose, { Schema, models } from "mongoose";

const TaskSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    treesCount: { type: Number, required: true },
    rate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default models.Task || mongoose.model("Task", TaskSchema);
