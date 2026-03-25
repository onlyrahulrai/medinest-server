import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  groupId: mongoose.Schema.Types.ObjectId;
  name: string;
  dosage: {
    amount: string;
    unit: string;
    perIntake: number;
  };
  routineIds: mongoose.Schema.Types.ObjectId[];

  customSchedule: {
    enabled: boolean;
    times: string[];
    frequency: 'daily' | 'weekly' | 'interval';
    interval: number;
    daysOfWeek?: number[];
  };

  mealTiming: {
    type: String,
    enum: [
      "before_food",
      "after_food",
      "with_food",
      "empty_stomach",
      "anytime",
    ]
  },

  duration: {
    startDate: Date;
    endDate?: Date;
    isOngoing: boolean;
  };

  notes?: string;

  status: {
    type: String,
    enum: ["active", "paused", "completed", "deleted"],
    default: "active",
  },

  meta: {
    color: String,
    photo: String,
  },

  reminderEnabled?: boolean;

  isActive: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  prescription: {
    prescribedBy?: string;
    purpose?: string;
  };
}

const MedicineSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    groupId: {
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

    routineIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routine", default: [] }],

    customSchedule: {
      enabled: { type: Boolean, default: false },

      times: [String],

      frequency: {
        type: String,
        enum: ["daily", "weekly", "interval"],
      },

      interval: Number, // every X days

      daysOfWeek: [Number],
    },

    mealTiming: {
      type: String,
      enum: [
        "before_food",
        "after_food",
        "with_food",
        "empty_stomach",
        "anytime",
      ],
    },

    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      isOngoing: { type: Boolean, default: false },
    },

    refill: {
      totalQuantity: Number,
      remainingQuantity: Number,
      unit: String, // tablets, ml
      refillReminderEnabled: { type: Boolean, default: false },
      refillAt: Number,
    },

    prescription: {
      prescribedBy: { type: String },
      purpose: { type: String }
    },

    notes: { type: String },

    status: {
      type: String,
      enum: ["active", "paused", "completed", "deleted"],
      default: "active",
    },

    meta: {
      color: String,
      photo: String,
    },

    reminderEnabled: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },

    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
MedicineSchema.index({ userId: 1, isActive: 1, status: 1 });
MedicineSchema.index({ groupId: 1 });
MedicineSchema.index({ routineIds: 1 });
MedicineSchema.index({ "duration.startDate": 1, "duration.endDate": 1 });

// MedicineSchema.pre("validate", function (next) {
//   const hasRoutine = this.routineIds && this.routineIds.length > 0;
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
