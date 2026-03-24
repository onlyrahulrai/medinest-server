import mongoose, { Schema, Document } from "mongoose";

export interface IMedicineLog extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  medicineId: mongoose.Schema.Types.ObjectId;
  routineId?: mongoose.Schema.Types.ObjectId;
  scheduledTime: Date;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  notes?: string;
  takenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineLogSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    routineId: { type: mongoose.Schema.Types.ObjectId, ref: "Routine" },
    scheduledTime: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'taken', 'skipped', 'missed'], 
      default: 'pending',
      required: true 
    },
    notes: { type: String },
    takenAt: { type: Date },
  },
  { timestamps: true }
);

MedicineLogSchema.index({ userId: 1, scheduledTime: 1 });
MedicineLogSchema.index({ medicineId: 1, status: 1 });

const MedicineLog = mongoose.model<IMedicineLog>("MedicineLog", MedicineLogSchema);
export default MedicineLog;
