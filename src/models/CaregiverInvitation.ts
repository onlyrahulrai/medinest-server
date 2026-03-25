import mongoose, { Schema, Document } from "mongoose";

export interface ICaregiverInvitation extends Document {
  senderUserId: mongoose.Types.ObjectId;
  receiverPhone: string;
  receiverUserId?: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "expired";
  message?: string;
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverInvitationSchema: Schema = new Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    receiverPhone: { type: String, required: true },

    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },

    message: { type: String },

    respondedAt: Date,

    expiresAt: Date,
  },
  { timestamps: true }
);

// Prevent duplicate active invites
CaregiverInvitationSchema.index(
  { senderUserId: 1, receiverPhone: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Receiver lookup
CaregiverInvitationSchema.index({ receiverUserId: 1, status: 1 });

// Existing index
CaregiverInvitationSchema.index({ receiverPhone: 1, status: 1 });

CaregiverInvitationSchema.pre("validate", function (next) {
  if (this.status === "accepted" || this.status === "rejected") {
    if (!this.respondedAt) {
      this.respondedAt = new Date();
    }
  }

  if (this.status === "pending" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  next();
});

const CaregiverInvitation = mongoose.model<ICaregiverInvitation>("CaregiverInvitation", CaregiverInvitationSchema);

export default CaregiverInvitation;
