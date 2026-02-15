import mongoose, { Document, Types } from "mongoose";

export interface IPrompt extends Document {
  name: string;
  content: string;
  assessment?: Types.ObjectId | null;
  isActive: boolean;
  isDeleted: boolean;
}

const PromptSchema = new mongoose.Schema<IPrompt>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    // null = Global prompt
    // ObjectId = Assessment-specific prompt
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup
PromptSchema.index({ assessment: 1, isActive: 1, isDeleted: 1 });

const Prompt = mongoose.model<IPrompt>("Prompt", PromptSchema);

export default Prompt;
