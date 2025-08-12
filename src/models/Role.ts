import mongoose, { Schema, Document } from "mongoose";
import "./Permission"; // ✅ ensures Permission is registered

export interface IRole extends Document {
  name: string;
  order?: number;
  permissions: mongoose.Types.ObjectId[];
}

const RoleSchema = new Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
        default: []
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IRole>("Role", RoleSchema);
