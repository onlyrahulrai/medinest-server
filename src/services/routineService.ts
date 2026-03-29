import Routine, { IRoutine } from "../models/Routine";

export const getRoutinesByUserId = async (user: string): Promise<IRoutine[]> => {
  return await Routine.find({ user, isActive: true }).sort({ time: 1 });
};

export const getRoutineById = async (_id: string, user: string): Promise<IRoutine | null> => {
  return await Routine.findOne({ _id, user });
};

export const createRoutine = async (user: string, data: Partial<IRoutine>): Promise<IRoutine> => {
  return await Routine.create({ ...data, user });
};

export const updateRoutine = async (routineId: string, user: string, data: Partial<IRoutine>): Promise<IRoutine | null> => {
  return await Routine.findOneAndUpdate({ _id: routineId, user }, data, { new: true });
};

export const deleteRoutine = async (routineId: string, user: string): Promise<boolean> => {
  const result = await Routine.updateOne({ _id: routineId, user }, { isActive: false });
  return result.modifiedCount > 0;
};