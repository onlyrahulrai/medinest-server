import MedicineLog from "../models/MedicineLog";
import Routine from "../models/Routine";
import Medicine, { IMedicine } from "../models/Medicine";
import moment from "moment";

export const generateLogsForMedicine = async (medicineId: string, daysAhead: number = 7) => {
  const medicine = await Medicine.findById(medicineId).populate("routineIds");
  if (!medicine) return;

  const logs: any[] = [];
  const startDay = moment(medicine.duration.startDate).startOf('day');
  const endDate = medicine.duration.endDate ? moment(medicine.duration.endDate).endOf('day') : moment().add(daysAhead, 'days').endOf('day');

  // If start date is in the future, we still start generating from start date.
  // If it is in the past, we start generating from today.
  const genStart = moment().startOf('day').isAfter(startDay) ? moment().startOf('day') : startDay;
  const genEnd = moment().add(daysAhead, 'days').endOf('day').isBefore(endDate) ? moment().add(daysAhead, 'days').endOf('day') : endDate;

  for (let m = moment(genStart); m.isBefore(genEnd); m.add(1, 'days')) {
    if (medicine.customSchedule.enabled) {
      if (medicine.customSchedule.frequency === 'daily') {
        medicine.customSchedule.times.forEach(time => {
          const scheduledTime = moment(m).set({
            hour: parseInt(time.split(':')[0]),
            minute: parseInt(time.split(':')[1]),
            second: 0,
            millisecond: 0
          }).toDate();
          
          logs.push({
            userId: medicine.userId,
            medicineId: medicine._id,
            scheduledTime,
            status: 'pending'
          });
        });
      } else if (medicine.customSchedule.frequency === 'weekly') {
        const currentDay = moment(m).day();
        if (medicine.customSchedule.daysOfWeek?.includes(currentDay)) {
          medicine.customSchedule.times.forEach(time => {
            const scheduledTime = moment(m).set({
              hour: parseInt(time.split(':')[0]),
              minute: parseInt(time.split(':')[1]),
              second: 0,
              millisecond: 0
            }).toDate();
            
            logs.push({
              userId: medicine.userId,
              medicineId: medicine._id,
              scheduledTime,
              status: 'pending'
            });
          });
        }
      }
      // Add other frequencies if needed
    } else if (medicine.routineIds && medicine.routineIds.length > 0) {
      medicine.routineIds.forEach((routine: any) => {
        const scheduledTime = moment(m).set({
          hour: parseInt(routine.time.split(':')[0]),
          minute: parseInt(routine.time.split(':')[1]),
          second: 0,
          millisecond: 0
        }).toDate();
        
        logs.push({
          userId: medicine.userId,
          medicineId: medicine._id,
          routineId: routine._id,
          scheduledTime,
          status: 'pending'
        });
      });
    }
  }

  // To prevent double logs, we can check if logs for this time already exist or just insert missing ones.
  // For simplicity here, we assume this is called on creation or update (after clearing future logs).
  if (logs.length > 0) {
    // Clear future pending logs first to avoid duplicates on update
    await MedicineLog.deleteMany({
      medicineId: medicine._id,
      status: 'pending',
      scheduledTime: { $gte: moment(genStart).toDate() }
    });
    
    await MedicineLog.insertMany(logs);
  }
};

export const updateLogStatus = async (logId: string, userId: string, status: 'taken' | 'skipped' | 'missed', notes?: string) => {
  const updateData: any = { status, notes };
  if (status === 'taken') {
    updateData.takenAt = new Date();
  }
  return await MedicineLog.findOneAndUpdate({ _id: logId, userId }, updateData, { new: true });
};

export const getTodaysLogs = async (userId: string, patientId?: string) => {
  const startOfDay = moment().startOf('day').toDate();
  const endOfDay = moment().endOf('day').toDate();
  
  return await MedicineLog.find({
    userId: patientId || userId,
    scheduledTime: { $gte: startOfDay, $lte: endOfDay }
  }).populate("medicineId").populate("routineId").sort({ scheduledTime: 1 });
};
