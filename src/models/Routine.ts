import mongoose, { Schema, Document } from "mongoose";

export interface IRoutine extends Document {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  time: string; // '09:00'
  type: "daily" | "weekly";
  daysOfWeek?: number[];
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:mm
    },
    type: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    daysOfWeek: [Number], // optional for weekly
    isActive: { type: Boolean, default: true },
    deletedAt: Date,
  },
  { timestamps: true }
);

RoutineSchema.index({ user: 1, time: 1 });

const Routine = mongoose.model<IRoutine>("Routine", RoutineSchema);
export default Routine;
