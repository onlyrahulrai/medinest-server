import mongoose, { Schema, Document } from "mongoose";

export interface ICaregiverInvitation extends Document {
  senderUserId: mongoose.Types.ObjectId;
  caregiverPhone: string;
  caregiverUserId?: mongoose.Types.ObjectId;
  status: "invited" | "accepted" | "rejected";
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverInvitationSchema: Schema = new Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    caregiverPhone: { type: String, required: true },
    caregiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["invited", "accepted", "rejected"],
      default: "invited",
    },
    message: { type: String },
  },
  { timestamps: true }
);

// Index for fast lookups by phone
CaregiverInvitationSchema.index({ caregiverPhone: 1, status: 1 });

const CaregiverInvitation = mongoose.model<ICaregiverInvitation>("CaregiverInvitation", CaregiverInvitationSchema);

export default CaregiverInvitation;
