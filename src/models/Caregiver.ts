import mongoose, { Document } from "mongoose";

export interface ICaregiverRelation extends Document {
    user: mongoose.Types.ObjectId;
    caregiver: mongoose.Types.ObjectId;
    caregiverName: string;
    caregiverPhone: string;
    relation: string;
    status: string;
    permissions: {
        canViewMedicines: boolean;
        canEditMedicines: boolean;
        canReceiveAlerts: boolean;
        canViewHealthData: boolean;
    };
    invitedAt: Date;
    respondedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const caregiverRelationSchema = new mongoose.Schema<ICaregiverRelation>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        caregiverName: { type: String, trim: true },

        caregiverPhone: { type: String, required: true, trim: true },

        relation: {
            type: String,
            enum: ["Father", "Mother", "Brother", "Sister", "Spouse", "Friend", "Other"]
        },

        status: {
            type: String,
            enum: [
                "unregistered",
                "pending_invite",
                "invite_sent",
                "accepted",
                "rejected",
                "expired",
                "removed",
            ],
            default: "unregistered",
        },

        invitedAt: Date,
        respondedAt: Date,
    },
    { timestamps: true }
);

caregiverRelationSchema.index({ user: 1 });
caregiverRelationSchema.index({ caregiverPhone: 1 });
caregiverRelationSchema.index({ caregiver: 1 });

export default mongoose.model("Caregiver", caregiverRelationSchema);