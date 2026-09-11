"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";

export async function getDashboardData(supabaseId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) return null;

    const upiId = user.upi_id || "";

    // Fetch personal expenses
    const personalExpenses = await Expense.find({ paidBy: user._id, groupId: { $exists: false } })
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Fetch active groups count
    const activeGroupsCount = await Group.countDocuments({ members: user._id });

    // Fetch groups user is part of
    const groups = await Group.find({ members: user._id });
    const groupIds = groups.map(g => g._id);

    // Fetch members, expenses, and settlements for these groups
    // In Mongoose, we need to populate to get user details
    const groupsPopulated = await Group.find({ _id: { $in: groupIds } }).populate('members', 'full_name upi_id supabaseId');
    const groupExpenses = await Expense.find({ groupId: { $in: groupIds } }).populate('paidBy', 'full_name upi_id supabaseId');
    const groupSettlements = await Settlement.find({ groupId: { $in: groupIds } }).populate('paidBy').populate('paidTo');

    // We will return data in a way that the frontend can compute settlements, 
    // or we can compute global debts here. Let's return the raw formatted data.
    
    return {
      upiId,
      personalExpenses: JSON.parse(JSON.stringify(personalExpenses)),
      activeGroupsCount,
      groups: JSON.parse(JSON.stringify(groupsPopulated)),
      groupExpenses: JSON.parse(JSON.stringify(groupExpenses)),
      groupSettlements: JSON.parse(JSON.stringify(groupSettlements)),
      userId: user._id.toString()
    };

  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return null;
  }
}

export async function saveUserUpi(supabaseId: string, upiId: string) {
  await dbConnect();
  await User.findOneAndUpdate({ supabaseId }, { upi_id: upiId });
  return true;
}

export async function checkUserDebt(supabaseId: string) {
  try {
    const data = await getDashboardData(supabaseId);
    if (!data) return false;

    let globalOwe = 0;
    const { calculateSettlements } = await import("@/lib/settlement-algorithm");

    for (const group of data.groups) {
      const gMembers = group.members.map((m: any) => ({
        id: m.supabaseId || m._id,
        name: m.full_name,
        upiId: m.upi_id
      }));

      const gExpenses = data.groupExpenses
        .filter((e: any) => e.groupId === group._id.toString())
        .map((e: any) => ({
          paidBy: e.paidBy.supabaseId || e.paidBy._id || e.paidBy,
          amount: e.amount,
          splits: e.splits
        }));

      const gSettlements = data.groupSettlements
        .filter((s: any) => s.groupId === group._id.toString())
        .map((s: any) => ({
          paidBy: s.paidBy.supabaseId || s.paidBy._id || s.paidBy,
          paidTo: s.paidTo.supabaseId || s.paidTo._id || s.paidTo,
          amount: s.amount
        }));

      const transactions = calculateSettlements(gMembers, gExpenses, gSettlements);
      transactions.forEach(tx => {
        if (tx.from === data.userId) globalOwe += tx.amount;
      });
    }

    return globalOwe > 0;
  } catch (e) {
    console.error("Failed to check debt:", e);
    return false;
  }
}

