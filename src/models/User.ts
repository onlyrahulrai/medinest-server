import mongoose, { Schema, Document } from "mongoose";

export interface ICaregiverContact {
  userId?: mongoose.Types.ObjectId;
  name?: string;
  phoneNumber?: string;
  relation?: string;
  verificationStatus?: "verified_user" | "unregistered_contact" | "verification_pending";
  inviteStatus?: "not_required" | "pending_invite" | "invite_sent" | "accepted" | "expired" | "rejected";
}

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  profile?: string;
  bio?: string;
  address?: string;
  roles?: mongoose.Types.ObjectId[];
  isActive?: boolean;
  isPhoneVerified?: boolean;
  dateOfBirth?: Date;
  weight?: number;
  gender?: "Male" | "Female" | "Other";
  conditions?: string[];
  isOnboardingCompleted?: boolean;
  onboardingStep?: number;
  languages?: string[];
  preferences?: {
    reminderTimes?: string[];
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shareActivityWithCaregiver?: boolean;
  };
  caregivers?: mongoose.Types.ObjectId[];
  managedPatients?: mongoose.Types.ObjectId[];
  caregiverContacts?: ICaregiverContact[];
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverContactSchema = new Schema<ICaregiverContact>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String },
    phoneNumber: { type: String },
    relation: { type: String },
    verificationStatus: {
      type: String,
      enum: ["verified_user", "unregistered_contact", "verification_pending"],
      default: "verification_pending",
    },
    inviteStatus: {
      type: String,
      enum: ["not_required", "pending_invite", "invite_sent", "accepted", "expired", "rejected"],
      default: "pending_invite",
    },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: {
      type: String,
      unique: true,
      required: true
    },
    profile: { type: String },
    bio: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    weight: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    conditions: { type: [String] },
    isOnboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    languages: { type: [String] },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    }],
    preferences: {
      type: Object,
      default: {}
    },
    caregivers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    managedPatients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    caregiverContacts: {
      type: [CaregiverContactSchema],
      default: [],
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
