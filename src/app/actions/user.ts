"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Expense from "@/models/Expense";
import Group from "@/models/Group";

export async function syncUserToMongo(supabaseUser: any) {
  if (!supabaseUser) return null;
  
  await dbConnect();
  
  let user = await User.findOne({ supabaseId: supabaseUser.id });
  
  if (!user) {
    const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0];
    
    user = await User.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      full_name: fullName,
    });
  }
  
  return JSON.parse(JSON.stringify(user));
}

export async function getUserProfile(supabaseId: string) {
  await dbConnect();
  
  const user = await User.findOne({ supabaseId });
  
  if (!user) return null;

  // For the rank, we need to calculate total spent. 
  // In Supabase they used personal_expenses, but in Mongoose we have Expenses
  // Let's assume we sum up all expenses paid by this user
  const expenses = await Expense.find({ paidBy: user._id }).select('amount');
  
  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  return {
    user: JSON.parse(JSON.stringify(user)),
    totalSpent
  };
}

export async function getProfileData(supabaseId: string) {
  await dbConnect();
  
  const user = await User.findOne({ supabaseId });
  if (!user) throw new Error("User not found");

  const totalGroups = await Group.countDocuments({ members: user._id });
  const expenses = await Expense.find({ paidBy: user._id, groupId: { $exists: false } }).select('amount');
  const totalPersonalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return {
    user: JSON.parse(JSON.stringify(user)),
    stats: { totalGroups, totalPersonalSpent }
  };
}

export async function updateProfileData(supabaseId: string, data: any) {
  await dbConnect();
  
  const user = await User.findOneAndUpdate(
    { supabaseId }, 
    { 
      full_name: data.full_name,
      upi_id: data.upi_id,
      phone_number: data.phone_number,
      default_currency: data.default_currency 
    },
    { new: true }
  );
  
  return JSON.parse(JSON.stringify(user));
}
