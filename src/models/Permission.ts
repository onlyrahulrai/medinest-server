import mongoose, { Schema, Document } from "mongoose";

export interface IPermission extends Document {
  name: string;
  code: string;
}

const PermissionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
    },
    code: {
      type: String,
      required: [true, "Code is required!"],
      unique: true,
    },
  },
  { timestamps: true }
);

const Permission = mongoose.model<IPermission>("Permission", PermissionSchema);

export default Permission;
