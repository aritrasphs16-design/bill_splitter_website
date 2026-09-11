"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Trash2, UserPlus, Receipt, HandCoins, User, Users, Send, Download } from "lucide-react";
import Link from "next/link";
import { calculateSettlements, Member, ExpenseInfo, Transaction, SettlementInfo } from "@/lib/settlement-algorithm";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getGroupDetails, addGroupMember, addGroupExpense, deleteGroupExpense, addSettlement } from "@/app/actions/groupDetails";
import { addGroupMessage, getGroupMessages } from "@/app/actions/messages";

const CATEGORIES = ["Food", "Transport", "Hotel", "Activities", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  "Food": "#f59e0b", // Amber
  "Transport": "#3b82f6", // Blue
  "Hotel": "#8b5cf6", // Purple
  "Activities": "#10b981", // Emerald
  "Other": "#64748b" // Slate
};

const CURRENCIES: Record<string, string> = {
  "INR": "₹",
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "AUD": "A$",
  "CAD": "C$",
  "JPY": "¥"
};

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
  joined_at: string;
  users: { full_name: string, email: string };
};

type RawSettlement = {
  id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  created_at: string;
};

type Activity = {
  id: string;
  type: "group_created" | "member_joined" | "expense_added" | "settlement";
  timestamp: Date;
  description: React.ReactNode;
  icon: React.ReactNode;
};

