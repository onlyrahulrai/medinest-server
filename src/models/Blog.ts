import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  readTime: string;
  published: boolean;
  author: mongoose.Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    readTime: { type: String },
    published: { type: Boolean, default: false },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBlog>("Blog", BlogSchema);