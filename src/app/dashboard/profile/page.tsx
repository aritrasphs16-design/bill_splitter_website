"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserCircle, Save, AlertTriangle, CheckCircle2, TrendingUp, Users, LogOut, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [defaultCurrency, setDefaultCurrency] = useState<string>("INR");

  // Stats
  const [stats, setStats] = useState({ totalGroups: 0, totalPersonalSpent: 0 });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setFullName(userData.full_name || "");
        setUpiId(userData.upi_id || "");
        setPhoneNumber(userData.phone_number || "");
        if (userData.default_currency) {
          setDefaultCurrency(userData.default_currency);
        }
      }

      // Fetch stats
      const [groupsRes, expensesRes] = await Promise.all([
        supabase.from("group_members").select("group_id", { count: 'exact' }).eq("user_id", session.user.id),
        supabase.from("personal_expenses").select("amount").eq("user_id", session.user.id)
      ]);

      const totalPersonalSpent = expensesRes.data 
        ? expensesRes.data.reduce((acc, curr) => acc + Number(curr.amount), 0)
        : 0;

      setStats({
        totalGroups: groupsRes.count || 0,
        totalPersonalSpent
      });

    } catch (err: any) {
      console.error("Error fetching profile:", err);
      if (err.message && err.message.includes("does not exist")) {
        setError("Database update required. Please run the SQL command provided in the Walkthrough to add new columns (default_currency, upi_id, phone_number).");
      } else {
        setError("Failed to load profile data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update the public users table
      const { error: dbError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          upi_id: upiId,
          phone_number: phoneNumber,
          default_currency: defaultCurrency
        })
        .eq("id", userId);

      if (dbError) throw dbError;

      // 2. Update the auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error("Error updating profile:", err);
      if (err.message && err.message.includes("does not exist")) {
        setError("Database update required. Please run the SQL command provided in the Walkthrough to add new columns.");
      } else {
        setError(err.message || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      // Delete from users table (cascades down based on DB schema)
      const { error: deleteError } = await supabase.from("users").delete().eq("id", userId);
      if (deleteError) throw deleteError;

      // Sign out
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      setError("Failed to delete account. Please contact support.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="font-display-md text-3xl font-bold text-[var(--color-on-surface)] flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-[var(--color-primary)]" />
          Your Profile
        </h1>
        <p className="font-body-md text-[var(--color-on-surface-variant)] mt-2">
          Manage your personal details, preferences, and account security.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700 items-start">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-body-md text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-emerald-700 items-center">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-body-md text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* Lifetime Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Account Status Card */}
        {(() => {
          let status = { title: "Sailor", color: "text-blue-600", bg: "bg-blue-100", icon: "⛵", gradient: "from-blue-50 to-blue-100/50" };
          if (stats.totalPersonalSpent >= 5000) {
            status = { title: "Navigator", color: "text-indigo-600", bg: "bg-indigo-100", icon: "🧭", gradient: "from-indigo-50 to-indigo-100/50" };
          }
          if (stats.totalPersonalSpent >= 20000) {
            status = { title: "Captain", color: "text-amber-600", bg: "bg-amber-100", icon: "⚓", gradient: "from-amber-50 to-amber-100/50" };
          }

          return (
            <div className={`bg-gradient-to-br ${status.gradient} rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rank</div>
                <div className={`w-8 h-8 ${status.bg} ${status.color} rounded-full flex items-center justify-center text-lg shadow-sm`}>
                  {status.icon}
                </div>
              </div>
              <div>
                <div className={`text-2xl font-black ${status.color}`}>{status.title}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Based on total spending</div>
              </div>
            </div>
          );
        })()}

        <div className="bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[var(--color-primary)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">Total Fleets</div>
            <div className="text-3xl font-black text-[var(--color-on-surface)]">{stats.totalGroups}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[var(--color-secondary-container)] to-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[var(--color-secondary)]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">Total Spend</div>
            <div className="text-3xl font-black text-[var(--color-on-surface)] truncate max-w-[150px]">
              {currencies.find(c => c.code === defaultCurrency)?.symbol}{stats.totalPersonalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      <details className="mb-8 group">
        <summary className="cursor-pointer text-sm font-bold text-[var(--color-primary)] flex items-center gap-1 select-none hover:underline mb-2">
          How do Ranks work?
        </summary>
        <div className="p-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-sm text-sm flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg">⛵</div>
             <div>
                <strong className="text-[var(--color-on-surface)] block text-base">Sailor</strong>
                <span className="text-[var(--color-on-surface-variant)] text-xs">Base Rank</span>
             </div>
          </div>
          <div className="hidden sm:block w-px bg-[var(--color-outline-variant)]"></div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg">🧭</div>
             <div>
                <strong className="text-[var(--color-on-surface)] block text-base">Navigator</strong>
                <span className="text-[var(--color-on-surface-variant)] text-xs">5,000+ Spend</span>
             </div>
          </div>
          <div className="hidden sm:block w-px bg-[var(--color-outline-variant)]"></div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-lg">⚓</div>
             <div>
                <strong className="text-[var(--color-on-surface)] block text-base">Captain</strong>
                <span className="text-[var(--color-on-surface-variant)] text-xs">20,000+ Spend</span>
             </div>
          </div>
        </div>
      </details>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden mb-12">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-6 pb-2 border-b border-[var(--color-outline-variant)]">
            Personal Details
          </h2>
          <div className="space-y-6">
            
            {/* Email (Read-only) */}
            <div>
              <label className="block font-label-md text-sm font-bold text-[var(--color-on-surface)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] rounded-xl px-4 py-3 font-body-md cursor-not-allowed opacity-70"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block font-label-md text-sm font-bold text-[var(--color-on-surface)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] rounded-xl px-4 py-3 font-body-md text-[var(--color-on-surface)] transition-all outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* UPI ID */}
              <div>
                <label className="block font-label-md text-sm font-bold text-[var(--color-on-surface)] mb-2">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] rounded-xl px-4 py-3 font-body-md text-[var(--color-on-surface)] transition-all outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-label-md text-sm font-bold text-[var(--color-on-surface)] mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] rounded-xl px-4 py-3 font-body-md text-[var(--color-on-surface)] transition-all outline-none"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-[var(--color-on-surface)] pt-8 pb-2 border-b border-[var(--color-outline-variant)]">
              Preferences
            </h2>
            
            {/* Default Currency */}
            <div>
              <label className="block font-label-md text-sm font-bold text-[var(--color-on-surface)] mb-2">
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] rounded-xl px-4 py-3 font-body-md text-[var(--color-on-surface)] transition-all outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-[var(--color-outline-variant)] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-8 py-3.5 rounded-xl font-label-md font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {saving ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-200 rounded-3xl overflow-hidden bg-white">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Danger Zone
          </h2>
          <p className="text-slate-600 mb-6 font-medium text-sm">
            Once you delete your account, there is no going back. Please be certain. Deleting your account will remove your personal expenses and remove you from all groups.
          </p>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              This action cannot be undone. This will permanently delete your account, remove your personal expenses, and sever your ties to all shared fleets.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Please type <span className="font-mono bg-slate-100 px-1 rounded text-red-600">DELETE</span> to confirm.
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {deleting ? "Deleting..." : <><Trash2 className="w-5 h-5"/> Delete Account</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
