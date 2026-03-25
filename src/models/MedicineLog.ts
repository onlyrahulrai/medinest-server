import mongoose, { Schema, Document } from "mongoose";

export interface IMedicineLog extends Document {
  medicineId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  groupId?: mongoose.Schema.Types.ObjectId;
  routineId?: mongoose.Schema.Types.ObjectId;
  scheduledTime: Date;
  takenAt?: Date;
  source: "system" | "manual";
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'late';
  markedBy?: mongoose.Schema.Types.ObjectId;
  markedByRole?: 'patient' | 'caregiver';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineLogSchema: Schema = new Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineGroup" },

    routineId: { type: mongoose.Schema.Types.ObjectId, ref: "Routine" },

    scheduledTime: { type: Date, required: true },

    takenAt: { type: Date },

    source: {
      type: String,
      enum: ["system", "manual"],
      default: "system"
    },

    status: {
      type: String,
      enum: ["pending", "taken", "missed", "skipped", "late"],
      default: 'pending',
      required: true
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    markedByRole: {
      type: String,
      enum: ["patient", "caregiver"],
    },

    notes: { type: String, trim: true },

  },
  { timestamps: true }
);

MedicineLogSchema.index({ scheduledTime: 1, status: 1 });
MedicineLogSchema.index({ userId: 1, medicineId: 1, scheduledTime: 1 }, { unique: true });
MedicineLogSchema.index({ userId: 1, scheduledTime: -1 });
MedicineLogSchema.index({ groupId: 1, scheduledTime: 1 });

MedicineLogSchema.pre("validate", function (next) {

  if (this.status === "taken" && !this.takenAt) {
    return next(new Error("takenAt required"));
  }

  if (this.status !== "taken" && this.takenAt) {
    return next(new Error("takenAt only allowed for taken"));
  }

  if (this.markedBy && !this.markedByRole) {
    return next(new Error("markedByRole required"));
  }

  if (this.takenAt && this.takenAt > new Date()) {
    return next(new Error("takenAt cannot be future"));
  }

  next();
});

const MedicineLog = mongoose.model<IMedicineLog>("MedicineLog", MedicineLogSchema);
export default MedicineLog;
