import Routine, { IRoutine } from "../models/Routine";
import mongoose from "mongoose";

export const getRoutinesByUserId = async (userId: string): Promise<IRoutine[]> => {
  return await Routine.find({ userId, isActive: true }).sort({ time: 1 });
};

export const createRoutine = async (userId: string, data: Partial<IRoutine>): Promise<IRoutine> => {
  return await Routine.create({ ...data, userId });
};

export const updateRoutine = async (routineId: string, userId: string, data: Partial<IRoutine>): Promise<IRoutine | null> => {
  return await Routine.findOneAndUpdate({ _id: routineId, userId }, data, { new: true });
};

export const deleteRoutine = async (routineId: string, userId: string): Promise<boolean> => {
  const result = await Routine.updateOne({ _id: routineId, userId }, { isActive: false });
  return result.modifiedCount > 0;
};

export const bulkCreateRoutines = async (userId: string, routines: { name: string, time: string }[]): Promise<IRoutine[]> => {
  const routinesWithUserId = routines.map(r => ({ ...r, userId }));
  return await Routine.insertMany(routinesWithUserId);
};
