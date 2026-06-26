"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  "food": "#f59e0b",
  "drinks": "#3b82f6",
  "activities": "#10b981",
  "shopping": "#8b5cf6"
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Features State
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [budget, setBudget] = useState(15000); // Setting a default budget of ₹15,000
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  useEffect(() => {
    fetchExpenses();
    
    // Load saved budget
    const savedBudget = localStorage.getItem("personal_budget");
    if (savedBudget) {
      setBudget(Number(savedBudget));
    }
  }, []);

  const handleSaveBudget = () => {
    localStorage.setItem("personal_budget", budget.toString());
    setIsEditingBudget(false);
  };

  const fetchExpenses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("personal_expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(Number(amount))) {
      setError("Please provide a valid description and amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Not authenticated");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("personal_expenses")
      .insert([
        {
          user_id: session.user.id,
          description: description.trim(),
          amount: Number(amount),
          category,
        },
      ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setDescription("");
      setAmount("");
      setCategory("food");
      fetchExpenses();
    }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from("personal_expenses")
      .delete()
      .eq("id", id);
      
    if (!error) {
      fetchExpenses();
    }
  };

  const categories = [
    { value: "food", icon: "restaurant", label: "Food" },
    { value: "drinks", icon: "local_bar", label: "Drinks" },
    { value: "activities", icon: "surfing", label: "Activities" },
    { value: "shopping", icon: "local_mall", label: "Shopping" },
  ];

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(exp => {
      const expDate = new Date(exp.created_at);
      if (timeFilter === "month") {
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return expDate >= oneWeekAgo;
      }
      return true;
    });
  }, [expenses, timeFilter]);

  const totalSpent = useMemo(() => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0), [filteredExpenses]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || "other";
      if (!data[cat]) data[cat] = 0;
      data[cat] += Number(e.amount);
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  return (
    <div className="w-full">
      <div className="mb-section-margin">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">My Expenses</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Log your daily adventures and keep the crew sorted.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
          {error}
        </div>
      )}

      {/* Dashboard Top Section (Budget & Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-section-margin">
        
        {/* Budget Progress & Summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-buoyant border border-surface-variant flex flex-col justify-center h-full">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-on-surface-variant font-label-md uppercase tracking-wider">Total Spent ({timeFilter})</p>
                <h2 className="text-3xl font-display-sm text-primary">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-1">Budget</p>
                {isEditingBudget ? (
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-secondary">₹</span>
                    <input 
                      type="number" 
                      value={budget} 
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded border-none outline-none font-semibold text-right"
                      autoFocus
                      onBlur={handleSaveBudget}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                    />
                    <button onClick={handleSaveBudget} className="text-[var(--color-primary)] hover:opacity-80">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => setIsEditingBudget(true)}>
                    <p className="font-semibold text-secondary">₹{budget.toLocaleString()}</p>
                    <span className="material-symbols-outlined text-[16px] text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)] transition-colors">edit</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-surface-container-high rounded-full h-4 overflow-hidden mb-2 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  totalSpent > budget ? 'bg-error' : totalSpent > budget * 0.8 ? 'bg-tertiary' : 'bg-primary'
                }`}
                style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-right text-on-surface-variant">
              {totalSpent > budget 
                ? <span className="text-error font-bold flex justify-end items-center gap-1"><span className="material-symbols-outlined text-[16px]">warning</span> Over budget by ₹{(totalSpent - budget).toLocaleString()}</span>
                : `${((totalSpent / budget) * 100).toFixed(1)}% of budget used`
              }
            </p>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-buoyant border border-surface-variant h-[280px] flex items-center justify-center">
          {filteredExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#64748b"} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => `₹${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ paddingLeft: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-on-surface-variant flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">pie_chart</span>
              <p className="font-body-lg">No data for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Expense Form (Bento/Glassmorphism Card) */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-buoyant border border-surface-variant/50 mb-section-margin relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/30 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
        
        <h2 className="font-title-md text-title-md text-secondary mb-6 flex items-center gap-2 relative z-10">
          <span className="material-symbols-outlined">post_add</span>
          Add New Expense
        </h2>
        
        <form onSubmit={handleAddExpense} className="space-y-6 relative z-10">
          {/* Description & Amount Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 wave-input-container flex flex-col">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1">What was it?</label>
              <input 
                className="w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline-variant outline-none" 
                placeholder="e.g., Beach Dinner at Sunset" 
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={submitting}
              />
              <div className="wave-line"></div>
            </div>
            
            <div className="wave-input-container flex flex-col">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1">Amount (₹)</label>
              <div className="flex items-baseline gap-1">
                <span className="font-label-md text-label-md text-outline-variant">₹</span>
                <input 
                  className="w-full font-label-md text-label-md text-on-surface placeholder:text-outline-variant font-bold text-lg outline-none" 
                  placeholder="0.00" 
                  step="0.01" 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0.01"
                  disabled={submitting}
                />
              </div>
              <div className="wave-line"></div>
            </div>
          </div>
          
          {/* Categories (Chips) */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-3 block">Category</label>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {categories.map((c) => {
                const isActive = category === c.value;
                return (
                  <label key={c.value} className="cursor-pointer group flex-shrink-0">
                    <input 
                      checked={isActive} 
                      className="hidden" 
                      name="category" 
                      type="radio" 
                      value={c.value}
                      onChange={() => setCategory(c.value)}
                    />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all group-active:scale-95 shadow-sm border ${
                      isActive 
                        ? "bg-primary-container text-on-primary-container border-primary-container" 
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-variant"
                    }`}>
                      <span className="material-symbols-outlined text-sm">{c.icon}</span>
                      <span className="font-label-md text-label-md">{c.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button 
              className="ticket-btn px-8 py-3 font-title-md text-title-md uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-tertiary/20 disabled:opacity-50" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add to Log"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </form>
      </section>

      {/* Wave Divider SVG */}
      <div className="w-full flex justify-center mb-section-margin opacity-30 pointer-events-none">
        <svg fill="none" height="24" viewBox="0 0 200 24" width="200" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 12C20 12 20 2 40 2C60 2 60 22 80 22C100 22 100 2 120 2C140 2 140 22 160 22C180 22 180 12 200 12" stroke="#005d90" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      </div>

      {/* Expense Log (Cards Grid) */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">receipt_long</span>
            Recent Manifest
          </h3>
          <div className="flex bg-surface-container rounded-lg p-1 border border-surface-variant shadow-sm w-full md:w-auto overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setTimeFilter("all")} 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${timeFilter === "all" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
            >
              All Time
            </button>
            <button 
              onClick={() => setTimeFilter("month")} 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${timeFilter === "month" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setTimeFilter("week")} 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${timeFilter === "week" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}`}
            >
              This Week
            </button>
          </div>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-8">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-surface-container bg-opacity-50 p-8 rounded-xl text-center border border-surface-variant">
            <p className="font-body-lg text-body-lg text-on-surface-variant">No expenses logged in this timeframe. Start adding to your manifest!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-card-gap">
            {filteredExpenses.map((expense) => {
              // Styling based on category
              let iconClass = "", bgClass = "", dotClass = "", iconName = "";
              if (expense.category === "food") {
                iconClass = "text-tertiary";
                bgClass = "bg-surface-container";
                dotClass = "bg-tertiary";
                iconName = "restaurant";
              } else if (expense.category === "drinks") {
                iconClass = "text-secondary";
                bgClass = "bg-surface-container";
                dotClass = "bg-secondary";
                iconName = "local_bar";
              } else if (expense.category === "activities") {
                iconClass = "text-primary";
                bgClass = "bg-surface-container-lowest border border-surface-variant";
                dotClass = "bg-primary";
                iconName = "surfing";
              } else {
                iconClass = "text-primary";
                bgClass = "bg-surface-container";
                dotClass = "bg-primary";
                iconName = "local_mall";
              }

              return (
                <div key={expense.id} className={`${bgClass} rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:translate-y-1 relative group`}>
                  
                  {/* Delete button (shows on hover) */}
                  <button 
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="absolute top-2 right-2 text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete expense"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center ${iconClass} shadow-sm shrink-0`}>
                      <span className="material-symbols-outlined">{iconName}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body-md text-body-md font-semibold text-on-surface truncate pr-6">{expense.description}</div>
                      <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span> 
                        <span className="capitalize">{expense.category}</span> • {new Date(expense.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-label-md text-label-md font-bold text-on-surface shrink-0">
                      ₹{Number(expense.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
