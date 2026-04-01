import Medicine, { IMedicine } from "../models/Medicine";
import { UpdateMedicineInput, CreateMedicineScheduleInput } from "../types/schema/Medicine";
import mongoose, { Types } from "mongoose";
import User from "../models/User";
import { generateLogsForMedicine } from "./medicineLogService";
import MedicineSchedule from "../models/MedicineGroup";
import { calculateEndDate, getDurationInDays } from "../helper/utils/common";


export const createMedicineSchedule = async (userId: string, data: CreateMedicineScheduleInput): Promise<IMedicine> => {
  try {
    const { user, name, duration, prescribedBy, reminderEnabled, groupNotes, medicines } = data;

    const medicineSchedule = new MedicineSchedule({
      user,
      createdBy: userId,
      name,
      type: medicines.length > 1 ? "multi" : "single",
      duration: {
        startDate: duration.startDate,
        endDate: calculateEndDate(duration.startDate, duration.forHowLong),
        forHowLong: duration.forHowLong,
        isOngoing: duration.isOngoing,
      },
      notes: groupNotes,
      status: "active",
      prescribedBy,
      reminderEnabled,
    });

    const savedMedicineSchedule = await medicineSchedule.save();

    for (const medicine of medicines) {
      console.log("Medicine Meta: ", medicine.meta);

      const medicineInstance = new Medicine({
        user,
        createdBy: userId,
        group: savedMedicineSchedule._id,
        name: medicine.name,
        dosage: medicine.dosage,
        routines: medicine.routines,
        customSchedule: medicine.customSchedule,
        mealTiming: medicine.mealTiming,
        duration: {
          startDate: medicine.duration.startDate,
          endDate: calculateEndDate(medicine.duration.startDate, medicine.duration.forHowLong),
          forHowLong: medicine.duration.forHowLong,
          isOngoing: medicine.duration.isOngoing,
        },
        isDurationInherited: medicine.isDurationInherited,
        refill: medicine.refill,
        purpose: medicine.purpose,
        notes: medicine.notes,
        status: "active",
        meta: {
          color: medicine.meta?.color,
          // photo: medicine.meta?.photo,
          type: medicine.meta?.type,
        },
        reminderEnabled: medicine.reminderEnabled,
      });

      await medicineInstance.save();

      await generateLogsForMedicine(String(medicineInstance._id), getDurationInDays(medicineInstance.duration.startDate, medicineInstance.duration.endDate));
    }

    return savedMedicineSchedule;
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
