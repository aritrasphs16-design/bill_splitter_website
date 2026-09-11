"use server";

import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";

export async function getUserGroups(supabaseId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const groups = await Group.find({ members: user._id })
      .populate('createdBy', 'full_name')
      .populate('members', 'full_name')
      .sort({ createdAt: -1 });

    const groupIds = groups.map(g => g._id);

    const groupExpenses = await Expense.find({ groupId: { $in: groupIds } });
    const groupSettlements = await Settlement.find({ groupId: { $in: groupIds } });

    // Format the data to match the expected structure in the frontend
    const formattedGroups = groups.map((g: any) => {
      const gExpenses = groupExpenses.filter((e: any) => e.groupId.toString() === g._id.toString());
      const gSettlements = groupSettlements.filter((s: any) => s.groupId.toString() === g._id.toString());

      return {
        id: g._id.toString(),
        name: g.name,
        created_at: g.createdAt,
        created_by: g.createdBy._id.toString(),
        group_members: g.members.map((m: any) => ({ user_id: m._id.toString() })),
        group_expenses: gExpenses.map((e: any) => ({
          amount: e.amount,
          paid_by: e.paidBy.toString(),
          splits: e.splits
        })),
        group_settlements: gSettlements.map((s: any) => ({
          amount: s.amount,
          paid_by: s.paidBy.toString(),
          paid_to: s.paidTo.toString()
        }))
      };
    });

    return { success: true, data: formattedGroups, userId: user._id.toString() };
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    return { success: false, error: error.message };
  }
}

export async function createGroup(supabaseId: string, name: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const newGroup = await Group.create({
      name,
      createdBy: user._id,
      members: [user._id]
    });

    return { success: true, data: JSON.parse(JSON.stringify(newGroup)) };
  } catch (error: any) {
    console.error("Error creating group:", error);
    return { success: false, error: error.message };
  }
}

export async function joinGroup(supabaseId: string, groupId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found or invalid code");

    // Check if already a member
    if (group.members.includes(user._id)) {
      return { success: false, error: "You are already a member of this group" };
    }

    group.members.push(user._id);
    await group.save();

    return { success: true };
  } catch (error: any) {
    console.error("Error joining group:", error);
    return { success: false, error: error.name === 'CastError' ? "Invalid group code" : error.message };
  }
}
