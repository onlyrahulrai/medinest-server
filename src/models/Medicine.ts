import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  type: string;
  dosage: string;
  dosageUnit?: string;
  schedule: {
    times: string[]; // ['08:00', '20:00']
    frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
    daysOfWeek?: number[]; // [0-6] for Sun-Sat
  };
  duration: {
    startDate: Date;
    endDate?: Date;
  };
  instructions?: string;
  notes?: string;
  mealTiming?: string[];
  prescribedBy?: string;
  purpose?: string;
  color?: string;
  imageUrl?: string;
  refillReminder?: boolean;
  currentSupply?: number;
  totalSupply?: number;
  refillAt?: number;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  useGlobal: boolean;
  isActive: boolean;
  logs: Array<{
    takenAt: Date;
    status: 'taken' | 'skipped' | 'missed';
    notes?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    dosage: { type: String, required: true },
    dosageUnit: { type: String },
    schedule: {
      times: { type: [String], required: true },
      frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'custom', 'as_needed'], 
        default: 'daily',
        required: true 
      },
      daysOfWeek: { type: [Number], default: [] }
    },
    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date }
    },
    instructions: { type: String },
    notes: { type: String },
    mealTiming: { type: [String], default: [] },
    prescribedBy: { type: String },
    purpose: { type: String },
    color: { type: String },
    imageUrl: { type: String },
    refillReminder: { type: Boolean, default: false },
    currentSupply: { type: Number, default: 0 },
    totalSupply: { type: Number, default: 0 },
    refillAt: { type: Number, default: 0 },
    reminderEnabled: { type: Boolean, default: true },
    scheduleGroupId: { type: String },
    useGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    logs: [
      {
        takenAt: { type: Date, required: true },
        status: { type: String, enum: ['taken', 'skipped', 'missed'], required: true },
        notes: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Indexes for performance
MedicineSchema.index({ userId: 1, isActive: 1 });
MedicineSchema.index({ "duration.startDate": 1, "duration.endDate": 1 });

const Medicine = mongoose.model<IMedicine>("Medicine", MedicineSchema);
export default Medicine;
