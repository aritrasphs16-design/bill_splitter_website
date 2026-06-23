"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Trash2, UserPlus, Receipt, HandCoins, User, Users } from "lucide-react";
import Link from "next/link";
import { calculateSettlements, Member, ExpenseInfo, Transaction } from "@/lib/settlement-algorithm";

type GroupDetails = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  creator: { full_name: string };
};

type GroupMemberRow = {
  id: string;
  user_id: string;
  users: { full_name: string, email: string };
};

type GroupExpenseRow = {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  payer: { full_name: string };
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [expenses, setExpenses] = useState<GroupExpenseRow[]>([]);
  const [settlements, setSettlements] = useState<Transaction[]>([]);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserId(session.user.id);

    // Parallel fetch
    const [groupRes, membersRes, expensesRes] = await Promise.all([
      supabase.from("shared_groups").select("id, name, created_at, created_by, creator:users!shared_groups_created_by_fkey(full_name)").eq("id", groupId).single(),
      supabase.from("group_members").select("id, user_id, users(full_name, email)").eq("group_id", groupId),
      supabase.from("group_expenses").select("id, description, amount, paid_by, created_at, payer:users!group_expenses_paid_by_fkey(full_name)").eq("group_id", groupId).order("created_at", { ascending: false })
    ]);

    if (groupRes.error) {
      router.push("/dashboard/groups");
      return;
    }

    setGroup(groupRes.data as unknown as GroupDetails);
    
    const fetchedMembers = (membersRes.data || []) as unknown as GroupMemberRow[];
    setMembers(fetchedMembers);
    
    const fetchedExpenses = (expensesRes.data || []) as unknown as GroupExpenseRow[];
    setExpenses(fetchedExpenses);

    // Calculate settlements
    updateSettlements(fetchedMembers, fetchedExpenses);

    setLoading(false);
  };

  const updateSettlements = (mems: GroupMemberRow[], exps: GroupExpenseRow[]) => {
    const algMembers: Member[] = mems.map(m => ({ id: m.user_id, name: m.users.full_name }));
    const algExps: ExpenseInfo[] = exps.map(e => ({ paidBy: e.paid_by, amount: e.amount }));
    setSettlements(calculateSettlements(algMembers, algExps));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingMember(true);

    const email = newMemberEmail.trim().toLowerCase();
    if (!email) {
      setError("Please enter an email address.");
      setSubmittingMember(false);
      return;
    }

    // Check if user exists
    const { data: users, error: userError } = await supabase.from("users").select("id, full_name").eq("email", email);

    if (userError || !users || users.length === 0) {
      setError("No user found with this email. They need to sign up first.");
      setSubmittingMember(false);
      return;
    }

    const targetUserId = users[0].id;

    // Check if already in group
    if (members.some(m => m.user_id === targetUserId)) {
      setError("This user is already a member of this group.");
      setSubmittingMember(false);
      return;
    }

    // Add to group
    const { error: addError } = await supabase.from("group_members").insert([{ group_id: groupId, user_id: targetUserId }]);

    if (addError) {
      setError("Could not add member.");
    } else {
      setSuccess("Member added successfully!");
      setNewMemberEmail("");
      fetchGroupData(); // Refresh to get member details safely
      setTimeout(() => setSuccess(""), 5000);
    }
    setSubmittingMember(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingExpense(true);

    if (!expenseDesc.trim()) {
      setError("Please enter a description.");
      setSubmittingExpense(false);
      return;
    }
    const amt = parseFloat(expenseAmt);
    if (isNaN(amt) || amt <= 0) {
      setError("Amount must be greater than zero.");
      setSubmittingExpense(false);
      return;
    }

    const { error: expError } = await supabase.from("group_expenses").insert([{
      group_id: groupId,
      paid_by: userId,
      description: expenseDesc.trim(),
      amount: amt
    }]);

    if (expError) {
      setError("Something went wrong. Please try again later.");
    } else {
      setSuccess("Group expense added successfully!");
      setExpenseDesc("");
      setExpenseAmt("");
      fetchGroupData(); // Refresh
      setTimeout(() => setSuccess(""), 5000);
    }
    setSubmittingExpense(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const { error } = await supabase.from("group_expenses").delete().eq("id", id);
    if (error) {
      setError("Could not delete expense.");
    } else {
      setSuccess("Expense deleted.");
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      updateSettlements(members, updatedExpenses);
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  if (loading) {
    return <div className="text-[var(--color-on-background)] font-medium">Loading group details...</div>;
  }

  if (!group) return null;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link href="/dashboard/groups" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline font-medium mb-4">
          <ArrowLeft size={20} /> Back to Groups
        </Link>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-[var(--color-primary)]">
          {group.name}
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2 font-medium">
          Created by {group.created_by === userId ? "you" : group.creator.full_name} • {new Date(group.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Spent", value: `₹${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "Members", value: members.length },
          { label: "Expenses", value: expenses.length },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
            <h3 className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1">{stat.label}</h3>
            <p className="text-2xl font-heading font-bold text-[var(--color-on-surface)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-[var(--color-error)] text-[var(--color-on-error)] rounded-lg font-medium text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-[#d1e7dd] text-[#0f5132] rounded-lg font-medium text-sm border border-[#badbcc]">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Members & Add Member */}
        <div className="space-y-8">
          <div className="bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <Users size={24} /> Members
            </h2>
            <ul className="space-y-4 mb-6">
              {members.map(m => (
                <li key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-variant)] flex items-center justify-center text-[var(--color-on-surface)]">
                    <User size={16} />
                  </div>
                  <span className="font-medium text-[var(--color-on-surface)]">
                    {m.users.full_name} {m.user_id === userId && <span className="text-[var(--color-on-surface-variant)] font-normal text-sm">(you)</span>}
                  </span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddMember} className="mt-6 pt-6 border-t border-[var(--color-outline-variant)]">
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">Add Member</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="py-2 px-4 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] font-heading font-medium rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} /> {submittingMember ? "..." : "Add"}
                </button>
              </div>
            </form>
          </div>

          {/* Settlement Summary */}
          <div className="bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-2 flex items-center gap-2">
              <HandCoins size={24} /> Settlement Summary
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">(Minimum transactions to settle all debts)</p>
            
            {settlements.length === 0 ? (
              <p className="text-[var(--color-on-surface)] font-medium text-center py-4">All settled up!</p>
            ) : (
              <ul className="space-y-3">
                {settlements.map((tx, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-[var(--color-surface-container-low)] rounded-lg">
                    <span className="font-medium text-[var(--color-on-surface)]">
                      {tx.fromName} pays {tx.toName}
                    </span>
                    <span className="font-mono font-bold text-[var(--color-tertiary)]">
                      ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Add Expense & Expense List */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-6">Add Group Expense</h2>
            <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g., Hotel booking"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmt}
                  onChange={(e) => setExpenseAmt(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors font-mono"
                />
              </div>
              <div className="w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="w-full sm:w-auto py-2 px-6 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-heading font-medium rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {submittingExpense ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center gap-2">
              <Receipt size={24} className="text-[var(--color-primary)]" />
              <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)]">Group Expenses</h2>
            </div>
            
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
                No group expenses yet.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-outline-variant)]">
                {expenses.map((expense) => {
                  const isPayer = expense.paid_by === userId;
                  return (
                    <li key={expense.id} className="p-4 hover:bg-[var(--color-surface-container-low)] transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-[var(--color-on-surface)]">{expense.description}</p>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] mt-1">
                          <span className="font-medium text-[var(--color-on-surface)]">{isPayer ? "you" : expense.payer.full_name}</span>
                          <span>•</span>
                          <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-mono font-bold text-lg text-[var(--color-primary)]">
                          ₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {isPayer ? (
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)] rounded-full transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 size={20} />
                          </button>
                        ) : (
                          <div className="w-9" /> /* Spacer to match button width */
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