type GroupExpenseRow = {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  category: string;
  payer: { full_name: string };
  splits?: { user_id: string, amount: number }[] | null;
  original_amount?: number | null;
  currency?: string | null;
  exchange_rate?: number | null;
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
  const [settlementsData, setSettlementsData] = useState<SettlementInfo[]>([]);
  const [rawSettlements, setRawSettlements] = useState<RawSettlement[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "analytics">("overview");

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Other");
  const [expenseCurrency, setExpenseCurrency] = useState("INR");
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE">("EQUAL");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [paying, setPaying] = useState(false);
  const [nudging, setNudging] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupData();
    fetchMessages();

    // Subscribe to realtime messages using Supabase Broadcast instead of Postgres changes
    const channel = supabase.channel(`group_chat_${groupId}`)
      .on('broadcast', { event: 'new_message' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, userId]);

  const fetchMessages = async () => {
    // Fetch from MongoDB
    const res = await getGroupMessages(groupId);
    if (res.success && res.data) {
      const mappedMessages = res.data.map((msg: any) => ({
        id: msg._id,
        user_id: msg.senderId.supabaseId,
        message: msg.message,
        created_at: msg.createdAt,
        sender: { full_name: msg.senderId.full_name }
      }));
      setMessages(mappedMessages);
    }
  };

  const fetchGroupData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const uid = session.user.id;
    setUserId(uid);

    // Fetch data using Mongoose server action
    const res = await getGroupDetails(groupId);

    if (!res.success || !res.data) {
      router.push("/dashboard/groups");
      return;
    }

    const { group: groupData, expenses: expensesData, settlements: settlementsData } = res.data;

    // Map Mongoose output to match expected component state structure
    const mappedGroup = {
      id: groupData._id,
      name: groupData.name,
      created_at: groupData.createdAt,
      created_by: groupData.createdBy.supabaseId,
      creator: { full_name: groupData.createdBy.full_name }
    };

    setGroup(mappedGroup as unknown as GroupDetails);
    
    const mappedMembers = groupData.members.map((m: any) => ({
      id: m._id,
      user_id: m.supabaseId,
      joined_at: groupData.createdAt,
      users: { full_name: m.full_name, email: m.email, upi_id: m.upi_id }
    }));
    setMembers(mappedMembers as unknown as GroupMemberRow[]);
    
    const mappedExpenses = expensesData.map((e: any) => ({
      id: e._id,
      description: e.description,
      amount: e.amount,
      paid_by: e.paidBy.supabaseId,
      created_at: e.createdAt,
      category: e.category,
      splits: e.splits,
      original_amount: e.original_amount,
      currency: e.currency,
      exchange_rate: e.exchange_rate,
      payer: { full_name: e.paidBy.full_name }
    }));
    setExpenses(mappedExpenses as unknown as GroupExpenseRow[]);

    const mappedRawSettlements = settlementsData.map((s: any) => ({
      id: s._id,
      paid_by: s.paidBy.supabaseId,
      paid_to: s.paidTo.supabaseId,
      amount: s.amount,
      created_at: s.createdAt
    }));
    setRawSettlements(mappedRawSettlements);

    const fetchedSettlements = mappedRawSettlements.map((s: any) => ({ paidBy: s.paid_by, paidTo: s.paid_to, amount: s.amount }));
    setSettlementsData(fetchedSettlements);

    // Calculate settlements
    updateSettlements(mappedMembers, mappedExpenses, fetchedSettlements);

    setLoading(false);
  };

  const updateSettlements = (mems: GroupMemberRow[], exps: GroupExpenseRow[], setts: SettlementInfo[]) => {
    const algMembers: Member[] = mems.map(m => ({ id: m.user_id, name: m.users.full_name, upiId: (m.users as any).upi_id }));
    const algExps: ExpenseInfo[] = exps.map(e => ({ paidBy: e.paid_by, amount: e.amount, splits: e.splits }));
    setSettlements(calculateSettlements(algMembers, algExps, setts));
  };

  const activities = useMemo(() => {
    if (!group) return [];
    const acts: Activity[] = [];

    acts.push({
      id: `group-created-${group.id}`,
      type: "group_created",
      timestamp: new Date(group.created_at),
      description: <span><strong>{group.creator.full_name}</strong> created the group</span>,
      icon: <Users size={16} />
    });

    members.forEach(m => {
      acts.push({
        id: `member-joined-${m.id}`,
        type: "member_joined",
        timestamp: new Date(m.joined_at),
        description: <span><strong>{m.users.full_name}</strong> joined the group</span>,
        icon: <UserPlus size={16} />
      });
    });

    expenses.forEach(e => {
      const baseAmountStr = `₹${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      let amountDisplay = baseAmountStr;
      
      if (e.currency && e.currency !== 'INR' && e.original_amount) {
        const symbol = CURRENCIES[e.currency] || e.currency;
        const originalStr = `${symbol}${e.original_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        amountDisplay = `${originalStr} (${baseAmountStr})`;
      }

      acts.push({
        id: `expense-${e.id}`,
        type: "expense_added",
        timestamp: new Date(e.created_at),
        description: <span><strong>{e.payer.full_name}</strong> added a <strong>{amountDisplay}</strong> expense for '{e.description}'</span>,
        icon: <Receipt size={16} />
      });
    });

    rawSettlements.forEach(s => {
      const payer = members.find(m => m.user_id === s.paid_by)?.users.full_name || "Someone";
      const payee = members.find(m => m.user_id === s.paid_to)?.users.full_name || "Someone";
      acts.push({
        id: `settlement-${s.id}`,
        type: "settlement",
        timestamp: new Date(s.created_at),
        description: <span><strong>{payer}</strong> paid <strong>{payee}</strong> <strong>₹{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>,
        icon: <HandCoins size={16} />
      });
    });

    return acts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [group, members, expenses, rawSettlements]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || "Other";
      if (!data[cat]) data[cat] = 0;
      data[cat] += e.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).sort((a, b) => b.value - a.value);
  }, [expenses]);

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

    const result = await addGroupMember(groupId, email);

    if (!result.success) {
      setError(result.error || "Could not add member.");
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

    let rate = 1;
    if (expenseCurrency !== "INR") {
      try {
        // Use our custom internal API endpoint
        const res = await fetch(`/api/currency?currency=${expenseCurrency}`);
        if (!res.ok) throw new Error("Failed to fetch exchange rate");
        const data = await res.json();
        rate = data.rate;
      } catch (err) {
        console.error(err);
        setError(`Failed to get live exchange rate for ${expenseCurrency}. Please try again later.`);
        setSubmittingExpense(false);
        return;
      }
    }

    const baseAmount = amt * rate; // Convert to INR

    let splitsData = null;
    if (splitType === "EXACT") {
      let totalSplit = 0;
      splitsData = members.map(m => {
        const val = customSplits[m.user_id] || 0;
        totalSplit += val;
        return { user_id: m.user_id, amount: val * rate }; // Store in INR
      });
      if (Math.abs(totalSplit - amt) > 0.01) {
        const sym = CURRENCIES[expenseCurrency] || expenseCurrency;
        setError(`Exact amounts must sum up to ${sym}${amt}. Currently: ${sym}${totalSplit}`);
        setSubmittingExpense(false);
        return;
      }
    } else if (splitType === "PERCENTAGE") {
      let totalPercent = 0;
      splitsData = members.map(m => {
        const val = customSplits[m.user_id] || 0;
        totalPercent += val;
        return { user_id: m.user_id, amount: (val / 100) * baseAmount }; // Store in INR
      });
      if (Math.abs(totalPercent - 100) > 0.01) {
        setError(`Percentages must sum up to 100%. Currently: ${totalPercent}%`);
        setSubmittingExpense(false);
        return;
      }
    }

    if (!userId) {
      setError("User not authenticated.");
      setSubmittingExpense(false);
      return;
    }

    const result = await addGroupExpense(groupId, userId, {
      description: expenseDesc.trim(),
      amount: baseAmount,
      category: expenseCategory,
      splits: splitsData,
      original_amount: expenseCurrency !== "INR" ? amt : null,
      currency: expenseCurrency,
      exchange_rate: rate
    });

    if (!result.success) {
      setError(result.error || "Something went wrong. Please try again later.");
    } else {
      setSuccess("Group expense added successfully!");
      setExpenseDesc("");
      setExpenseAmt("");
      setExpenseCategory("Other");
      setExpenseCurrency("INR");
      setCustomSplits({});
      setSplitType("EQUAL");
      fetchGroupData(); // Refresh
      setTimeout(() => setSuccess(""), 5000);
    }
    setSubmittingExpense(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMsg || !userId) return;
    
    setSendingMsg(true);
    
    const result = await addGroupMessage(groupId, userId, newMessage.trim());

    if (result.success) {
      setNewMessage("");
      fetchMessages(); // Update UI immediately for the sender
      
      // Broadcast to other users via Supabase Realtime Pub/Sub
      supabase.channel(`group_chat_${groupId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: { trigger: true }
      });
    } else {
      console.error("Failed to send message:", result.error);
    }
    setSendingMsg(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const result = await deleteGroupExpense(id);
    if (!result.success) {
      setError(result.error || "Could not delete expense.");
    } else {
      setSuccess("Expense deleted.");
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      updateSettlements(members, updatedExpenses, settlementsData);
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedTx || paying) return;
    setPaying(true);
    const result = await addSettlement(groupId, selectedTx.from, selectedTx.to, selectedTx.amount);

    if (result.success) {
      setSuccess(`Successfully paid ₹${selectedTx.amount} to ${selectedTx.toName}`);
      setShowQrModal(false);
      
      // SEND EMAIL
      const payee = members.find(m => m.user_id === selectedTx.to);
      const payerName = members.find(m => m.user_id === selectedTx.from)?.users.full_name || "Someone";
      if (payee) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment_received',
              recipientEmail: payee.users.email,
              recipientName: payee.users.full_name,
              senderName: payerName,
              amount: selectedTx.amount,
              groupName: group?.name || "the group"
            })
          });
        } catch (e) {
          console.error("Failed to send email", e);
        }
      }
      
      setSelectedTx(null);
      fetchGroupData();
    } else {
      setError(result.error || "Failed to mark as paid.");
    }
    setPaying(false);
  };

  const handleNudge = async (tx: Transaction) => {
    setNudging(tx.from);
    const debtor = members.find(m => m.user_id === tx.from);
    if (!debtor) {
      setNudging(null);
      return;
    }

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nudge',
          recipientEmail: debtor.users.email,
          recipientName: debtor.users.full_name,
          senderName: tx.toName,
          amount: tx.amount,
          groupName: group?.name || "the group"
        })
      });
      setSuccess(`Nudge sent to ${debtor.users.full_name}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error("Failed to send nudge", e);
      setError("Failed to send nudge email.");
    }
    setNudging(null);
  };

  const generateGroupPDF = async () => {
    if (!group) return;
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
    doc.text(`SplitEasy Ledger`, 26, 21.5);
    
    // Group Name & Date
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Group: ${group.name}`, 14, 34);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}  •  Created By: ${group.creator.full_name}`, 14, 40);
    
    // Summary Stats
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Spent: Rs. ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 50);
    doc.text(`Total Members: ${members.length}`, 14, 57);
    doc.text(`Total Expenses: ${expenses.length}`, 14, 64);

    let currentY = 75;

    // Members Table
    doc.setFontSize(14);
    doc.setTextColor(0, 93, 144);
    doc.text("Group Members", 14, currentY);
    currentY += 5;

    const memberRows = members.map(m => [m.users.full_name, m.users.email]);
    autoTable(doc, {
      head: [["Name", "Email"]],
      body: memberRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [0, 93, 144] },
      styles: { fontSize: 10, cellPadding: 3, font: "times" }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Debts / Settlements
    doc.setFontSize(14);
    doc.setTextColor(0, 93, 144);
    doc.text("Settlements (Who owes whom)", 14, currentY);
    currentY += 5;

    if (settlements.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("All settled up! No pending debts.", 14, currentY + 5);
      currentY += 15;
    } else {
      const settlementRows = settlements.map(s => [
        s.fromName,
        "owes",
        s.toName,
        `Rs. ${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
      autoTable(doc, {
        head: [["Debtor", "", "Creditor", "Amount"]],
        body: settlementRows,
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [163, 61, 20] }, // Secondary color theme
        styles: { fontSize: 10, cellPadding: 3, font: "times" }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses Timeline
    doc.addPage();
    currentY = 20;
    doc.setFontSize(14);
    doc.setTextColor(0, 93, 144);
    doc.text("Expenses Log", 14, currentY);
    currentY += 5;

    if (expenses.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("No expenses recorded yet.", 14, currentY + 5);
    } else {
      const expenseRows = expenses.map(e => [
        new Date(e.created_at).toLocaleDateString(),
        e.payer.full_name,
        e.description,
        e.category,
        `Rs. ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
      autoTable(doc, {
        head: [["Date", "Paid By", "Description", "Category", "Amount"]],
        body: expenseRows,
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [0, 93, 144] },
        styles: { fontSize: 10, cellPadding: 3, font: "times" }
      });
    }

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

    doc.save(`${group.name.replace(/\s+/g, '-').toLowerCase()}-spliteasy-summary.pdf`);
  };

  if (loading) {
    return <div className="text-[var(--color-on-background)] font-medium">Loading group details...</div>;
  }

  if (!group) return null;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
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
        <button
          onClick={generateGroupPDF}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-5 py-2.5 rounded-lg font-heading font-semibold hover:bg-[var(--color-primary)]/90 transition-all shadow-md active:translate-y-1 self-start md:self-auto"
        >
          <Download size={18} />
          Download Trip Summary
        </button>
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--color-outline-variant)] mb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-2 text-lg font-heading font-semibold transition-colors border-b-4 ${activeTab === "overview" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 px-2 text-lg font-heading font-semibold transition-colors border-b-4 ${activeTab === "timeline" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"}`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-2 text-lg font-heading font-semibold transition-colors border-b-4 ${activeTab === "analytics" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"}`}
        >
          Analytics
        </button>
      </div>

      {activeTab === "analytics" ? (
        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          {expenses.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] p-12 rounded-2xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)] text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)] mb-4 block">monitoring</span>
              <h2 className="text-xl font-heading font-semibold text-[var(--color-on-surface)] mb-2">No Data Yet</h2>
              <p className="text-[var(--color-on-surface-variant)]">Add some group expenses to see your spending analytics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-2xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
                <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">pie_chart</span> Spending by Category
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS["Other"]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-6 ml-2">Category Breakdown</h2>
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS["Other"] }}></div>
                      <span className="font-medium text-[var(--color-on-surface)]">{cat.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[var(--color-primary)]">
                      ₹{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "timeline" ? (
        <div className="max-w-3xl mx-auto bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-2xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)] mb-12">
          <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined">history</span> Activity Log
          </h2>
          <div className="relative border-l-2 border-[var(--color-outline-variant)] ml-4 space-y-8 pb-4">
            {activities.length === 0 ? (
              <p className="ml-6 text-[var(--color-on-surface-variant)]">No activity yet.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="relative ml-6 group">
                  <span className="absolute -left-[35px] bg-white border-2 border-[var(--color-primary)] w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-110 group-hover:bg-[#E2EFF6] transition-all">
                    {act.icon}
                  </span>
                  <div className="bg-white border border-[var(--color-outline-variant)] p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[var(--color-on-surface)] mb-1 text-[15px]">{act.description}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] font-medium">
                      {act.timestamp.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
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
              <div className="flex flex-col items-center justify-center py-8 opacity-70">
                <span className="material-symbols-outlined text-5xl text-[var(--color-primary)] mb-2">celebration</span>
                <p className="text-[var(--color-on-surface)] font-medium text-center">All settled up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlements.map((tx, idx) => (
                  <div key={idx} className="relative flex items-center justify-between p-4 bg-white border border-[var(--color-outline-variant)] rounded-xl shadow-sm group hover:border-[#A33D14] transition-all">
                    {/* Animated background line */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                      <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-[#00668c] to-transparent opacity-20 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 border-t-2 border-r-2 border-[#00668c] rotate-45 -translate-y-1/2 -translate-x-1/2 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Pay Now Button (if the current user owes money) */}
                    {tx.from === userId && (
                      <button 
                        onClick={() => { setSelectedTx(tx); setShowQrModal(true); }}
                        className="absolute -top-3 -right-3 text-[10px] uppercase tracking-wider font-bold bg-[#A33D14] text-white px-3 py-1.5 rounded-full shadow-md hover:bg-[#8A3311] transition-colors z-20 flex items-center gap-1 border-2 border-white"
                      >
                        <span className="material-symbols-outlined text-[12px]">qr_code_scanner</span>
                        Pay Now
                      </button>
                    )}

                    {/* Nudge Button (if the current user is owed money) */}
                    {tx.to === userId && (
                      <button 
                        onClick={() => handleNudge(tx)}
                        disabled={nudging === tx.from}
                        className="absolute -top-3 -right-3 text-[10px] uppercase tracking-wider font-bold bg-[#00668c] text-white px-3 py-1.5 rounded-full shadow-md hover:bg-[#005575] transition-colors z-20 flex items-center gap-1 border-2 border-white disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[12px]">notifications_active</span>
                        {nudging === tx.from ? "Nudging..." : "Nudge"}
                      </button>
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 w-[30%]">
                      <div className="w-10 h-10 rounded-full bg-[#F5E6E0] border-2 border-white flex items-center justify-center text-[#A33D14] font-bold shadow-sm z-10 shrink-0">
                        {tx.fromName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-[#49454f] truncate w-full text-center">{tx.fromName}</span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center px-2 bg-white rounded-full border border-[var(--color-outline-variant)] shadow-sm py-1 max-w-[40%]">
                      <span className="text-[10px] uppercase tracking-widest text-[#49454f] mb-0.5">Pays</span>
                      <span className="font-mono font-bold text-sm text-[#00668c]">
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-1 w-[30%]">
                      <div className="w-10 h-10 rounded-full bg-[#E2EFF6] border-2 border-white flex items-center justify-center text-[#00668c] font-bold shadow-sm z-10 shrink-0">
                        {tx.toName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-[#49454f] truncate w-full text-center">{tx.toName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Add Expense & Expense List */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-[var(--color-surface-container-lowest)] p-6 md:p-8 rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)]">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)] mb-6">Add Group Expense</h2>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
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
                <div className="w-full sm:w-1/4">
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Currency</label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                  >
                    {Object.keys(CURRENCIES).map(c => (
                      <option key={c} value={c}>{c} ({CURRENCIES[c]})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-1/4">
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmt}
                    onChange={(e) => setExpenseAmt(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Second Row: Category and Notice */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-2">
                <div className="w-full sm:w-1/2">
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-surface-container-lowest)] border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:border-[var(--color-secondary)] focus:outline-none transition-colors appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {expenseCurrency !== 'INR' && (
                  <div className="w-full sm:w-1/2 text-xs font-medium text-[#A33D14] bg-[#F5E6E0] p-3 rounded flex items-center gap-2 border border-[#A33D14]/30 shadow-sm animate-pulse-slow">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Live {expenseCurrency} to INR exchange rate will be applied instantly.
                  </div>
                )}
              </div>

              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">Split Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
                    <input type="radio" name="splitType" checked={splitType === "EQUAL"} onChange={() => setSplitType("EQUAL")} className="accent-[var(--color-primary)] w-4 h-4" />
                    <span>Equally</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
                    <input type="radio" name="splitType" checked={splitType === "EXACT"} onChange={() => setSplitType("EXACT")} className="accent-[var(--color-primary)] w-4 h-4" />
                    <span>Exact Amounts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
                    <input type="radio" name="splitType" checked={splitType === "PERCENTAGE"} onChange={() => setSplitType("PERCENTAGE")} className="accent-[var(--color-primary)] w-4 h-4" />
                    <span>Percentages</span>
                  </label>
                </div>
              </div>

              {splitType !== "EQUAL" && (
                <div className="w-full mt-2 p-4 bg-[var(--color-surface-container-low)] rounded-lg border border-[var(--color-outline-variant)] space-y-3">
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    Enter {splitType === "EXACT" ? `Amounts (${CURRENCIES[expenseCurrency] || expenseCurrency})` : "Percentages (%)"} per member
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-4 bg-white p-2 px-3 rounded shadow-sm border border-[var(--color-outline-variant)]">
                        <span className="text-sm font-medium text-[var(--color-on-surface)] truncate">{m.users.full_name}</span>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          value={customSplits[m.user_id] === undefined ? "" : customSplits[m.user_id]}
                          onChange={(e) => setCustomSplits(prev => ({ ...prev, [m.user_id]: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                          className="w-24 px-2 py-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded text-sm text-right focus:outline-none focus:border-[var(--color-primary)] font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="w-full sm:w-auto py-2.5 px-8 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-heading font-semibold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Receipt size={18} />
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
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS["Other"] }} title={expense.category || "Other"}></div>
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

          {/* Group Chat Section */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[var(--shadow-float)] border border-[var(--color-surface-container-highest)] overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)]">forum</span>
              <h2 className="text-xl font-heading font-semibold text-[var(--color-primary)]">Discussions</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F3ED]/30">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--color-on-surface-variant)] text-sm">
                  No messages yet. Start discussing debts!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.user_id === userId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)] font-bold px-1">
                        {isMe ? 'You' : msg.sender.full_name}
                      </span>
                      <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-[#00668c] text-white rounded-tr-sm' : 'bg-white border border-[#E8E0D5] text-[#1D1B20] rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--color-outline-variant)] bg-white flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Message the group..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2 bg-[var(--color-surface-container-low)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00668c]"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#00668c] text-white flex items-center justify-center hover:bg-[#005575] disabled:opacity-50 transition-colors shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[#49454f] hover:text-[#A33D14] transition-colors bg-[#F8F5F2] rounded-full p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="w-16 h-16 bg-[#E2EFF6] rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm -mt-12">
               <span className="material-symbols-outlined text-3xl text-[#00668c]">qr_code_2</span>
            </div>

            <h3 className="text-xl font-bold text-[#00668c] mb-1">Settle Up</h3>
            <p className="text-sm text-[#49454f] mb-6 text-center">
              Scan with any UPI app to pay <span className="font-bold text-[#1D1B20]">{selectedTx.toName}</span>
            </p>
            
            {selectedTx.toUpiId ? (
              <div className="bg-[#F8F3ED] p-4 rounded-2xl border border-[#E8E0D5] mb-6 relative group">
                <div className="absolute inset-0 border-2 border-dashed border-[#00668c]/30 rounded-2xl pointer-events-none group-hover:border-[#00668c]/60 transition-colors"></div>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=00668c&bgcolor=F8F3ED&data=${encodeURIComponent(`upi://pay?pa=${selectedTx.toUpiId}&pn=${selectedTx.toName}&am=${selectedTx.amount}&cu=INR`)}`} 
                  alt="Payment QR Code"
                  className="w-48 h-48 rounded-xl shadow-sm relative z-10"
                />
              </div>
            ) : (
              <div className="bg-[#F8F5F2] p-6 rounded-2xl border border-[#E8E0D5] mb-6 text-center w-full">
                <span className="material-symbols-outlined text-4xl text-[#A33D14] mb-2">error</span>
                <p className="text-sm font-medium text-[#49454f]">
                  <span className="font-bold text-[#1D1B20]">{selectedTx.toName}</span> hasn't added their UPI ID yet!
                </p>
                <p className="text-xs text-[#49454f] mt-1">
                  Ask them to add it in their Settings.
                </p>
              </div>
            )}
            
            <div className="w-full flex items-center justify-between bg-[#E2EFF6] px-5 py-4 rounded-xl mb-6 border border-[#00668c]/20">
              <span className="text-[#00668c] font-medium text-sm">Amount due:</span>
              <span className="font-mono font-bold text-2xl text-[#00668c]">
                ₹{selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <button 
              onClick={handleMarkAsPaid}
              disabled={paying}
              className="w-full py-3.5 bg-[#A33D14] text-white font-bold rounded-xl shadow-md hover:bg-[#8A3311] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {paying ? "Processing..." : "Mark as Paid"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
