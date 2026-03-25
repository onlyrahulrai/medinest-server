import mongoose, { Document } from "mongoose";

export interface IHealthLog extends Document {
    user: mongoose.Types.ObjectId;
    type: "steps" | "heart_rate" | "weight" | "workout";
    value: number;
    unit: string;
    recordedAt: Date;
    source: "manual" | "device";
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const healthLogSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        type: {
            type: String,
            enum: ["steps", "heart_rate", "weight", "workout"],
            required: true,
        },

        value: {
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            enum: ["steps", "bpm", "kg", "lbs", "minutes"],
            required: true,
        },

        recordedAt: { type: Date, default: Date.now },

        source: {
            type: String,
            enum: ["manual", "device"],
            default: "manual",
        },

        notes: { type: String, trim: true },
    },
    { timestamps: true }
);

// healthLogSchema.index({ user: 1, type: 1, recordedAt: 1 }, { unique: true, sparse: true }
// );

// 📊 Indexes (optimized for charts & queries)
healthLogSchema.index({ user: 1, type: 1, recordedAt: -1 });
healthLogSchema.index({ user: 1, recordedAt: -1 });

// 🛡️ Validation (type ↔ unit consistency)
healthLogSchema.pre("validate", function (next) {
    const validUnits: Record<string, string[]> = {
        steps: ["steps"],
        heart_rate: ["bpm"],
        weight: ["kg", "lbs"],
        workout: ["minutes"],
    };

    if (!this.type || !validUnits[this.type]) {
        return next(new Error("Invalid type"));
    }

    if (!validUnits[this.type].includes(this.unit)) {
        return next(new Error("Invalid unit for selected type"));
    }

    next();
});

export default mongoose.model("HealthLog", healthLogSchema);
