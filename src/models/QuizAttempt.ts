import mongoose from "mongoose";

const QuizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },

    // Store answers for each question
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedOptions: [String], // user’s selected answer(s)
        isCorrect: Boolean,
        timeTaken: Number // in seconds for this question
      }
    ],

    // Randomized question order for this attempt (added)
    questionsOrder: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }
    ],
    
    currentQuestionIndex: { type: Number, default: 0 },

    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeTaken: { type: Number }, // in seconds for whole quiz

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress"
    },

    // For "continue to next quiz" feature
    nextQuizUnlocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
