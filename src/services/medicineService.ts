import Medicine, { IMedicine } from "../models/Medicine";
import { CreateMedicineInput, UpdateMedicineInput, MedicineLogInput } from "../types/schema/Medicine";
import mongoose from "mongoose";
import User from "../models/User";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createMedicine = async (userId: string, data: CreateMedicineInput): Promise<IMedicine> => {
  try {
    // Basic validation
    if (!data.name || !data.type || !data.dosage) {
      throw new Error("Medicine name, type, and dosage are required");
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

    // Handle Global Schedule validation/extraction
    let finalTimes = data.schedule.times;
    if (data.useGlobal) {
      const user = await User.findById(userId).select("globalSchedule");
      if (!user?.globalSchedule?.times || user.globalSchedule.times.length === 0) {
        throw new Error("You haven't set up a global schedule yet");
      }
      finalTimes = user.globalSchedule.times;
    } else {
      if (!finalTimes || finalTimes.length === 0) {
        throw new Error("At least one dosage time per day is required for custom schedules");
      }
      for (const time of finalTimes) {
        if (!TIME_REGEX.test(time)) {
          throw new Error(`Invalid time format: ${time}. Expected HH:mm (24h)`);
        }
      }
    }

    const startDate = new Date(data.duration.startDate);
    const endDate = data.duration.endDate ? new Date(data.duration.endDate) : undefined;

    if (endDate && startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }

    const medicine = new Medicine({
      userId: targetUserId,
      ...data,
      schedule: {
        ...data.schedule,
        times: finalTimes
      },
      duration: {
        startDate,
        endDate
      }
    });

    return await medicine.save();
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

    if (date) {
      const filterDate = new Date(date);
      query["duration.startDate"] = { $lte: filterDate };
      query.$or = [
        { "duration.endDate": { $exists: false } },
        { "duration.endDate": null },
        { "duration.endDate": { $gte: filterDate } }
      ];
    }

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });

    // Handle global schedule resolution
    const user = await User.findById(userId).select("globalSchedule");
    const globalTimes = user?.globalSchedule?.times || ["09:00", "21:00"];

    return medicines.map(m => {
      const med = m.toObject();
      if (med.useGlobal) {
        med.schedule.times = globalTimes;
      }
      return med as any;
    });
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch medicines");
  }
};

export const getMedicineById = async (userId: string, medicineId: string): Promise<IMedicine> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    const medicine = await Medicine.findOne({ _id: medicineId, userId });
    if (!medicine) {
      throw new Error("Medicine not found");
    }

    const med = medicine.toObject();
    if (med.useGlobal) {
      const user = await User.findById(userId).select("globalSchedule");
      med.schedule.times = user?.globalSchedule?.times || ["09:00", "21:00"];
    }

    return med as any;
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

    // Handle Global Schedule resolution during update
    if (data.useGlobal === true) {
        const user = await User.findById(userId).select("globalSchedule");
        if (user?.globalSchedule?.times) {
            data.schedule = {
                ...data.schedule,
                times: user.globalSchedule.times,
                frequency: data.schedule?.frequency || 'daily'
            } as any;
        }
    } else if (data.useGlobal === false && data.schedule?.times) {
        // Validate updated times if custom
        for (const time of data.schedule.times) {
            if (!TIME_REGEX.test(time)) {
                throw new Error(`Invalid time format: ${time}. Expected HH:mm (24h)`);
            }
        }
        if (data.schedule.times.length === 0) {
            throw new Error("At least one dosage time per day is required for custom schedules");
        }
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, userId },
      { $set: data },
      { new: true }
    );

    if (!medicine) {
      throw new Error("Medicine not found or access denied");
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

    // Prefer soft delete by setting isActive to false
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

export const logMedicineIntake = async (
  userId: string, 
  medicineId: string, 
  log: MedicineLogInput
): Promise<IMedicine> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, userId },
      { $push: { logs: { ...log, takenAt: new Date(log.takenAt) } } },
      { new: true }
    );

    if (!medicine) {
      throw new Error("Medicine not found or access denied");
    }

    return medicine;
  } catch (error: any) {
    throw new Error(error.message || "Failed to log medicine intake");
  }
};
