import mongoose, { Document } from "mongoose";

export interface IMedicineGroup extends Document {
    user: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;

    name: string;
    type: "single" | "multi";
    duration: {
        startDate: Date;
        endDate: Date;
        forHowLong: string;
        isOngoing: boolean;
    }
    status: "active" | "completed" | "archived";
    notes: string;
    prescribedBy: string;
    reminderEnabled: boolean;

    deletedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MedicineGroupSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    name: { type: String, trim: true },
    type: {
        type: String,
        enum: ["single", "multi"],
        default: "single"
    },
    duration: {
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        forHowLong: {
            type: String,
        },
        isOngoing: {
            type: Boolean,
            default: false,
        }
    },
    status: {
        type: String,
        enum: ["active", "completed", "archived"],
        default: "active",
    },
    notes: String,
    prescribedBy: { type: String, trim: true },
    reminderEnabled: { type: Boolean, default: true },

    deletedAt: Date,
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

MedicineGroupSchema.index({ user: 1, status: 1 });
MedicineGroupSchema.index({ createdBy: 1 });

MedicineGroupSchema.pre("validate", function (next) {
    if (this.duration.endDate && this.duration.startDate && this.duration.endDate < this.duration.startDate) {
        return next(new Error("endDate cannot be before startDate"));
    }
    next();
});

export default mongoose.model("MedicineGroup", MedicineGroupSchema);