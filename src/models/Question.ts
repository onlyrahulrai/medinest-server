import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const QuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["multiple_choice", "true_false", "fill_blank", "matching_pairs"],
      default: "multiple_choice",
    },
    options: {
      type: [OptionSchema],
      validate: {
        validator: (opts: any[]) => opts.length > 0,
        message: "At least one option is required.",
      },
    },
    media: {
      image: { type: String, default: null },
      video: { type: String, default: null },
      audio: { type: String, default: null },
    },
    points: { type: Number, default: 1 },
    timeLimit: { type: Number, default: 30 }, // seconds
  },
  { timestamps: true }
);

export default mongoose.model("Question", QuestionSchema);
