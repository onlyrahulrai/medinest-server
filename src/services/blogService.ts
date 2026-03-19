import BlogModel from "../models/Blog";
import { Types } from "mongoose";
import { BlogDetailsResponse, BlogListResponse } from "../types/schema/Blog";
import { USER_ROLES } from "../constraints/common";

export const getAllBlogs = async (req: any, query: any): Promise<BlogListResponse> => {
  const { page, limit, search, category, tag, author, status } = query;

  const user = req?.user;

  const effectivePage = Math.max(1, page);
  const effectiveLimit = Math.max(1, Math.min(limit, 100));
  const skip = (effectivePage - 1) * effectiveLimit;

  const filter: any = {
    isDeleted: false,
  };

  if (status === "active") {
    filter.isActive = true;
  }

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (user?.role !== USER_ROLES.USER) {
    filter.published = true;
  }

  if (user?.role !== USER_ROLES.COUNSELLOR) {
    filter.author = user._id;
  }

  if (author) {
    if (!Types.ObjectId.isValid(author)) {
      throw new Error("Invalid author ID");
    }

    filter.author = author;
  }

  const total = await BlogModel.countDocuments(filter);

  const results = await BlogModel.find(filter).select("-__v")
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
    results: results as unknown as BlogDetailsResponse[],
  };
};

export const getBlogById = async (req: any, blogId: string): Promise<BlogDetailsResponse> => {
  const user = req?.user;

  if (!Types.ObjectId.isValid(blogId)) {
    throw new Error("Invalid blog ID");
  }

  const blog = await BlogModel.findById(blogId).select("-__v").lean();

  if (!blog) {
    throw new Error("Blog not found");
  }

  if (user?.role !== USER_ROLES.USER && !blog.published) {
    throw new Error("Blog not found");
  }

  return blog as unknown as BlogDetailsResponse;
};

export const createBlog = async (blogData: any) => {
  const { title, slug, excerpt, content, coverImage, category, tags, readTime, published, author } = blogData;

  const blog = new BlogModel({
    title,
    slug,
    excerpt,
    content,
    coverImage,
    category,
    tags,
    readTime,
    published,
    author,
  });

  await blog.save();

  return blog;
};

export const updateBlog = async (blogId: string, updateData: any) => {
  // Logic to update an existing blog post
};

export const deleteBlog = async (blogId: string) => {
  // Logic to delete a blog post by its ID
};