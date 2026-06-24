"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { calculateSettlements, Member, ExpenseInfo } from "@/lib/settlement-algorithm";

export default function Dashboard() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [youOwe, setYouOwe] = useState(0);
  const [owedToYou, setOwedToYou] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const [upiId, setUpiId] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);

  const [weather, setWeather] = useState({ temp: "--°C", desc: "Loading...", icon: "☀️" });

  useEffect(() => {
    fetchDashboardData();
    fetchWeather();
  }, []);

  const fetchWeather = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
            const data = await res.json();
            if (data.current_weather) {
              const code = data.current_weather.weathercode;
              let desc = "Sunny";
              let icon = "☀️";
              
              if (code >= 1 && code <= 3) { desc = "Cloudy"; icon = "⛅"; }
              else if (code >= 45 && code <= 48) { desc = "Foggy"; icon = "🌫️"; }
              else if (code >= 51 && code <= 67) { desc = "Rainy"; icon = "🌧️"; }
              else if (code >= 71 && code <= 77) { desc = "Snowy"; icon = "❄️"; }
              else if (code >= 95) { desc = "Stormy"; icon = "⛈️"; }

              setWeather({
                temp: `${Math.round(data.current_weather.temperature)}°C`,
                desc,
                icon
              });
            }
          } catch (e) {
            console.error("Weather fetch error", e);
            setWeather({ temp: "--°C", desc: "Unavailable", icon: "🌤️" });
          }
        },
        () => {
          setWeather({ temp: "--°C", desc: "Location Disabled", icon: "🌍" });
        }
      );
    } else {
      setWeather({ temp: "--°C", desc: "No Geolocation", icon: "🌍" });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user profile for UPI ID
      const { data: profile } = await supabase.from("users").select("upi_id").eq("id", session.user.id).single();
      if (profile && profile.upi_id) {
        setUpiId(profile.upi_id);
      }

      // Fetch personal expenses
      const { data: expenses } = await supabase
        .from("personal_expenses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (expenses) {
        setRecentExpenses(expenses);
        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        setTotalSpent(total);
      }

      // Fetch groups count
      const { count, data: groups } = await supabase
        .from("shared_groups")
        .select("id", { count: 'exact' });

      if (count !== null) {
        setActiveGroups(count);
      }

      // Calculate Global Debts
      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        
        const [membersRes, groupExpensesRes, groupSettlementsRes] = await Promise.all([
          supabase.from("group_members").select("group_id, user_id, users(full_name, upi_id)").in("group_id", groupIds),
          supabase.from("group_expenses").select("group_id, paid_by, amount").in("group_id", groupIds),
          supabase.from("group_settlements").select("group_id, paid_by, paid_to, amount").in("group_id", groupIds)
        ]);

        let globalOwe = 0;
        let globalOwedToYou = 0;

        const allMembers = membersRes.data || [];
        const allExpenses = groupExpensesRes.data || [];
        const allSettlements = groupSettlementsRes.data || [];

        for (const groupId of groupIds) {
          const gMembers: Member[] = allMembers
            .filter(m => m.group_id === groupId)
            .map(m => ({ id: m.user_id, name: (m.users as any).full_name, upiId: (m.users as any).upi_id }));
            
          const gExpenses: ExpenseInfo[] = allExpenses
            .filter(e => e.group_id === groupId)
            .map(e => ({ paidBy: e.paid_by, amount: e.amount }));

          const gSettlements = allSettlements
            .filter(s => s.group_id === groupId)
            .map(s => ({ paidBy: s.paid_by, paidTo: s.paid_to, amount: s.amount }));

          const transactions = calculateSettlements(gMembers, gExpenses, gSettlements);
          
          transactions.forEach(tx => {
            if (tx.from === session.user.id) globalOwe += tx.amount;
            if (tx.to === session.user.id) globalOwedToYou += tx.amount;
          });
        }

        setYouOwe(globalOwe);
        setOwedToYou(globalOwedToYou);
      }

      // Check for unread messages
      const { data: userMemberships } = await supabase
        .from("group_members")
        .select("group_id, last_read_at")
        .eq("user_id", session.user.id);
        
      if (userMemberships && userMemberships.length > 0) {
        let hasUnread = false;
        for (const membership of userMemberships) {
           const { count } = await supabase
             .from("group_messages")
             .select("*", { count: 'exact', head: true })
             .eq("group_id", membership.group_id)
             .gt("created_at", membership.last_read_at);
             
           if (count && count > 0) {
             hasUnread = true;
             break;
           }
        }
        setHasUnreadMessages(hasUnread);
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
      await supabase.from("users").update({ upi_id: upiId }).eq("id", session.user.id);
    }
    setSavingUpi(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Global Notification Banner */}
      {youOwe > 0 && (
        <div className="bg-[#A33D14]/10 border-l-4 border-[#A33D14] p-4 rounded-r-lg flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#A33D14]">notification_important</span>
            <p className="text-[#A33D14] font-medium text-sm">
              Ahoy! You have outstanding debts totaling <span className="font-bold font-mono">₹{youOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> to settle.
            </p>
          </div>
          <Link href="/dashboard/groups" className="text-xs font-bold text-[#A33D14] uppercase tracking-wider hover:underline">
            Settle Up
          </Link>
        </div>
      )}

      {/* Header & Weather Widget */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[28px] leading-tight font-bold text-[#00668c] flex items-center gap-2">
              Captain's Dashboard <span className="text-2xl">🏝️</span>
            </h2>
            {hasUnreadMessages && (
              <Link href="/dashboard/groups" className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E8E0D5] shadow-sm hover:bg-[#F8F3ED] transition-colors group">
                <span className="material-symbols-outlined text-[#00668c] group-hover:scale-110 transition-transform origin-top">notifications</span>
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </Link>
            )}
          </div>
          <p className="text-[#49454f] mt-1 text-sm">
            Welcome aboard. Here's your current ledger.
          </p>
        </div>
        <div className="bg-[#F8F3ED] border border-[#E8E0D5] rounded-xl py-3 px-5 flex items-center gap-3 shadow-sm">
          <div className="text-3xl filter drop-shadow-sm">{weather.icon}</div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-[#49454f] uppercase tracking-widest">
              Current Weather
            </p>
            <p className="text-[15px] text-[#00668c] font-bold">
              {weather.desc} {weather.temp}
            </p>
          </div>
        </div>
      </section>

      {/* UPI Settings Banner */}
      <section className="bg-[#E2EFF6] border border-[#00668c]/20 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[#00668c]">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          <div>
            <h3 className="font-bold text-sm">Payment Settings</h3>
            <p className="text-xs opacity-80">Add your UPI ID to receive payments automatically.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="yourname@okbank" 
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-[#00668c]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#00668c]"
          />
          <button 
            onClick={saveUpiId}
            disabled={savingUpi}
            className="bg-[#00668c] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#005575] transition-colors disabled:opacity-50 shrink-0"
          >
            {savingUpi ? "..." : "Save"}
          </button>
        </div>
      </section>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D5] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-[#00668c]">anchor</span>
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E2EFF6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#00668c]">anchor</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-[#00668c]">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D5] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-[#00668c]">sailing</span>
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E2EFF6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#00668c]">sailing</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest mb-1">Active Groups</p>
              <p className="text-3xl font-bold text-[#00668c]">{activeGroups}</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D5] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-[#A33D14]">logout</span>
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F5E6E0] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#A33D14]">logout</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest mb-1">You Owe</p>
              <p className="text-3xl font-bold text-[#A33D14]">₹{youOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D5] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-[#00668c]">login</span>
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E2EFF6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#00668c]">login</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest mb-1">Owed to You</p>
              <p className="text-3xl font-bold text-[#00668c]">₹{owedToYou.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Expenses Section */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D5]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E8E0D5]">
          <h3 className="text-lg font-bold text-[#00668c] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00668c]">receipt_long</span>
            Recent Expenses
          </h3>
          <Link href="/dashboard/expenses" className="text-xs font-bold text-[#00668c] hover:text-[#A33D14] uppercase tracking-wider transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E0D5]">
                <th className="pb-3 px-4 text-[11px] font-bold text-[#49454f] uppercase tracking-widest">Description</th>
                <th className="pb-3 px-4 text-[11px] font-bold text-[#49454f] uppercase tracking-widest">Category</th>
                <th className="pb-3 px-4 text-[11px] font-bold text-[#49454f] uppercase tracking-widest">Date</th>
                <th className="pb-3 px-4 text-[11px] font-bold text-[#49454f] uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#49454f]">
                    Loading...
                  </td>
                </tr>
              ) : recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#49454f]">
                    No recent expenses. Time to set sail!
                  </td>
                </tr>
              ) : (
                recentExpenses.map((exp) => {
                  const date = new Date(exp.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <tr key={exp.id} className="border-b border-[#F8F5F2] hover:bg-[#F8F5F2] transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5E6E0] flex items-center justify-center text-sm">
                          {exp.category === "food" ? "🍽️" : exp.category === "drinks" ? "🍹" : exp.category === "activities" ? "🤿" : "🛍️"}
                        </div>
                        <span className="text-[#1D1B20]">{exp.description}</span>
                      </td>
                      <td className="py-4 px-4 text-[#49454f] capitalize">{exp.category}</td>
                      <td className="py-4 px-4 text-[#49454f]">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#1D1B20] text-right">
                        ₹{Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
