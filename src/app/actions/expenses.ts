"use server";

import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Group from "@/models/Group";

export async function getAllExpenses(supabaseId: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    // Fetch groups the user is a part of
    const groups = await Group.find({ members: user._id }).select('name _id members');
    const groupIds = groups.map(g => g._id);

    // Fetch personal expenses (no groupId) AND group expenses for groups the user is in
    const expenses = await Expense.find({
      $or: [
        { paidBy: user._id, groupId: { $exists: false } }, // Personal expenses paid by me
        { groupId: { $in: groupIds } } // Any expense in a group I'm part of
      ]
    })
      .populate('groupId', 'name')
      .populate('paidBy', 'full_name supabaseId')
      .sort({ createdAt: -1 });

    return {
      success: true,
      expenses: JSON.parse(JSON.stringify(expenses)),
      groups: JSON.parse(JSON.stringify(groups))
    };
  } catch (error: any) {
    console.error("Error fetching all expenses:", error);
    return { success: false, error: error.message, expenses: [], groups: [] };
  }
}

export async function addExpense(supabaseId: string, data: any) {
  await dbConnect();

  try {
    const user = await User.findOne({ supabaseId });
    if (!user) throw new Error("User not found");

    const payload: any = {
      paidBy: user._id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      currency: data.currency,
      originalAmount: data.original_amount,
      exchangeRate: data.exchange_rate,
    };

    if (data.groupId && data.groupId !== "personal") {
      payload.groupId = data.groupId;
      
      // Handle split types
      if (data.splitType === "equal") {
        // We do not need to explicitly set `splits` for equal split. The calculation algorithm defaults to equal.
        // Wait, if it's equal, we just omit splits.
        payload.splits = []; 
      } else if (data.splitType === "personal_in_group") {
        // Paid by you, 100% personal but tracked inside the group ledger
        payload.splits = [{
          user_id: supabaseId,
          amount: data.amount
        }];
      }
    }

    const expense = await Expense.create(payload);

    return { success: true, data: JSON.parse(JSON.stringify(expense)) };
  } catch (error: any) {
    console.error("Error adding expense:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(expenseId: string) {
  await dbConnect();

  try {
    await Expense.findByIdAndDelete(expenseId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return { success: false, error: error.message };
  }
}
