import mongoose, { Document } from "mongoose";

export interface INotificationRecipient {
    user: mongoose.Types.ObjectId;
    role: "patient" | "caregiver";
    read: boolean;
}

export interface INotification extends Document {
    recipients: INotificationRecipient[];
    type: "medicine_reminder" | "missed_dose" | "caregiver_alert" | "refill" | "system";
    title: string;
    message: string;
    relatedId: mongoose.Types.ObjectId;
    relatedType: "medicine" | "log" | "invitation" | "group";
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new mongoose.Schema(
    {
        recipients: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
                },
                role: {
                    type: String,
                    enum: ["patient", "caregiver"],
                    required: true
                },
                read: { type: Boolean, default: false },
            },
        ],

        type: {
            type: String,
            enum: ["medicine_reminder", "missed_dose", "caregiver_alert", "refill", "system"],
            required: true,
        },

        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },

        relatedId: mongoose.Schema.Types.ObjectId,

        relatedType: {
            type: String,
            enum: ["medicine", "log", "invitation", "group"],
            required: true
        },
    },
    { timestamps: true }
);

notificationSchema.index({ "recipients.user": 1, "recipients.read": 1, createdAt: -1 });

notificationSchema.index({ relatedId: 1, relatedType: 1 });

notificationSchema.pre("validate", function (next) {
    const ids = this.recipients.map(r => r.user.toString());
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        return next(new Error("Duplicate recipients not allowed"));
    }

    next();
});

export default mongoose.model("Notification", notificationSchema);
