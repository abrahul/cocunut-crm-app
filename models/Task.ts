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
    taskType: {
      type: String,
      enum: ["main", "side"],
      default: "main",
    },
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: false,
      default: undefined,
    },
    sideTaskCustomerPhone: {
      type: String,
      required: false,
      default: undefined,
    },
    numberOfTrees: Number,
    ratePerTree: Number,
    totalAmount: Number,
    serviceDate: { type: String, required: true },
    serviceTime: { type: String, required: false, default: undefined },
    medicine: { type: Boolean, required: true },
    exactAddress: { type: String, required: true },
    remark: { type: String },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    completedDate: {
      type: Date,
    },

    // Optional but useful
    adminEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const TaskModel = models.Task || mongoose.model("Task", TaskSchema);

// In dev/hot-reload, an already-compiled model can retain old required flags.
const serviceTimePath = TaskModel.schema.path("serviceTime");
type RequiredToggler = { required: (isRequired: boolean) => unknown };
if (
  serviceTimePath &&
  typeof (serviceTimePath as RequiredToggler).required === "function"
) {
  (serviceTimePath as RequiredToggler).required(false);
}

export default TaskModel;
