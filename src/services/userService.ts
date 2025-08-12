import User, { IUser } from "../models/User";

export const getAllUsers = async (): Promise<Partial<IUser>[]> => {
  const results = await User.find().select("-password").lean();

  return { results };
};

export const getUserById = async (
  id: string
): Promise<Partial<IUser> | null> => {
  return await User.findById(id).select("-password").lean();
};

export const createUser = async (data: Partial<IUser>): Promise<IUser> => {
  const user = new User(data);
  return await user.save(); // returns Mongoose Document
};

export const updateUser = async (
  id: string,
  data: Partial<IUser>
): Promise<Partial<IUser> | null> => {
  return await User.findByIdAndUpdate(id, data, { new: true })
    .select("-password")
    .lean();
};

export const deleteUser = async (
  id: string
): Promise<Partial<IUser> | null> => {
  return await User.findByIdAndDelete(id).select("-password").lean();
};
