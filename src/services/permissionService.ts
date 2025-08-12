import Permission, { IPermission } from "../models/Permission";

export const getAllPermissions = async (): Promise<IPermission[]> => {
  return await Permission.find();
};

export const getPermissionById = async (
  id: string
): Promise<IPermission | null> => {
  return await Permission.findById(id);
};

export const createPermission = async (
  data: Partial<IPermission>
): Promise<IPermission> => {
  if (!data.name) {
    throw new Error("Permission name is required");
  }

  const code = data.name.toLowerCase().split(" ").join("_");

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
