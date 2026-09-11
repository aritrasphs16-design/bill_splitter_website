"use server";

import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import Message from "@/models/Message";

export async function addGroupMessage(groupId: string, supabaseUserId: string, messageContent: string) {
  try {
    await dbConnect();

    const user = await User.findOne({ supabaseId: supabaseUserId });
    if (!user) return { success: false, error: "User not found" };

    const message = await Message.create({
      groupId,
      senderId: user._id,
      message: messageContent
    });

    return { success: true, data: JSON.parse(JSON.stringify(message)) };
  } catch (error: any) {
    console.error("Error adding message:", error);
    return { success: false, error: error.message };
  }
}

export async function getGroupMessages(groupId: string) {
  try {
    await dbConnect();

    const messages = await Message.find({ groupId })
      .populate('senderId', 'full_name supabaseId')
      .sort({ createdAt: 1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(messages)) };
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return { success: false, error: error.message };
  }
}
