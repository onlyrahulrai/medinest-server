import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  age?: number;
  address?: string;
  profile?: string;
  password?: string;
  bio?: string;
  role?: mongoose.Types.ObjectId | null;
  isActive?: boolean;
  isVerified?: boolean;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    email: { type: String },
    phone: {
      type: String,
    },
    age: { type: Number },
    address: { type: String },
    profile: { type: String },
    bio: { type: String },
    password: { type: String },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
