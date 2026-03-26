import NotificationModel from "../models/Notification";
import mongoose from "mongoose";

interface SendNotificationOptions {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: "medicine_reminder" | "missed_dose" | "caregiver_alert" | "refill" | "system";
  relatedId?: string | mongoose.Types.ObjectId;
  relatedType?: "medicine" | "log" | "invitation" | "group";
}

export const send = async (options: SendNotificationOptions) => {
  try {
    const notification = await NotificationModel.create({
      recipients: [
        {
          user: options.userId,
          role: "patient",
          read: false,
        },
      ],
      type: options.type || "system",
      title: options.title,
      message: options.message,
      relatedId: options.relatedId || null,
      relatedType: options.relatedType || "invitation",
    });

    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};
