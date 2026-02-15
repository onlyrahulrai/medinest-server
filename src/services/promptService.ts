import Prompt, { IPrompt } from "../models/Prompt";
import { Types } from "mongoose";
import {
  ErrorMessageResponse,
  FieldValidationError,
} from "../types/schema/Common";

interface PaginatedResponse<T> {
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  total: number;
  results: Partial<T>[];
}

/**
 * Get all prompts (paginated)
 * If assessment provided → filter by assessment
 * If not → return all (admin use)
 */
export const getAllPrompts = async (
  page: number = 1,
  limit: number = 10,
  assessment?: string,
  flag?: "active" | "admin",
  fields?: string
): Promise<PaginatedResponse<IPrompt>> => {
  const effectivePage = Math.max(1, page);
  const effectiveLimit = Math.max(1, Math.min(limit, 100));
  const skip = (effectivePage - 1) * effectiveLimit;

  /* =========================
     FILTER
  ========================== */
  const filter: any = { isDeleted: false };

  if (flag === "active") {
    filter.isActive = true;
  }

  if (assessment && Types.ObjectId.isValid(assessment)) {
    filter.assessment = new Types.ObjectId(assessment);
  }

  /* =========================
     FIELD PROJECTION
  ========================== */

  let projection = "-__v";

  if (fields) {
    const allowedFields = [
      "_id",
      "name",
      "content",
      "assessment",
      "isActive",
      "createdAt",
      "updatedAt",
    ];

    const requestedFields = fields
      .split(",")
      .map((f) => f.trim())
      .filter((f) => allowedFields.includes(f));

    if (requestedFields.length > 0) {
      projection = requestedFields.join(" ");
    }
  }

  /* =========================
     QUERY
  ========================== */

  const total = await Prompt.countDocuments(filter);

  const query = Prompt.find(filter)
    .select(projection)
    .skip(skip)
    .limit(effectiveLimit)
    .sort({ createdAt: -1 });

  // ✅ Only populate if:
  // - fields is not provided (full fetch)
  // - OR assessment is explicitly requested
  if (!fields || projection.includes("assessment")) {
    query.populate("assessment", "title");
  }

  const results = await query.lean();

  return {
    page: effectivePage,
    limit: effectiveLimit,
    total,
    has_next: skip + results.length < total,
    has_prev: effectivePage > 1,
    results,
  };
};

/**
 * Get single prompt by ID
 */
export const getPromptById = async (
  id: string
): Promise<Partial<IPrompt> | null> => {
  if (!Types.ObjectId.isValid(id)) return null;

  return await Prompt.findById(id)
    .select("-__v")
    .populate("assessment", "title")
    .lean();
};

/**
 * Create new prompt
 */
export const createPrompt = async (
  data: Partial<IPrompt>
): Promise<IPrompt> => {
  const prompt = new Prompt({
    ...data,
  });

  return await prompt.save();
};

/**
 * Update prompt by ID
 */
export const updatePrompt = async (
  id: string,
  data: Partial<IPrompt>
): Promise<
  | Partial<IPrompt>
  | FieldValidationError
  | ErrorMessageResponse
  | null
> => {
  if (!Types.ObjectId.isValid(id)) return null;

  return await Prompt.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .select("-__v")
    .populate("assessment", "title")
    .lean();
};

/**
 * Soft delete prompt
 */
export const deletePrompt = async (
  id: string
): Promise<Partial<IPrompt> | null> => {
  if (!Types.ObjectId.isValid(id)) return null;

  return await Prompt.findByIdAndUpdate(
    id,
    { isDeleted: true, isActive: false },
    { new: true }
  ).lean();
};

/**
 * Get prompt for report generation
 * Priority:
 * 1️⃣ Assessment-specific active prompt
 * 2️⃣ Global active prompt (assessment = null)
 */
export const getPromptForAssessment = async (
  assessmentId?: string
): Promise<Partial<IPrompt> | null> => {
  let assessmentObjectId: Types.ObjectId | null = null;

  if (assessmentId && Types.ObjectId.isValid(assessmentId)) {
    assessmentObjectId = new Types.ObjectId(assessmentId);
  }

  // 1️⃣ Try assessment-specific prompt
  if (assessmentObjectId) {
    const assessmentPrompt = await Prompt.findOne({
      assessment: assessmentObjectId,
      isActive: true,
      isDeleted: false,
    })
      .select("-__v")
      .lean();

    if (assessmentPrompt) return assessmentPrompt;
  }

  // 2️⃣ Fallback to global prompt
  return await Prompt.findOne({
    assessment: null,
    isActive: true,
    isDeleted: false,
  })
    .select("-__v")
    .lean();
};
