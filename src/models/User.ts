import mongoose, { Schema, Document } from "mongoose";

export interface IProfile {
  pic: string;
  bio: string;
  address: string;
  dateOfBirth: Date;
  gender: "Male" | "Female" | "Other";
  allergies: string[];
  conditions: string[];
  bloodGroup: string;
  weight: number;
  height: number;
}

export interface IUser extends Document {
  name?: string;
  phone?: string;
  email?: string;
  roles?: mongoose.Types.ObjectId[];
  onboarding?: {
    completed: boolean;
    step: number;
  };
  profile?: IProfile;
  languages?: string[];
  preferences?: {
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shareActivityWithCaregiver?: boolean;
  };
  verified?: boolean;
  routinesEnabled?: boolean;
  deletedAt?: Date;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, trim: true },

    phone: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    email: { type: String, lowercase: true, trim: true, },

    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    }],

    onboarding: {
      completed: { type: Boolean, default: false },
      step: { type: Number, default: 0 },
    },

    profile: {
      pic: String,
      bio: { type: String },
      address: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["Male", "Female", "Other"] },

      allergies: [String],
      conditions: { type: [String] },

      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
      },

      weight: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },

    languages: { type: [String] },

    preferences: {
      soundEnabled: { type: Boolean, default: true },
      vibrationEnabled: { type: Boolean, default: true },
      shareActivityWithCaregiver: { type: Boolean, default: false },
    },

    verified: {
      type: Boolean,
      default: false,
    },

    routinesEnabled: { type: Boolean, default: true },

    deletedAt: { type: Date, default: null },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UserSchema.index({ "onboarding.completed": 1 });

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
