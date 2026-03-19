import Permission, { IPermission } from "../models/Permission";
import { PermissionDetailsResponse, PermissionListResponse } from "../types/schema/Permission";

export const getAllPermissions = async (query: Record<string, any>): Promise<PermissionListResponse> => {
  const { page, limit, search } = query;

  const effectivePage = Math.max(1, page);
  const effectiveLimit = Math.max(1, Math.min(limit, 100));
  const skip = (effectivePage - 1) * effectiveLimit;

  const filter: any = {
    // isDeleted: false,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Permission.countDocuments(filter);

  const results = await Permission.find(filter).skip(skip).limit(effectiveLimit).select("-__v").lean();

  return {
    page: effectivePage,
    limit: effectiveLimit,
    total,
    has_next: skip + results.length < total,
    has_prev: effectivePage > 1,
    results: results as unknown as PermissionDetailsResponse[],
  };
};

export const getPermissionById = async (
  id: string
): Promise<IPermission | null> => {
  const permission = await Permission.findById(id);

  if (!permission) {
    throw new Error("Permission not found");
  }

  return permission;
};

export const createPermission = async (
  data: Partial<IPermission>
): Promise<IPermission> => {
  const code = data.name?.toLowerCase().split(" ").join(":");

  const permission = new Permission({
    ...data,
    code,
  });

  return await permission.save();
};

export const updatePermission = async (
  id: string,
  data: Partial<IPermission>
): Promise<IPermission | null> => {
  if (data.name) {
    data.code = data.name.toLowerCase().split(" ").join("_");
  }

  return await Permission.findByIdAndUpdate(id, data, { new: true });
};

export const deletePermission = async (
  id: string
): Promise<IPermission | null> => {
  return await Permission.findByIdAndDelete(id);
};
