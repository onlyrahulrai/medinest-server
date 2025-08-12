import Role from "../models/Role";

import { IRole } from "../models/Role"; 

export const getAllRoles = async () => {
  return await Role.find().populate("permissions");
};

export const getRoleById = async (id: string) => {
  return await Role.findById(id).populate("permissions");
};

export const createRole = async (data: { name: string; order?: number; permissions?: string[] }) => {
  const role = new Role(data);
  return await role.save();
};

export const updateRole = async (id: string, data: Partial<IRole>) => {
  return await Role.findByIdAndUpdate(id, data, { new: true });
};

export const deleteRole = async (id: string) => {
  return await Role.findByIdAndDelete(id);
};
