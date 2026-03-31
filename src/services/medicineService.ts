import Medicine, { IMedicine } from "../models/Medicine";
import { UpdateMedicineInput, CreateMedicineScheduleInput } from "../types/schema/Medicine";
import mongoose, { Types } from "mongoose";
import User from "../models/User";
import { generateLogsForMedicine } from "./medicineLogService";
import MedicineSchedule from "../models/MedicineGroup";

const calculateEndDate = (startDate?: Date | unknown, durationLabel?: string) => {
  const date = new Date(startDate);

  switch (durationLabel) {
    case "Once daily":
      date.setDate(date.getDate() + 1);
      break;
    case "Twice daily":
      date.setDate(date.getDate() + 2);
      break;
    case "Three times daily":
      date.setDate(date.getDate() + 3);
      break;
    case "Four times daily":
      date.setDate(date.getDate() + 4);
      break;
    case "As needed":
      date.setDate(date.getDate() + 1);
      break;
    default:
      break;
  }
  return date;
}

export const createMedicineSchedule = async (userId: string, data: CreateMedicineScheduleInput): Promise<IMedicine> => {
  try {
    const { user, name, startDate, prescribedBy, groupForHowLong, reminderEnabled, groupNotes, medicines } = data;

    const medicineSchedule = new MedicineSchedule({
      user,
      createdBy: userId,
      name,
      type: medicines.length > 1 ? "multi" : "single",
      startDate,
      endDate: calculateEndDate(startDate, groupForHowLong),
      forHowLong: groupForHowLong,
      notes: groupNotes,
      status: "active",
      prescribedBy,
      reminderEnabled,
    });

    const savedMedicineSchedule = await medicineSchedule.save();

    for (const medicine of medicines) {
      const medicineInstance = new Medicine({
        user,
        createdBy: userId,
        group: savedMedicineSchedule._id,
        name: medicine.name,
        dosage: medicine.dosage,
        routines: medicine.routineIds,
        customSchedule: medicine.customSchedule,
        mealTiming: medicine.mealTiming,
        duration: medicine.duration,
        isDurationInherited: medicine.isDurationInherited,
        refill: medicine.refill,
        purpose: medicine.purpose,
        notes: medicine.notes,
        status: "active",
        meta: medicine.meta,
        reminderEnabled: medicine.reminderEnabled,
      });

      await medicineInstance.save()
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
