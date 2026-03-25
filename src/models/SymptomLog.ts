import mongoose, { Document } from "mongoose";

export interface ISymptomLog extends Document {
    user: mongoose.Types.ObjectId;
    mood: "happy" | "neutral" | "sad" | "tired" | "pain" | "anxious";
    symptoms: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SymptomLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        mood: {
            type: String,
            enum: ["happy", "neutral", "sad", "tired", "pain", "anxious"],
            required: true,
        },

        symptoms: {
            type: [String],
            required: true,
        },

        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);


// 📊 Index for history
SymptomLogSchema.index({ user: 1, createdAt: -1 });


// 🛡️ Validation
SymptomLogSchema.pre("validate", function (next) {
    if (!this.symptoms || this.symptoms.length === 0) {
        return next(new Error("At least one symptom is required"));
    }

    if (this.symptoms.length > 10) {
        return next(new Error("Too many symptoms"));
    }

    next();
});


export default mongoose.model<ISymptomLog>("SymptomLog", SymptomLogSchema);