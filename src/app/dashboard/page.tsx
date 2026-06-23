"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
      const { count } = await supabase
        .from("shared_groups")
        .select("*", { count: 'exact', head: true });

      if (count !== null) {
        setActiveGroups(count);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-section-margin">
      {/* Header & Weather Widget */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
            Captain's Dashboard 🏝️
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Welcome aboard. Here's your current ledger.
          </p>
        </div>
        <div className="bg-surface-bright border border-surface-container-highest rounded-xl p-4 flex items-center gap-4 buoyant-shadow">
          <div className="text-4xl">☀️</div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Current Weather
            </p>
            <p className="font-title-md text-title-md text-primary font-bold">
              Sunny 85°F
            </p>
          </div>
        </div>
      </section>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface rounded-xl p-6 buoyant-shadow wave-border border border-surface-container-highest relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-primary">anchor</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary">anchor</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Spent</p>
            <p className="font-display-lg text-display-lg text-primary">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface rounded-xl p-6 buoyant-shadow wave-border border border-surface-container-highest relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-secondary">sailing</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-secondary">sailing</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Groups</p>
            <p className="font-display-lg text-display-lg text-secondary">{activeGroups}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface rounded-xl p-6 buoyant-shadow wave-border border border-surface-container-highest relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-tertiary">output</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-tertiary">output</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">You Owe</p>
            <p className="font-display-lg text-display-lg text-tertiary">₹0.00</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface rounded-xl p-6 buoyant-shadow wave-border border border-surface-container-highest relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-on-secondary-container">input</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-on-secondary-container">input</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Owed to You</p>
            <p className="font-display-lg text-display-lg text-on-secondary-container">₹0.00</p>
          </div>
        </div>
      </section>

      {/* Recent Expenses Section */}
      <section className="bg-surface rounded-xl p-6 buoyant-shadow border border-surface-container-highest">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">receipt_long</span>
            Recent Expenses
          </h3>
          <Link href="/dashboard/expenses" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container-highest">
                <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                    No recent expenses. Time to set sail!
                  </td>
                </tr>
              ) : (
                recentExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-surface-container-lowest hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-lg">
                        {exp.category === "food" ? "🍽️" : exp.category === "drinks" ? "🍹" : exp.category === "activities" ? "🤿" : "🛍️"}
                      </div>
                      <span className="font-medium text-on-surface">{exp.description}</span>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant capitalize">{exp.category}</td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      {new Date(exp.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-label-md text-label-md text-on-surface text-right">
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
