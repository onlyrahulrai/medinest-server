import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  patientId?: mongoose.Schema.Types.ObjectId;
  name: string;
  type: string;
  dosage: {
    amount: string;
    unit: string;
    perIntake: number;
  };
  routineIds: mongoose.Schema.Types.ObjectId[];
  customSchedule: {
    enabled: boolean;
    times: string[];
    frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
    daysOfWeek?: number[];
  };
  duration: {
    startDate: Date;
    endDate?: Date;
  };
  instructions?: string;
  notes?: string;
  mealTiming?: string[];
  prescription: {
    prescribedBy?: string;
    purpose?: string;
  };
  color?: string;
  imageUrl?: string;
  refill: {
    refillReminder: boolean;
    totalQuantity: number;
    remainingQuantity: number;
    refillAt: number;
  };
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "ManagedPatient" },
    name: { type: String, required: true },
    type: { type: String, required: true },
    dosage: {
      amount: { type: String, required: true },
      unit: { type: String, required: true },
      perIntake: { type: Number, default: 1 }
    },
    routineIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routine", default: [] }],
    customSchedule: {
      enabled: { type: Boolean, default: false },
      times: { type: [String], default: [] },
      frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'custom', 'as_needed'], 
        default: 'daily'
      },
      daysOfWeek: { type: [Number], default: [] }
    },
    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date }
    },
    mealTiming: { type: [String], default: [] },
    prescription: {
      prescribedBy: { type: String },
      purpose: { type: String }
    },
    notes: { type: String },
    instructions: { type: String },
    color: { type: String },
    imageUrl: { type: String },
    refill: {
      refillReminder: { type: Boolean, default: false },
      totalQuantity: { type: Number, default: 0 },
      remainingQuantity: { type: Number, default: 0 },
      refillAt: { type: Number, default: 0 }
    },
    reminderEnabled: { type: Boolean, default: true },
    scheduleGroupId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
MedicineSchema.index({ userId: 1, isActive: 1 });
MedicineSchema.index({ "duration.startDate": 1, "duration.endDate": 1 });

const Medicine = mongoose.model<IMedicine>("Medicine", MedicineSchema);
export default Medicine;
