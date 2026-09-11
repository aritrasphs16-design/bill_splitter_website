"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllExpenses, addExpense, deleteExpense } from "@/app/actions/expenses";

type Expense = {
  _id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  groupId?: {
    _id: string;
    name: string;
  };
  paidBy?: {
    _id: string;
    supabaseId: string;
    full_name: string;
  };
  splits?: { user_id: string; amount: number }[];
};

type Group = {
  _id: string;
  name: string;
  members: string[]; // object ids
};

const CURRENCIES: Record<string, string> = {
  "INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "AUD": "A$", "CAD": "C$", "JPY": "¥"
};

const CATEGORIES = [
  { value: "food", icon: "restaurant", label: "Food", color: "bg-emerald-500" },
  { value: "groceries", icon: "shopping_basket", label: "Groceries", color: "bg-teal-500" },
  { value: "drinks", icon: "local_bar", label: "Drinks", color: "bg-cyan-500" },
  { value: "transport", icon: "local_taxi", label: "Transport", color: "bg-blue-500" },
  { value: "shopping", icon: "local_mall", label: "Shopping", color: "bg-indigo-500" },
  { value: "other", icon: "receipt_long", label: "Other", color: "bg-slate-500" },
];

const AmbientBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-surface-container-lowest transition-colors duration-500">
    <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#10B981]/10 blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
    <div className="absolute top-[20%] -right-40 w-[600px] h-[600px] rounded-full bg-[#065F46]/5 blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
    <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-[#0D9488]/10 blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
  </div>
);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState("INR");
  const [category, setCategory] = useState("food");
  const [selectedGroupId, setSelectedGroupId] = useState("personal");
  const [splitType, setSplitType] = useState("personal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiDetected, setIsAiDetected] = useState(false);

  // Filters and Budget State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'month', 'week'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budget, setBudget] = useState(40000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  useEffect(() => {
    fetchData();
    const savedBudget = localStorage.getItem("personal_budget");
    if (savedBudget) setBudget(Number(savedBudget));
  }, []);

  useEffect(() => {
    if (selectedGroupId === "personal") {
      setSplitType("personal");
    } else if (splitType === "personal") {
      setSplitType("equal");
    }
  }, [selectedGroupId]);

  // AI Auto-Categorization
  useEffect(() => {
    const detectCategory = (text: string) => {
      const t = text.toLowerCase();
      if (t.match(/dinner|lunch|breakfast|food|restaurant|pizza|burger|cafe|coffee|swiggy|zomato|sea food|seafood|meal|snack/)) return "food";
      if (t.match(/grocery|groceries|supermarket|mart|vegetable|fruit|milk|bread|restock|market/)) return "groceries";
      if (t.match(/drink|beer|bar|pub|wine|alcohol|club|liquor|cocktail/)) return "drinks";
      if (t.match(/cab|taxi|uber|ola|flight|train|bus|transport|fuel|petrol|toll|airport|ticket|parking/)) return "transport";
      if (t.match(/shop|buy|clothes|mall|amazon|flipkart|myntra|shoes|jacket/)) return "shopping";
      if (t.match(/hotel|stay|airbnb|booking|room|resort|rent/)) return "other";
      return null;
    };

    const timer = setTimeout(() => {
      if (description.trim()) {
        const suggested = detectCategory(description);
        if (suggested && suggested !== category) {
          setCategory(suggested);
          setIsAiDetected(true);
          setTimeout(() => setIsAiDetected(false), 2000);
        }
      }
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [description]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const res = await getAllExpenses(session.user.id);
      if (res.success) {
        setExpenses(res.expenses);
        setGroups(res.groups);
      }
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = () => {
    localStorage.setItem("personal_budget", budget.toString());
    setIsEditingBudget(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(Number(amount))) {
      setError("Please provide a valid description and amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let rate = 1;
    if (expenseCurrency !== "INR") {
      try {
        const res = await fetch(`/api/currency?currency=${expenseCurrency}`);
        if (!res.ok) throw new Error("Failed to fetch exchange rate");
        const data = await res.json();
        rate = data.rate;
      } catch (err) {
        setError(`Failed to get live exchange rate for ${expenseCurrency}.`);
        setSubmitting(false);
        return;
      }
    }

    const baseAmount = Number(amount) * rate;

    const result = await addExpense(userId!, {
      description: description.trim(),
      amount: baseAmount,
      category,
      original_amount: expenseCurrency !== "INR" ? Number(amount) : null,
      currency: expenseCurrency,
      exchange_rate: rate,
      groupId: selectedGroupId,
      splitType: selectedGroupId === "personal" ? "equal" : splitType
    });

    if (!result.success) {
      setError(result.error || "Failed to add expense");
    } else {
      setDescription("");
      setAmount("");
      setExpenseCurrency("INR");
      setCategory("food");
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const result = await deleteExpense(id);
    if (result.success) fetchData();
  };

  // Process filters
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(exp => {
      // Search
      if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Category
      if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;

      // Date
      const expDate = new Date(exp.createdAt);
      if (dateFilter === "month") {
        if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (expDate < oneWeekAgo) return false;
      }

      return true;
    });
  }, [expenses, searchQuery, dateFilter, categoryFilter]);

  // Calculate my total out-of-pocket spending for the budget
  const myTotalSpent = useMemo(() => {
    let sum = 0;
    expenses.forEach(e => {
      if (!userId) return;
      
      // Personal expense
      if (!e.groupId) {
        sum += e.amount;
        return;
      }

      // Group expense
      // Did I pay?
      const iPaid = e.paidBy?.supabaseId === userId;
      
      // What is my share?
      let myShare = 0;
      if (e.splits && e.splits.length > 0) {
        const mySplit = e.splits.find(s => s.user_id === userId);
        if (mySplit) myShare = mySplit.amount;
      } else {
        // Assume equal split (this requires knowing group member count, but we only have groups list)
        const group = groups.find(g => g._id === e.groupId!._id);
        if (group && group.members.length > 0) {
          myShare = e.amount / group.members.length;
        }
      }

      // If I paid, I'm "out of pocket" the full amount minus what others owe me (so just my share).
      // If someone else paid, I am "out of pocket" my share when I settle.
      // For budgeting purposes, usually "spent" means "my share of expenses".
      sum += myShare;
    });
    return sum;
  }, [expenses, userId, groups]);

  const categoryBreakdown = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      if (!userId) return;
      
      let myShare = 0;
      if (!e.groupId) {
        myShare = e.amount;
      } else {
        if (e.splits && e.splits.length > 0) {
          const mySplit = e.splits.find(s => s.user_id === userId);
          if (mySplit) myShare = mySplit.amount;
        } else {
          const group = groups.find(g => g._id === e.groupId!._id);
          if (group && group.members.length > 0) myShare = e.amount / group.members.length;
        }
      }

      let cat = e.category?.toLowerCase() || "other";
      if (!CATEGORIES.some(c => c.value === cat)) cat = "other"; // normalize unknown categories

      if (!data[cat]) data[cat] = 0;
      data[cat] += myShare;
    });

    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    return CATEGORIES.map(c => ({
      ...c,
      amount: data[c.value] || 0,
      percentage: ((data[c.value] || 0) / total) * 100
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [expenses, userId, groups]);

  const getCategoryIcon = (categoryValue: string) => {
    const found = CATEGORIES.find(c => c.value === categoryValue);
    return found ? found.icon : "receipt_long";
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    doc.setFont("times", "normal");

    // Draw Wallet Logo native vector function
    const drawLogo = (x: number, y: number, scale: number = 1) => {
      doc.setDrawColor(0, 93, 144);
      doc.setFillColor(0, 93, 144);
      doc.roundedRect(x, y, 8 * scale, 6 * scale, 1 * scale, 1 * scale, 'FD');
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 5 * scale, y + 2 * scale, 3 * scale, 2 * scale, 'FD');
    };

    // Header Logo & Title
    drawLogo(14, 15, 1.2);
    doc.setFontSize(22);
    doc.setTextColor(0, 93, 144);
    doc.text("SplitEasy Ledger", 26, 21.5);
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("My Expenses Summary", 14, 34);

    doc.setFontSize(10);
    doc.setTextColor(110, 122, 115);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(21, 28, 39);
    doc.text(`Total Personal Share Spent: Rs. ${myTotalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 50);

    const tableColumn = ["Date", "Description", "Context", "Category", "Total Amount"];
    const tableRows = filteredExpenses.map(exp => [
      new Date(exp.createdAt).toLocaleDateString(),
      exp.description,
      exp.groupId ? exp.groupId.name : 'Personal',
      exp.category.charAt(0).toUpperCase() + exp.category.slice(1),
      Number(exp.amount).toFixed(2)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [0, 93, 144] },
      styles: { fontSize: 10, cellPadding: 3, font: "times" },
    });

    // Add Footer to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Top border of footer
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

      // Logo
      drawLogo(14, pageHeight - 15, 0.8);
      
      // Brand Text
      doc.setFontSize(14);
      doc.setFont("times", "bolditalic");
      doc.setTextColor(0, 62, 92);
      doc.text("SplitEasy", 22, pageHeight - 10.5);
      
      // Date and Time
      doc.setFontSize(9);
      doc.setFont("times", "normal");
      doc.setTextColor(100, 116, 139);
      const dateStr = new Date().toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      });
      const generatedText = `Generated on ${dateStr}`;
      const textWidth = doc.getStringUnitWidth(generatedText) * doc.getFontSize() / doc.internal.scaleFactor;
      doc.text(generatedText, pageWidth - 14 - textWidth, pageHeight - 11);
    }

    doc.save("spliteasy-ledger.pdf");
  };

  const generateCSV = () => {
    const headers = ["Date", "Description", "Context", "Category", "Total Amount"];
    const rows = filteredExpenses.map(exp => [
      `"${new Date(exp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}"`,
      `"${exp.description.replace(/"/g, '""')}"`,
      `"${exp.groupId ? exp.groupId.name : 'Personal'}"`,
      exp.category.charAt(0).toUpperCase() + exp.category.slice(1),
      Number(exp.amount).toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "spliteasy-ledger.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      
      <div className="max-w-[1440px] mx-auto space-y-8 pb-12">
        {/* Header - Delay 0 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-outline-variant/30 pb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">My Expenses</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Track, categorize, and split your spending across groups.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={generateCSV} className="px-4 py-2 text-label-md font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:bg-surface-container-low transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-[0.98] hover:-translate-y-0.5">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download CSV
            </button>
            <button onClick={generatePDF} className="px-4 py-2 text-label-md font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:bg-surface-container-low transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-[0.98] hover:-translate-y-0.5">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Export PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg font-body-md animate-in fade-in">
            {error}
          </div>
        )}

        {/* Top Cards - Delay 100ms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          {/* Budget Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-primary">account_balance_wallet</span>
                <h2 className="text-label-lg font-bold">Monthly Budget & Spending</h2>
              </div>
              <span className="material-symbols-outlined text-[18px] text-outline cursor-pointer hover:text-primary transition-colors" onClick={() => setIsEditingBudget(!isEditingBudget)}>edit</span>
            </div>
            
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-label-sm font-semibold text-outline uppercase tracking-wider mb-1">Total Spent</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-display-sm font-bold text-on-surface">₹{myTotalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  {isEditingBudget ? (
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-on-surface-variant">/</span>
                      <input 
                        type="number" 
                        value={budget} 
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-24 px-1 py-0.5 bg-surface-container-high text-on-surface rounded border-none outline-none font-semibold text-title-md"
                        autoFocus
                        onBlur={handleSaveBudget}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                      />
                    </div>
                  ) : (
                    <span className="text-title-md text-on-surface-variant">/ ₹{budget.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="px-2 py-1 rounded-md bg-primary-container text-on-primary-container text-label-sm font-bold border border-primary/20 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {Math.min(100, Math.round((myTotalSpent / budget) * 100))}% used
              </div>
            </div>

            <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  myTotalSpent > budget ? 'bg-error' : 'bg-primary'
                }`}
                style={{ width: `${Math.min((myTotalSpent / budget) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-label-sm">
              <span className="text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Remaining headroom: <span className="font-bold text-on-surface">₹{Math.max(0, budget - myTotalSpent).toLocaleString()} remaining</span>
              </span>
              <span className="text-outline font-medium">Resets in 12 days</span>
            </div>
          </div>

          {/* Spending by Category Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-primary">pie_chart</span>
                <h2 className="text-label-lg font-bold">Spending by Category</h2>
              </div>
              <span className="text-label-sm font-medium text-outline">Current Cycle</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex gap-0.5 mb-6 bg-surface-container-high">
              {categoryBreakdown.map((cat, idx) => (
                <div 
                  key={cat.value}
                  className={`h-full ${cat.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${cat.percentage}%` }}
                  title={`${cat.label}: ₹${cat.amount.toLocaleString()}`}
                ></div>
              ))}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {categoryBreakdown.slice(0, 4).map((cat) => (
                <div key={cat.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                    <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                    {cat.label}
                  </div>
                  <span className="text-label-sm font-bold text-on-surface">{Math.round(cat.percentage)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add New Expense Form - Delay 200ms */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both hover:shadow-md hover:shadow-primary/5 transition-all">
          <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">add_circle</span>
              <h2 className="text-label-lg font-bold">Add New Expense</h2>
            </div>
            <span className="text-label-sm text-outline">Instant split calculation across ledger members</span>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleAddExpense} className="space-y-6">
              {/* Row 1: Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-4">
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Description</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Dinner, Groceries, Cab fare" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Amount</label>
                  <div className="flex gap-2">
                    <div className="w-[80px] shrink-0 relative">
                      <select
                        value={expenseCurrency}
                        onChange={(e) => setExpenseCurrency(e.target.value)}
                        className="w-full pl-2 pr-6 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none font-semibold"
                        disabled={submitting}
                      >
                        {Object.keys(CURRENCIES).map(curr => <option key={curr} value={curr}>{CURRENCIES[curr]}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                    </div>
                    <div className="relative flex-1">
                      <input 
                        type="number" step="0.01" min="0.01" placeholder="0.00" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                        required disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Group</label>
                  <div className="relative">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none font-medium truncate"
                      disabled={submitting}
                    >
                      <option value="personal">Personal</option>
                      {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Split Type</label>
                  <div className="relative">
                    <select
                      value={splitType}
                      onChange={(e) => setSplitType(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none font-medium truncate"
                      disabled={submitting || selectedGroupId === "personal"}
                    >
                      <option value="personal" disabled={selectedGroupId !== "personal"}>100% Personal (No Group)</option>
                      <option value="equal" disabled={selectedGroupId === "personal"}>Paid by you and split equally</option>
                      <option value="personal_in_group" disabled={selectedGroupId === "personal"}>Paid by you, 100% personal (In Group)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Category & Actions */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-label-sm font-semibold text-on-surface-variant">Category</label>
                    {isAiDetected && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-container text-primary animate-in fade-in zoom-in duration-300">
                        <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                        AI Auto-detected
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {CATEGORIES.map((c) => {
                      const isActive = category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(c.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-[0.96] ${
                            isActive 
                              ? "bg-primary-container/40 text-primary border-primary font-semibold shadow-sm" 
                              : "bg-surface text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-high"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
                          <span className="text-label-sm">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => { setDescription(""); setAmount(""); setCategory("food"); }}
                    className="px-5 py-2 text-label-md font-semibold text-on-surface-variant bg-surface border border-outline-variant/50 rounded-lg hover:bg-surface-container-low transition-colors active:scale-[0.98]"
                  >
                    Reset
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-label-md font-semibold transition-all shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {submitting ? "Adding..." : "Add Expense"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Expense History Ledger - Delay 300ms */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both hover:shadow-md hover:shadow-primary/5 transition-all">
          {/* Toolbar */}
          <div className="p-4 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/30">
            <div>
              <h3 className="text-label-lg font-bold text-on-surface">Expense History</h3>
              <p className="text-body-sm text-outline">Verified peer splits and automated balance calculations</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-surface border border-outline-variant/50 rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2 shrink-0">
                <select 
                  value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-surface border border-outline-variant/50 rounded-lg text-body-sm text-on-surface focus:outline-none font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_8px_center] bg-no-repeat"
                >
                  <option value="all">All Dates</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
                
                <select 
                  value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-surface border border-outline-variant/50 rounded-lg text-body-sm text-on-surface focus:outline-none font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_8px_center] bg-no-repeat"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          {/* List */}
          <div className="divide-y divide-outline-variant/20">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center text-outline p-12">
                No matching expenses found.
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const isGroup = !!expense.groupId;
                const iPaid = expense.paidBy?.supabaseId === userId;
                
                let myShare = 0;
                if (isGroup) {
                  if (expense.splits && expense.splits.length > 0) {
                    myShare = expense.splits.find(s => s.user_id === userId)?.amount || 0;
                  } else {
                    const group = groups.find(g => g._id === expense.groupId!._id);
                    if (group && group.members.length > 0) myShare = expense.amount / group.members.length;
                  }
                } else {
                  myShare = expense.amount; // 100% personal
                }

                // Logic for display amount (what impacts my balance)
                // If I paid, the net impact is (Amount - MyShare) owed to me (positive for me, or negative expense)
                // If someone else paid, I owe MyShare (negative for me)
                // However, standard display in lists usually shows the total amount, and subtext explains the split.
                
                const catObj = CATEGORIES.find(c => c.value === expense.category);
                const bgColor = catObj ? catObj.color.replace('bg-', 'text-').replace('500', '600') : 'text-primary';
                const bgPillColor = catObj ? catObj.color.replace('bg-', 'bg-').replace('500', '100') : 'bg-primary-container/30';

                return (
                  <div key={expense._id} className="p-4 hover:bg-surface-container-lowest/80 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${bgPillColor} ${bgColor} dark:bg-opacity-20 flex items-center justify-center shrink-0 border border-outline-variant/20 shadow-sm`}>
                        <span className="material-symbols-outlined text-[20px]">{getCategoryIcon(expense.category)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-label-md font-bold text-on-surface truncate">{expense.description}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high border border-outline-variant/40 text-on-surface-variant truncate max-w-[120px]">
                            {expense.groupId ? expense.groupId.name : 'Personal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-body-sm text-outline">
                          <span>Paid by <span className="font-medium text-on-surface-variant">{iPaid ? 'you' : expense.paidBy?.full_name?.split(' ')[0] || 'Someone'}</span></span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant/60"></span>
                          <span>{new Date(expense.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
                      <div className="text-left sm:text-right">
                        <div className={`text-label-md font-bold ${isGroup && !iPaid ? 'text-error' : iPaid && isGroup && expense.amount > myShare ? 'text-[#10B981]' : 'text-on-surface'}`}>
                          {isGroup && !iPaid ? '-' : isGroup && iPaid && expense.amount > myShare ? '+' : ''}₹{Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-outline mt-0.5 font-medium">
                          {isGroup ? (
                            `You paid ₹${iPaid ? expense.amount.toFixed(2) : '0.00'} / Your share ₹${myShare.toFixed(2)}`
                          ) : (
                            `Solo Expense / 100% Personal`
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" title="Edit (Coming soon)">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="w-7 h-7 rounded hover:bg-error-container hover:text-error flex items-center justify-center text-on-surface-variant transition-colors" title="Delete"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low/30 flex items-center justify-between">
            <span className="text-body-sm text-outline">Showing {filteredExpenses.length} of {expenses.length} transactions</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-surface border border-outline-variant/50 rounded-md text-label-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-surface border border-outline-variant/50 rounded-md text-label-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
