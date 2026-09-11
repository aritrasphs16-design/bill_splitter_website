"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { getUserGroups, createGroup, joinGroup } from "@/app/actions/groups";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Group = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  group_members: { user_id: string }[];
  group_expenses: { amount: number; paid_by: string; splits?: { user_id: string, amount: number }[] | null }[];
  group_settlements: { amount: number; paid_by: string; paid_to: string }[];
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Join Group State
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<"all" | "active" | "settled">("all");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const result = await getUserGroups(session.user.id);
      
      if (!result.success) throw new Error(result.error);
      
      setGroups(result.data as Group[]);
      setUserId(result.userId || session.user.id);
      setSupabaseUserId(session.user.id);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSubmitting(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    if (!userId) {
      setError("Not authenticated");
      setSubmitting(false);
      return;
    }

    const result = await createGroup(session.user.id, groupName.trim());

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setGroupName("");
    fetchGroups();
    setSubmitting(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError(null);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    if (!userId) {
      setJoinError("Not authenticated");
      setJoining(false);
      return;
    }

    const result = await joinGroup(session.user.id, joinCode.trim());

    if (!result.success) {
      setJoinError(result.error || "Invalid group code.");
      setJoining(false);
      return;
    }

    setJoinCode("");
    fetchGroups();
    setJoining(false);
  };

  const getGroupBalance = (group: Group) => {
    let balance = 0;
    const memberCount = group.group_members?.length || 1;
    if (memberCount > 0 && group.group_expenses) {
      let userShare = 0;
      group.group_expenses.forEach(exp => {
        if (exp.splits && exp.splits.length > 0) {
          const split = exp.splits.find((s: any) => s.user_id === supabaseUserId);
          if (split) {
            userShare += Number(split.amount);
          }
        } else {
          userShare += Number(exp.amount) / memberCount;
        }
      });
      
      const userPaid = group.group_expenses
        .filter(exp => exp.paid_by === userId)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
        
      const settlementsPaid = group.group_settlements?.filter(s => s.paid_by === userId).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      const settlementsReceived = group.group_settlements?.filter(s => s.paid_to === userId).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      
      balance = (userPaid + settlementsPaid) - (userShare + settlementsReceived);
    }
    return balance;
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const balance = getGroupBalance(group);
      const isSettled = Math.abs(balance) < 0.01;
      
      if (filterType === "active") return !isSettled;
      if (filterType === "settled") return isSettled;
      return true;
    });
  }, [groups, filterType, userId, supabaseUserId]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 93, 66);
    doc.text("Groups & Ledgers Summary", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(110, 122, 115);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Group Name", "Members", "Status", "Your Balance (Rs.)"];
    const tableRows = filteredGroups.map(group => {
      const balance = getGroupBalance(group);
      const isSettled = Math.abs(balance) < 0.01;
      let statusStr = "Settled";
      if (!isSettled) {
        statusStr = balance > 0 ? "You are owed" : "You owe";
      }
      return [
        group.name,
        (group.group_members?.length || 1).toString(),
        statusStr,
        balance === 0 ? "0.00" : (balance > 0 ? `+${Math.abs(balance).toFixed(2)}` : `-${Math.abs(balance).toFixed(2)}`)
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [0, 93, 66] },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save("spliteasy-groups-summary.pdf");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Net Position
  let netOwe = 0;
  let netOwedToYou = 0;
  
  groups.forEach(group => {
    let userShare = 0;
    const memberCount = group.group_members?.length || 1;
    if (memberCount > 0 && group.group_expenses) {
      group.group_expenses.forEach(exp => {
        if (exp.splits && exp.splits.length > 0) {
          const split = exp.splits.find((s: any) => s.user_id === supabaseUserId);
          if (split) {
            userShare += Number(split.amount);
          }
        } else {
          userShare += Number(exp.amount) / memberCount;
        }
      });
      
      const userPaid = group.group_expenses
        .filter(exp => exp.paid_by === userId)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
        
      const settlementsPaid = group.group_settlements?.filter(s => s.paid_by === userId).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      const settlementsReceived = group.group_settlements?.filter(s => s.paid_to === userId).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      
      const balance = (userPaid + settlementsPaid) - (userShare + settlementsReceived);
      
      if (balance < -0.01) netOwe += Math.abs(balance);
      if (balance > 0.01) netOwedToYou += balance;
    }
  });

  const netBalance = netOwedToYou - netOwe;

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Groups</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Create and manage shared expenses with friends and roommates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilterType(prev => prev === "all" ? "active" : prev === "active" ? "settled" : "all")}
            className="px-4 py-2 text-label-md font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:bg-surface-container-low transition-colors duration-150 flex items-center gap-1.5" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            {filterType === "all" ? "Filter: All" : filterType === "active" ? "Filter: Active" : "Filter: Settled"}
          </button>
          <button 
            onClick={generatePDF}
            className="px-4 py-2 text-label-md font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:bg-surface-container-low transition-colors duration-150 flex items-center gap-1.5" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Ledgers
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          
          {/* Create a Group Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                </div>
                <div>
                  <h2 className="text-label-lg font-bold text-on-surface">Create a Group</h2>
                  <p className="text-body-sm text-on-surface-variant">Set up a shared pool for trips, rents, or projects</p>
                </div>
              </div>
              <span className="text-label-sm text-outline">Step 1 of 1</span>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreateGroup} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/2">
                  <label htmlFor="groupName" className="block text-label-md font-semibold text-on-surface-variant mb-1.5">Group Name</label>
                  <input
                    type="text"
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Goa Trip, Flatmates"
                    className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div className="w-full md:w-1/2 opacity-50 cursor-not-allowed">
                  <label className="block text-label-md font-semibold text-on-surface-variant mb-1.5">Add Members</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Enter emails or usernames"
                    className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !groupName.trim()}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary-container hover:bg-primary text-on-primary rounded-lg text-label-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  {submitting ? "Creating..." : "Create Group"}
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">Your Groups</h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">Review balances and settle counterparty transactions</p>
            </div>
            <div className="hidden sm:flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setFilterType("all")}
                className={`px-4 py-1 text-label-sm font-semibold rounded-md transition-colors ${filterType === "all" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low"}`} 
                type="button"
              >
                All ({groups.length})
              </button>
              <button 
                onClick={() => setFilterType("active")}
                className={`px-4 py-1 text-label-sm font-semibold rounded-md transition-colors ${filterType === "active" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low"}`} 
                type="button"
              >
                Active
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-outline bg-surface-container-lowest rounded-xl border border-outline-variant/40">
                {groups.length === 0 ? "You haven't joined any groups yet." : `No ${filterType} groups found.`}
              </div>
            ) : (
              filteredGroups.map((group) => {
                const balance = getGroupBalance(group);
                const memberCount = group.group_members?.length || 1;

                const isSettled = Math.abs(balance) < 0.01;
                const isOwedToYou = balance >= 0.01;
                const balanceFormatted = `₹${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                return (
                  <div key={group.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 border border-outline-variant/20">
                          <span className="material-symbols-outlined text-[24px]">home</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-headline-sm font-bold text-on-surface">{group.name}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#ECFDF5] text-[#065F46] border border-emerald-200">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1 group/code relative cursor-pointer" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(group.id); alert('Code copied!') }}>
                            <span className="text-[12px] font-mono font-semibold text-on-surface bg-surface-container-high px-2 py-1 rounded border border-outline-variant/50 shadow-sm">Code: {group.id.slice(0, 8)}...</span>
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant opacity-0 group-hover/code:opacity-100 transition-opacity">content_copy</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {memberCount} members
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-label-sm text-outline px-2 py-0.5 rounded bg-surface border border-outline-variant/30">General</span>
                            <span className="text-label-sm text-outline/50">•</span>
                            <span className="text-label-sm text-outline">Updated recently</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-label-sm font-bold text-outline uppercase tracking-wider block mb-1">Your Balance</span>
                        {isSettled ? (
                          <>
                            <span className="text-headline-sm font-bold text-on-surface-variant tabular-nums block mb-1">
                              ₹0.00
                            </span>
                            <span className="text-label-sm text-outline">All settled up (₹0.00)</span>
                          </>
                        ) : isOwedToYou ? (
                          <>
                            <span className="text-headline-sm font-bold text-primary tabular-nums block mb-1">
                              +{balanceFormatted}
                            </span>
                            <span className="text-label-sm text-primary font-medium">You are owed {balanceFormatted}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-headline-sm font-bold text-tertiary-container tabular-nums block mb-1">
                              -{balanceFormatted}
                            </span>
                            <span className="text-label-sm text-tertiary-container font-medium">You owe {balanceFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-surface px-5 py-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {isSettled ? (
                          <>
                            <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                            <span className="text-label-sm text-on-surface-variant">No pending dues across all participants</span>
                          </>
                        ) : isOwedToYou ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-label-sm text-on-surface-variant">Outstanding debts</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                            <span className="text-label-sm text-on-surface-variant">Due</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link href={`/dashboard/groups/${group.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/50 rounded-lg text-label-md font-semibold transition-colors">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          View Expenses
                        </Link>
                        {!isSettled && !isOwedToYou && (
                          <Link href={`/dashboard/groups/${group.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-error hover:bg-error/90 text-on-error rounded-lg text-label-md font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-1">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                            Settle Up
                          </Link>
                        )}
                        {!isSettled && isOwedToYou && (
                           <Link href={`/dashboard/groups/${group.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary rounded-lg text-label-md font-semibold transition-colors shadow-sm">
                             <span className="material-symbols-outlined text-[18px]">payments</span>
                             Settle
                           </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Join with Code Widget */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary mb-4 border border-secondary/20">
              <span className="material-symbols-outlined text-[20px]">vpn_key</span>
            </div>
            <h3 className="text-headline-sm font-bold text-on-surface mb-1">Join with Code</h3>
            <p className="text-body-sm text-outline mb-4">Need another group? Create one above or join with an invite code from your friends.</p>
            {joinError && <p className="text-error text-label-sm mb-3">{joinError}</p>}
            <form onSubmit={handleJoinGroup} className="space-y-3">
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste code here..." 
                className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-center uppercase tracking-widest" 
                disabled={joining}
              />
              <button 
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface rounded-lg text-label-md font-semibold transition-colors disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join Group"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>

          {/* Net Position Widget */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="text-label-lg font-bold text-on-surface">Net Position</h3>
              <span className="text-label-sm text-outline">INR Ledgers</span>
            </div>
            <div className="p-5 flex flex-col items-center justify-center border-b border-outline-variant/20">
              <span className="text-label-md text-outline uppercase tracking-widest font-semibold mb-1">Net Balance</span>
              <div className="flex items-center gap-3">
                <span className={`text-display-lg font-bold tabular-nums ${netBalance < 0 ? 'text-tertiary-container' : netBalance > 0 ? 'text-primary' : 'text-on-surface'}`}>
                  {netBalance > 0 ? '+' : ''}₹{Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`px-2 py-0.5 rounded text-label-sm font-semibold border ${netBalance < 0 ? 'bg-error-container/30 text-error border-error/20' : netBalance > 0 ? 'bg-secondary-container/30 text-primary border-primary/20' : 'bg-surface-variant text-on-surface border-outline/20'}`}>
                  {netBalance < 0 ? 'Net Debtor' : netBalance > 0 ? 'Net Creditor' : 'Settled'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-outline-variant/20">
              <div className="p-4 flex flex-col items-center">
                <span className="text-label-sm text-outline mb-1">You are owed</span>
                <span className="text-headline-sm font-bold text-primary tabular-nums">₹{netOwedToYou.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="p-4 flex flex-col items-center">
                <span className="text-label-sm text-outline mb-1">You owe</span>
                <span className="text-headline-sm font-bold text-tertiary-container tabular-nums">₹{netOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="px-4 py-2 bg-surface-container-low/50 flex items-center justify-center gap-1.5 text-label-sm text-outline">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Ledgers recalculated in real-time
            </div>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-primary/10 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">lightbulb</span>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Pro-tip:</strong> Settle up before creating new group expense ledgers to keep debt cycles transparent and simplified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
