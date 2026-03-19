import mongoose, { Types } from "mongoose";

/** 🔹 Create Blog */
export interface CreateBlogRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  published?: boolean;
  author?: Types.ObjectId;
}

/** 🔹 Update Blog */
export interface UpdateBlogRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  published?: boolean;
  author?: Types.ObjectId;
}

/** 🔹 Blog Response (Single / List Item) */
export interface BlogDetailsResponse {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  readTime?: string;
  published: boolean;
  author: mongoose.Types.ObjectId;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface BlogListResponse {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: Partial<BlogDetailsResponse>[];
}