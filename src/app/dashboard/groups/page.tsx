"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Group = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  group_members: { user_id: string }[];
  group_expenses: { amount: number; paid_by: string }[];
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("shared_groups")
        .select(`
          id, 
          name, 
          created_at, 
          created_by,
          group_members ( user_id ),
          group_expenses ( amount, paid_by )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups((data as unknown) as Group[]);
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

    const { data: groupData, error: groupError } = await supabase
      .from("shared_groups")
      .insert([{ name: groupName.trim(), created_by: userId }])
      .select()
      .single();

    if (groupError || !groupData) {
      setError(groupError?.message || "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{ group_id: groupData.id, user_id: userId }]);

    if (memberError) {
      setError("Group created but failed to add you.");
      setSubmitting(false);
      return;
    }

    setGroupName("");
    fetchGroups();
    setSubmitting(false);
  };

  const getEmoji = (id: string) => {
    const emojis = ["🏝️", "⛵", "🌊", "🍹", "🤿", "🥥", "🌴"];
    const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return emojis[sum % emojis.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-section-margin">
        <h1 className="font-display-lg text-display-lg text-primary mb-2 hidden md:block">Your Fleets (Groups)</h1>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2 md:hidden">Your Fleets (Groups)</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your travel crews and shared adventures.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-md text-body-md">
          {error}
        </div>
      )}

      {/* Unified Grid Layout matching 3rd Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-card-gap items-start">
        
        {/* Create Trip Form (Always First Card) */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-lg border border-surface-container relative overflow-hidden h-full">
          {/* Nautical decorative corner */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary-container/20 rounded-full blur-xl"></div>
          <h2 className="font-title-md text-title-md text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">explore</span>
            Start a New Expedition
          </h2>
          <form onSubmit={handleCreateGroup} className="space-y-6">
            <div className="wave-underline focus-within:bg-[url('data:image/svg+xml,%3Csvg width=\'20\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 2 Q 5 0, 10 2 T 20 2\' fill=\'none\' stroke=\'%2300677d\' stroke-width=\'2\'/%3E%3C/svg%3E')]">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="trip-name">Trip Name</label>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant p-0" 
                id="trip-name" 
                placeholder="e.g., Mediterranean Summer" 
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            
            {/* Disabled Add Crew input to match design visually, even though logic is in details page */}
            <div className="wave-underline opacity-50 cursor-not-allowed">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Add Crew Members</label>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant p-0 cursor-not-allowed" 
                placeholder="Emails or usernames" 
                type="text"
                disabled
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || !groupName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-tertiary-container text-on-tertiary-container font-label-md text-label-md py-3 px-4 rounded-lg shadow-md hover:bg-tertiary hover:text-on-tertiary transition-all active:translate-y-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">directions_boat</span>
              {submitting ? "Creating..." : "Create Trip"}
            </button>
          </form>
        </div>

        {/* Existing Groups */}
        {groups.map((group, index) => {
          // Compute balance dynamically
          let balance = 0;
          const memberCount = group.group_members?.length || 1;
          if (memberCount > 0 && group.group_expenses) {
             const totalExpenses = group.group_expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
             const userShare = totalExpenses / memberCount;
             const userPaid = group.group_expenses
                .filter(exp => exp.paid_by === userId)
                .reduce((sum, exp) => sum + Number(exp.amount), 0);
             balance = userPaid - userShare;
          }

          let borderClass, bgIconClass, badgeClass, badgeIcon, badgeText, balanceColor, balanceText;

          if (balance < -0.01) {
            // Owe style
            borderClass = "border-l-4 border-error bg-surface-container-lowest";
            bgIconClass = "bg-primary-container/10 text-primary";
            badgeClass = "bg-error-container text-on-error-container";
            badgeIcon = "warning";
            badgeText = "You owe";
            balanceColor = "text-error font-bold";
            balanceText = `₹${Math.abs(balance).toFixed(2)}`;
          } else if (balance > 0.01) {
             // Owed to you style
            borderClass = "border-l-4 border-secondary bg-surface-container-lowest";
            bgIconClass = "bg-secondary-container/20 text-secondary";
            badgeClass = "bg-secondary-container text-on-secondary-container";
            badgeIcon = "check_circle";
            badgeText = "Owed to you";
            balanceColor = "text-secondary font-bold";
            balanceText = `+₹${balance.toFixed(2)}`;
          } else {
             // Settled style
             borderClass = "border border-surface-variant bg-surface-container bg-opacity-50";
             bgIconClass = "bg-surface-variant text-on-surface-variant";
             badgeClass = "bg-surface-variant text-on-surface-variant";
             badgeIcon = null;
             badgeText = "Settled";
             balanceColor = "text-on-surface-variant";
             balanceText = "₹0.00";
          }

          return (
            <Link href={`/dashboard/groups/${group.id}`} key={group.id} className="block h-full">
              <div className={`${borderClass} p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between h-full min-h-[220px] group/card`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 ${bgIconClass} rounded-full flex items-center justify-center text-2xl group-hover/card:scale-110 transition-transform`}>
                      {getEmoji(group.id)}
                    </div>
                    <span className={`${badgeClass} font-caption text-caption px-3 py-1 rounded-full flex items-center gap-1`}>
                      {badgeIcon && <span className="material-symbols-outlined text-[16px]">{badgeIcon}</span>}
                      {badgeText}
                    </span>
                  </div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-1">{group.name}</h3>
                  <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span> 
                    {group.group_members?.length || 1} members
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-surface-variant flex justify-between items-end opacity-90">
                  <span className="font-label-md text-label-md text-on-surface-variant">Your balance</span>
                  <span className={`font-label-md text-label-md ${balanceColor}`}>{balanceText}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
