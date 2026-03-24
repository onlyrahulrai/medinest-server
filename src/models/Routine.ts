import mongoose, { Schema, Document } from "mongoose";

export interface IRoutine extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  time: string; // '09:00'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    time: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RoutineSchema.index({ userId: 1, isActive: 1 });

const Routine = mongoose.model<IRoutine>("Routine", RoutineSchema);
export default Routine;
