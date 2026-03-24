import MedicineLog from "../models/MedicineLog";
import moment from "moment";
import { initSocket } from "../helper/utils/socket";

export const processReminders = async () => {
  const now = moment().startOf('minute').toDate();
  const nextMinute = moment(now).add(1, 'minute').toDate();

  console.log(`[ReminderEngine] Checking for pending logs at ${now.toISOString()}`);

  const pendingLogs = await MedicineLog.find({
    scheduledTime: { $gte: now, $lt: nextMinute },
    status: 'pending'
  }).populate("medicineId").populate("routineId");

  if (pendingLogs.length === 0) return;

  // Group by userId
  const userNotifications: { [key: string]: any[] } = {};
  pendingLogs.forEach(log => {
    const userId = log.userId.toString();
    if (!userNotifications[userId]) userNotifications[userId] = [];
    userNotifications[userId].push(log);
  });

  // Send notifications
  for (const userId in userNotifications) {
    const logs = userNotifications[userId];
    const count = logs.length;
    let message = "";
    
    if (count > 1) {
      message = `Time to take your ${count} medications`;
    } else {
      const log = logs[0];
      const medName = (log.medicineId as any).name;
      const routineName = log.routineId?.name;
      message = routineName 
        ? `Time for your ${routineName} dose: ${medName}` 
        : `Time to take your medication: ${medName}`;
    }
    
    console.log(`[ReminderEngine] Sending notification to ${userId}: ${message}`);
    
    // TODO: Send push notification via FCM/Expo
    // For now, we can emit a socket event if the user is online
    // notifyUser(userId, message);
  }
};
