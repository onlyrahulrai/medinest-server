import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  profile?: string;
  bio?: string;
  address?: string;
  password?: string;
  roles?: mongoose.Types.ObjectId[];
  isActive?: boolean;
  isPhoneVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    languages: { type: [String] },
    password: { type: String },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    }],
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
