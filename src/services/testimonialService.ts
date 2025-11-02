import Testimonial, { ITestimonial } from "../models/TestimonialStory";
import { Types } from "mongoose";

interface PaginatedResponse<T> {
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  total: number;
  results: Partial<T>[];
}

/**
 * Get all testimonials (paginated)
 */
export const getAllTestimonials = async (
  page: number = 1,
  limit: number = 10,
  flag: string = "published"
): Promise<PaginatedResponse<ITestimonial>> => {
  const effectivePage = Math.max(1, page);
  const effectiveLimit = Math.max(1, Math.min(limit, 100));
  const skip = (effectivePage - 1) * effectiveLimit;

  const filter: any = {};
  
  if (flag === "published") {
    filter.published = true;
  }

  const total = await Testimonial.countDocuments(filter);

  const results = await Testimonial.find(filter)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .skip(skip)
    .limit(effectiveLimit)
    .sort({ createdAt: -1 })
    .lean();

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
 * Get single testimonial by ID
 */
export const getTestimonialById = async (
  id: string
): Promise<Partial<ITestimonial> | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await Testimonial.findById(id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();
};

/**
 * Create new testimonial
 */
export const createTestimonial = async (
  data: Partial<ITestimonial>
): Promise<ITestimonial> => {
  const testimonial = new Testimonial(data);
  return await testimonial.save();
};

/**
 * Update testimonial by ID
 */
export const updateTestimonial = async (
  id: string,
  data: Partial<ITestimonial>
): Promise<Partial<ITestimonial> | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await Testimonial.findByIdAndUpdate(id, data, { new: true }).lean();
};

/**
 * Delete testimonial by ID
 */
export const deleteTestimonial = async (
  id: string
): Promise<Partial<ITestimonial> | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await Testimonial.findByIdAndDelete(id).lean();
};
