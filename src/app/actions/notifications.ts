"use server";

import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function getNotifications(supabaseId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(notifications)),
      unreadCount
    };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: error.message };
  }
}

export async function markAsRead(notificationId: string) {
  await dbConnect();

  try {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

export async function markAllAsRead(supabaseId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    await Notification.updateMany(
      { userId: user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error.message };
  }
}

// Internal server-side helper function to create a notification
export async function createNotification(
  userId: string, // MongoDB ObjectId
  type: string,
  title: string,
  message: string,
  link?: string
) {
  await dbConnect();
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      link
    });
  } catch (error: any) {
    console.error("Failed to create notification internally:", error);
  }
}
