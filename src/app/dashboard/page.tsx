"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { calculateSettlements, Member, ExpenseInfo } from "@/lib/settlement-algorithm";
import { getDashboardData, saveUserUpi } from "@/app/actions/dashboard";

export default function Dashboard() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [youOwe, setYouOwe] = useState(0);
  const [owedToYou, setOwedToYou] = useState(0);
  
  const [upiId, setUpiId] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const data = await getDashboardData(session.user.id);
      if (!data) return;

      setUpiId(data.upiId || "");

      const expenses = data.personalExpenses || [];
      setRecentExpenses(expenses);
      const total = expenses.reduce((sum: any, exp: any) => sum + Number(exp.amount), 0);
      setTotalSpent(total);

      setActiveGroups(data.activeGroupsCount);

      if (data.groups && data.groups.length > 0) {
        let globalOwe = 0;
        let globalOwedToYou = 0;

        const currentUserId = session.user.id;

        for (const group of data.groups) {
          const groupId = group._id;
          
          const gMembers: Member[] = group.members.map((m: any) => ({ 
            id: m.supabaseId || m._id, 
            name: m.full_name, 
            upiId: m.upi_id 
          }));
            
          const gExpenses: ExpenseInfo[] = data.groupExpenses
            .filter((e: any) => e.groupId === groupId)
            .map((e: any) => ({ 
              paidBy: e.paidBy.supabaseId || e.paidBy._id || e.paidBy, 
              amount: e.amount,
              splits: e.splits 
            }));

          const gSettlements = data.groupSettlements
            .filter((s: any) => s.groupId === groupId)
            .map((s: any) => ({ 
              paidBy: s.paidBy.supabaseId || s.paidBy._id || s.paidBy, 
              paidTo: s.paidTo.supabaseId || s.paidTo._id || s.paidTo, 
              amount: s.amount 
            }));

          const transactions = calculateSettlements(gMembers, gExpenses, gSettlements);
          
          transactions.forEach(tx => {
            if (tx.from === currentUserId) globalOwe += tx.amount;
            if (tx.to === currentUserId) globalOwedToYou += tx.amount;
          });
        }

        setYouOwe(globalOwe);
        setOwedToYou(globalOwedToYou);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveUpiId = async () => {
    setSavingUpi(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await saveUserUpi(session.user.id, upiId);
    }
    setSavingUpi(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "food": return "restaurant";
      case "groceries": return "shopping_basket";
      case "transport": return "local_taxi";
      case "stay": return "business";
      case "activities": return "sailing";
      case "drinks": return "local_bar";
      default: return "receipt_long";
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header Anchor */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Dashboard</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Here's a summary of your expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-outline flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            Fiscal Cycle: {new Date().toLocaleString('default', { month: 'short' })} {new Date().getFullYear()}
          </span>
          <button className="px-3 py-1.5 text-label-md font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:bg-surface-container-low transition-colors duration-150 flex items-center gap-1" type="button">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Row: 4 Prominent Metric Summary Cards */}
      <section aria-label="Financial Summary Cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Spent */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Total Spent</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-numeric-metric text-on-surface tabular-nums">
                ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-body-sm text-outline">
            <span>Across all groups</span>
            <span className="inline-flex items-center text-label-sm text-primary font-medium">{recentExpenses.length} txns</span>
          </div>
        </div>

        {/* Card 2: Active Groups */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Active Groups</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-numeric-metric text-on-surface tabular-nums">{activeGroups} Groups</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20">
            <Link href="/dashboard/groups" className="text-body-sm text-outline hover:text-primary transition-colors">
              View ledgers →
            </Link>
          </div>
        </div>

        {/* Card 3: You Owe */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-tertiary-container uppercase tracking-wider font-semibold">You Owe</span>
              {youOwe > 0 && (
                <span className="px-2 py-0.5 rounded-full text-label-sm bg-error-container/40 text-error border border-error/20">
                  Unsettled
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-numeric-metric text-tertiary-container tabular-nums font-bold">
                ₹{youOwe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-body-sm text-outline">{youOwe > 0 ? "Outstanding debts" : "All clear"}</span>
            {youOwe > 0 && (
              <Link href="/dashboard/groups" className="px-3 py-1 bg-tertiary-container hover:bg-tertiary text-on-tertiary rounded-lg text-label-sm font-semibold transition-colors duration-150">
                Settle Up
              </Link>
            )}
          </div>
        </div>

        {/* Card 4: Owed to You */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-primary uppercase tracking-wider font-semibold">Owed to You</span>
              {owedToYou > 0 && (
                <span className="px-2 py-0.5 rounded-full text-label-sm bg-secondary-container/30 text-primary border border-primary/20">
                  Incoming
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-numeric-metric text-primary tabular-nums font-bold">
                ₹{owedToYou.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-body-sm text-outline">
              {owedToYou > 0 ? "Pending collection" : "No pending incoming"}
            </span>
            {owedToYou === 0 && (
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            )}
          </div>
        </div>
      </section>

      {/* Mid-Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Recent Expenses Table */}
        <section className="lg:col-span-8 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">Recent Expenses</h2>
                <p className="text-body-sm text-on-surface-variant mt-0.5">Recorded splits and team ledger outlays</p>
              </div>
              <Link href="/dashboard/expenses" className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/40 border-b border-outline-variant/30 text-label-md text-on-surface-variant">
                    <th className="py-3 px-6 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-6 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-body-md">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-outline">Loading...</td>
                    </tr>
                  ) : recentExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-outline">No recent expenses. Time to add one!</td>
                    </tr>
                  ) : (
                    recentExpenses.map((exp) => {
                      const date = new Date(exp.createdAt || exp.created_at);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <tr key={exp._id || exp.id} className="hover:bg-surface/60 transition-colors duration-150">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0 border border-outline-variant/20">
                                <span className="material-symbols-outlined text-[18px]">{getCategoryIcon(exp.category)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-on-surface">{exp.description}</p>
                                <p className="text-body-sm text-outline capitalize">{exp.category || "General"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm bg-surface-container-low text-on-surface-variant border border-outline-variant/30 capitalize">
                              {exp.category || "General"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-body-sm text-outline tabular-nums">
                            {formattedDate}
                          </td>
                          <td className="py-4 px-6 text-right tabular-nums font-semibold text-on-surface">
                            ₹{Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3.5 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-body-sm text-outline">Showing {Math.min(recentExpenses.length, 5)} transactions</span>
              <Link href="/dashboard/expenses" className="text-label-md font-semibold text-primary hover:text-primary-container inline-flex items-center gap-1.5 transition-colors">
                View All Expenses
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Right Column - Fintech Utilities */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Payment Settings Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                <h3 className="text-headline-sm font-bold text-on-surface">Payment Settings</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-label-sm text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                Verified
              </span>
            </div>
            <div className="p-3.5 bg-surface rounded-lg border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-2">
                  <span className="text-body-sm text-outline block mb-1">Primary UPI VPA</span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okbank"
                    className="w-full bg-transparent border-b border-outline-variant/40 text-label-lg font-semibold text-on-surface font-mono focus:outline-none focus:border-primary px-1 py-0.5 transition-colors"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-body-sm">
                <button
                  onClick={saveUpiId}
                  disabled={savingUpi}
                  className="w-full px-3 py-1.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg text-label-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {savingUpi ? "Saving..." : "Save UPI"}
                </button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">qr_code_2</span>
                  <span className="text-label-md text-on-surface">Accept Payments via QR</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <p className="text-body-sm text-outline mt-1.5">Generates instant dynamic QR code during group settlements.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
