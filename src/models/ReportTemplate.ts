import mongoose, { Document, Model } from "mongoose";

/**
 * 1. Define allowed scopes (centralized & type-safe)
 */
export const REPORT_TEMPLATE_SCOPES = [
  "welcome",
  "guideline",
  "summary",
] as const;

export type ReportTemplateScope =
  typeof REPORT_TEMPLATE_SCOPES[number];

/**
 * 2. Interface
 */
export interface IReportTemplate extends Document {
  name: string;
  content: string;
  scope: ReportTemplateScope;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 3. Schema
 */
const ReportTemplateSchema = new mongoose.Schema<IReportTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    scope: {
      type: String,
      enum: REPORT_TEMPLATE_SCOPES,
      required: true,
      default: "welcome",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 4. Compound index for faster filtering
 */
ReportTemplateSchema.index({
  scope: 1,
  isActive: 1,
  isDeleted: 1,
});

/**
 * 5. Model
 */
const ReportTemplate: Model<IReportTemplate> =
  mongoose.model<IReportTemplate>(
    "ReportTemplate",
    ReportTemplateSchema
  );

export default ReportTemplate;
