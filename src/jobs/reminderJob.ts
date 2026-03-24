import { Queue } from 'bullmq';
import { commonQueue } from './commonQueue';

export const setupReminderJob = async () => {
  // Add repeatable job every minute
  await commonQueue.add('process-reminders', {}, {
    repeat: {
      pattern: '* * * * *', // Every minute
    },
  });
  console.log('✅ Reminder job scheduled every minute');
};
