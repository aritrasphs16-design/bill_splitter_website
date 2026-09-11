"use server";

import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";
import { createNotification } from "./notifications";

export async function getGroupDetails(groupId: string) {
  await dbConnect();

  try {
    const group = await Group.findById(groupId)
      .populate('createdBy', 'full_name')
      .populate('members', 'full_name email upi_id supabaseId');

    if (!group) throw new Error("Group not found");

    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'full_name supabaseId')
      .sort({ createdAt: -1 });

    const settlements = await Settlement.find({ groupId })
      .populate('paidBy', 'full_name supabaseId')
      .populate('paidTo', 'full_name supabaseId');

    return {
      success: true,
      data: {
        group: JSON.parse(JSON.stringify(group)),
        expenses: JSON.parse(JSON.stringify(expenses)),
        settlements: JSON.parse(JSON.stringify(settlements))
      }
    };
  } catch (error: any) {
    console.error("Error fetching group details:", error);
    return { success: false, error: error.message };
  }
}

export async function addGroupMember(groupId: string, email: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return { success: false, error: "No user found with this email. They need to sign up first." };

    const group = await Group.findById(groupId);
    if (!group) return { success: false, error: "Group not found." };

    if (group.members.includes(user._id)) {
      return { success: false, error: "This user is already a member of this group." };
    }

    group.members.push(user._id);
    await group.save();

    await createNotification(
      user._id.toString(),
      "group_invite",
      "Added to Group",
      `You were added to the group "${group.name}".`,
      `/dashboard/groups/${groupId}`
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error adding group member:", error);
    return { success: false, error: "Could not add member." };
  }
}

export async function addGroupExpense(groupId: string, supabaseId: string, data: any) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const expense = await Expense.create({
      groupId,
      paidBy: user._id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      splits: data.splits,
      originalAmount: data.original_amount,
      currency: data.currency,
      exchangeRate: data.exchange_rate
    });

    // Notify other members
    const otherMembers = group.members.filter((mId: any) => mId.toString() !== user._id.toString());
    for (const memberId of otherMembers) {
      await createNotification(
        memberId.toString(),
        "expense_added",
        "New Expense",
        `${user.full_name || "Someone"} added a new expense: "${data.description}" in "${group.name}".`,
        `/dashboard/groups/${groupId}`
      );
    }

    return { success: true, data: JSON.parse(JSON.stringify(expense)) };
  } catch (error: any) {
    console.error("Error adding group expense:", error);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}

export async function deleteGroupExpense(expenseId: string) {
  await dbConnect();

  try {
    await Expense.findByIdAndDelete(expenseId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Could not delete expense." };
  }
}

export async function addSettlement(groupId: string, fromSupabaseId: string, toSupabaseId: string, amount: number) {
  await dbConnect();

  try {
    const fromUser = await User.findOne({ supabaseId: fromSupabaseId });
    const toUser = await User.findOne({ supabaseId: toSupabaseId });

    if (!fromUser || !toUser) throw new Error("Users not found");

    const settlement = await Settlement.create({
      groupId,
      paidBy: fromUser._id,
      paidTo: toUser._id,
      amount
    });

    const group = await Group.findById(groupId);

    await createNotification(
      toUser._id.toString(),
      "settlement",
      "Payment Received",
      `${fromUser.full_name || "Someone"} paid you ₹${amount} in "${group?.name || "a group"}".`,
      `/dashboard/groups/${groupId}`
    );

    return { success: true, data: JSON.parse(JSON.stringify(settlement)) };
  } catch (error: any) {
    console.error("Error adding settlement:", error);
    return { success: false, error: "Failed to mark as paid." };
  }
}
