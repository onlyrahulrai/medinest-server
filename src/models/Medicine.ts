import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  user: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;

  group: mongoose.Schema.Types.ObjectId;

  name: string;
  dosage: {
    amount: number;
    unit: string;
    perIntake: number;
  };
  routines: mongoose.Schema.Types.ObjectId[];
  customSchedule: {
    enabled: boolean;
    times: string[];
    frequency: 'Once daily' | 'Twice daily' | 'Thrice daily' | 'Four times daily' | 'As needed';
  };
  mealTiming: {
    type: String,
    enum: [
      "Before Meal",
      "After Meal",
      "With Meal",
      "Empty Stomach",
      "Bed Time",
      "Any Time",
    ]
  },
  duration: {
    startDate: Date;
    endDate?: Date;
    forHowLong: string;
    isOngoing: boolean;
  };
  isDurationInherited: boolean;
  refill: {
    totalQuantity: number,
    remainingQuantity: number,
    refillReminderEnabled: boolean,
    refillAt: number,
  },
  purpose?: string;
  notes?: string;
  status: {
    type: string,
    enum: ["active", "paused", "completed", "deleted"],
    default: "active",
  },
  meta: {
    color: string,
    photo: string,
    type: string,
  },
  reminderEnabled?: boolean;

  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineGroup",
      required: true,
    },

    name: { type: String, required: true },
    dosage: {
      amount: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true },
      perIntake: { type: Number, default: 1, min: 1 }
    },
    routines: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routine", default: [] }],
    customSchedule: {
      enabled: { type: Boolean, default: false },
      times: [String],
      frequency: {
        type: String,
        enum: ["Once daily", "Twice daily", "Thrice daily", "Four times daily", "As needed"],
      },
    },
    mealTiming: {
      type: String,
      enum: [
        "Before Meal",
        "After Meal",
        "With Meal",
        "Empty Stomach",
        "Bed Time",
        "Any Time",
      ],
    },
    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      forHowLong: { type: String },
      isOngoing: { type: Boolean, default: false },
    },
    isDurationInherited: { type: Boolean, default: false },
    refill: {
      totalQuantity: Number,
      remainingQuantity: Number,
      refillReminderEnabled: { type: Boolean, default: false },
      refillAt: Number,
    },
    purpose: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "deleted"],
      default: "active",
    },
    meta: {
      color: { type: String },
      photo: { type: String },
      type: { type: String },
    },
    reminderEnabled: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
MedicineSchema.index({ user: 1, isActive: 1, status: 1 });
MedicineSchema.index({ group: 1 });
MedicineSchema.index({ routines: 1 });
MedicineSchema.index({ "duration.startDate": 1, "duration.endDate": 1 });

// MedicineSchema.pre("validate", function (next) {
//   const hasRoutine = this.routines && this.routines.length > 0;
//   const hasCustom = this.customSchedule?.enabled;

//   if (hasRoutine && hasCustom) {
//     return next(new Error("Cannot use both routine and custom schedule"));
//   }

//   if (!hasRoutine && !hasCustom) {
//     return next(new Error("Schedule is required"));
//   }

//   // custom schedule validation
//   if (hasCustom) {
//     if (!this.customSchedule.frequency) {
//       return next(new Error("frequency is required"));
//     }

//     if (!this.customSchedule.times?.length) {
//       return next(new Error("Custom schedule must have at least one time"));
//     }

//     // Normalize times (optional)
//     this.customSchedule.times = this.customSchedule.times.map((t: string) => {
//       const [h, m] = t.split(":");
//       return `${h.padStart(2, "0")}:${m}`;
//     });

//     // Validate format
//     const invalidTime = this.customSchedule.times.find(
//       (t: string) => !/^([01]\d|2[0-3]):([0-5]\d)$/.test(t)
//     );

//     if (invalidTime) {
//       return next(new Error("Invalid time format"));
//     }

//     // Duplicate check
//     const uniqueTimes = new Set(this.customSchedule.times);

//     if (uniqueTimes.size !== this.customSchedule.times.length) {
//       return next(new Error("Duplicate times are not allowed"));
//     }

//     // Weekly validation
//     if (this.customSchedule.frequency === "weekly") {
//       if (!this.customSchedule.daysOfWeek?.length) {
//         return next(new Error("daysOfWeek required"));
//       }

//       const invalidDay = this.customSchedule.daysOfWeek.find(
//         (d: number) => d < 0 || d > 6
//       );

//       if (invalidDay !== undefined) {
//         return next(new Error("Invalid day in daysOfWeek"));
//       }
//     }

//     // Interval validation
//     if (this.customSchedule.frequency === "interval") {
//       if (!this.customSchedule.interval || this.customSchedule.interval <= 0) {
//         return next(new Error("Interval must be greater than 0"));
//       }
//     }
//   }

//   // duration validation
//   if (this.duration?.endDate && this.duration.endDate < this.duration.startDate) {
//     return next(new Error("Invalid duration"));
//   }

//   next();
// });

const Medicine = mongoose.model<IMedicine>("Medicine", MedicineSchema);
export default Medicine;
