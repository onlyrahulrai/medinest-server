import Medicine, { IMedicine } from "../models/Medicine";
import { CreateMedicineInput, UpdateMedicineInput } from "../types/schema/Medicine";
import mongoose from "mongoose";
import User from "../models/User";
import { generateLogsForMedicine } from "./medicineLogService";

export const createMedicine = async (userId: string, data: CreateMedicineInput): Promise<IMedicine> => {
  try {
    // Basic validation
    if (!data.name || !data.type || !data.dosage) {
      throw new Error("Medicine name, type, and dosage are required");
    }

    if (data.routineIds && data.routineIds.length > 0 && data.customSchedule?.enabled) {
      throw new Error("Cannot use both routine and custom schedule");
    }

    if ((!data.routineIds || data.routineIds.length === 0) && !data.customSchedule?.enabled) {
      throw new Error("Schedule is required (select routines or define custom schedule)");
    }

    // Determine target user (self or patient)
    let targetUserId = userId;
    if (data.patientId && data.patientId !== userId) {
      const user = await User.findById(userId);
      if (!user?.managedPatients?.some(id => id.toString() === data.patientId)) {
        throw new Error("You do not have permission to manage this patient");
      }
      targetUserId = data.patientId;
    }

    const startDate = new Date(data.duration.startDate);
    const endDate = data.duration.endDate ? new Date(data.duration.endDate) : undefined;

    if (endDate && startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }

    const medicine = new Medicine({
      userId: targetUserId,
      ...data,
      duration: {
        startDate,
        endDate
      }
    });

    const savedMed = await medicine.save();
    
    // Generate initial logs for 1 month
    await generateLogsForMedicine(String(savedMed._id), 30);

    return savedMed;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create medicine");
  }
};

export const getAllMedicines = async (
  userId: string, 
  status?: string, 
  date?: string,
  patientId?: string
): Promise<IMedicine[]> => {
  try {
    const query: any = {};

    let targetUserId = userId;
    if (patientId && patientId !== userId) {
      const user = await User.findById(userId);
      if (!user?.managedPatients?.some(id => id.toString() === patientId)) {
        throw new Error("You do not have permission to view this patient's medications");
      }
      targetUserId = patientId;
    }

    query.userId = targetUserId;

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const medicines = await Medicine.find(query).populate("routineIds").sort({ createdAt: -1 });
    return medicines;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch medicines");
  }
};

export const getMedicineById = async (userId: string, medicineId: string): Promise<IMedicine> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    const medicine = await Medicine.findOne({ _id: medicineId, userId }).populate("routineIds");
    if (!medicine) {
      throw new Error("Medicine not found");
    }

    return medicine;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch medicine details");
  }
};

export const updateMedicine = async (
  userId: string, 
  medicineId: string, 
  data: UpdateMedicineInput
): Promise<IMedicine> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    if (data.routineIds && data.routineIds.length > 0 && data.customSchedule?.enabled) {
      throw new Error("Cannot use both routine and custom schedule");
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, userId },
      { $set: data },
      { new: true }
    );

    if (!medicine) {
      throw new Error("Medicine not found or access denied");
    }

    // Re-generate logs if schedule changed
    if (data.routineIds || data.customSchedule || data.duration) {
      await generateLogsForMedicine(String(medicine._id), 30);
    }

    return medicine;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update medicine");
  }
};

export const deleteMedicine = async (userId: string, medicineId: string): Promise<boolean> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!medicine) {
      throw new Error("Medicine not found or access denied");
    }

    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete medicine");
  }
};
