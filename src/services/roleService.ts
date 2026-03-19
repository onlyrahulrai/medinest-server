import Role, { IRole } from "../models/Role";
import { RoleDetailsResponse, RoleListResponse, UpdateRoleRequest } from "../types/schema/Role";

export const getAllRoles = async (query: Record<string, any>): Promise<RoleListResponse> => {
  const { page, limit, search } = query;

  const effectivePage = Math.max(1, page);
  const effectiveLimit = Math.max(1, Math.min(limit, 100));
  const skip = (effectivePage - 1) * effectiveLimit;

  const filter: any = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Role.countDocuments(filter);

  const results = await Role.find(filter)
    .skip(skip)
    .limit(effectiveLimit)
    .populate("permissions")
    .select("-__v")
    .lean();

  return {
    page: effectivePage,
    limit: effectiveLimit,
    total,
    has_next: skip + results.length < total,
    has_prev: effectivePage > 1,
    results: results as unknown as RoleDetailsResponse[],
  };
};

export const getRoleById = async (
  id: string
): Promise<IRole | null> => {
  const role = await Role.findById(id).populate("permissions");

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
};

export const createRole = async (
  data: { name: string; order?: number; permissions?: string[] }
): Promise<IRole> => {
  const role = new Role(data);

  return await role.save();
};

export const updateRole = async (
  id: string,
  data: UpdateRoleRequest
): Promise<IRole | null> => {
  return await Role.findByIdAndUpdate(id, data, { new: true }).populate("permissions");
};

export const deleteRole = async (
  id: string
): Promise<IRole | null> => {
  return await Role.findByIdAndDelete(id);
};
