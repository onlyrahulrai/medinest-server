import mongoose, { Document } from "mongoose";

export interface IMedicineGroup extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    name: string;
    type: "single" | "multi";
    startDate: Date;
    endDate: Date;
    createdBy: mongoose.Schema.Types.ObjectId;
    status: "active" | "completed" | "archived";
    notes: string;
    deletedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MedicineGroupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, trim: true },

    type: {
        type: String,
        enum: ["single", "multi"],
        default: "single"
    },

    startDate: Date,
    endDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
        type: String,
        enum: ["active", "completed", "archived"],
        default: "active",
    },

    notes: String,

    deletedAt: Date,

    isActive: { type: Boolean, default: true },
}, { timestamps: true });

MedicineGroupSchema.index({ userId: 1, status: 1 });
MedicineGroupSchema.index({ createdBy: 1 });

MedicineGroupSchema.pre("validate", function (next) {
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
        return next(new Error("endDate cannot be before startDate"));
    }
    next();
});

export default mongoose.model("MedicineGroup", MedicineGroupSchema);