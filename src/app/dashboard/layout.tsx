"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { syncUserToMongo, getUserProfile } from "@/app/actions/user";
import NotificationDropdown from "@/components/ui/notification-dropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("Captain");
  const [lastName, setLastName] = useState("");
  const [rank, setRank] = useState("Personal Ledger");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        await syncUserToMongo(session.user);
        const profileData = await getUserProfile(session.user.id);
        setEmail(session.user.email ?? "");
        
        // Use the name from MongoDB which is always up-to-date, fallback to auth session metadata
        const fullName = profileData?.user?.full_name || session.user.user_metadata?.full_name || "Captain";
        const parts = fullName.split(" ");
        setFirstName(parts[0]);
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
        setLoading(false);
      }
    };
    
    checkUser();

    window.addEventListener('profileUpdated', checkUser);
    return () => window.removeEventListener('profileUpdated', checkUser);
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Groups", href: "/dashboard/groups", icon: "group" },
    { name: "Expenses", href: "/dashboard/expenses", icon: "receipt_long" },
    { name: "Profile", href: "/dashboard/profile", icon: "person" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "SE";

  return (
    <>
      {/* SideNavBar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col justify-between bg-surface-container-lowest border-r border-outline-variant/40 shadow-sm z-30">
        <div className="h-full flex flex-col p-4 space-y-6">
          <div className="px-2 pt-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
              </div>
              <span className="text-headline-md font-bold text-primary tracking-tight">SplitEasy</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-outline-variant/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-label-md font-semibold text-on-surface truncate">{firstName} {lastName}</p>
                <p className="text-body-sm text-on-surface-variant truncate">{rank}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navLinks.map((link) => {
              const isActive = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-label-lg transition-colors duration-150 active:scale-[0.99] ${
                    isActive
                      ? "bg-secondary-container/20 text-primary font-semibold"
                      : "text-on-surface-variant font-normal hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2">
            <Link href="/dashboard/expenses" className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Expense</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-outline-variant/30 space-y-1">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSc29vVR4Jp_xGZsSkRMD4Ysbe_4SURA6BDFKpVdC5XU6HkaFg/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-label-lg font-normal hover:bg-surface-container-low hover:text-on-surface transition-colors duration-150 active:scale-[0.99]">
              <span className="material-symbols-outlined text-[18px]">rate_review</span>
              <span>Feedback</span>
            </a>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error font-label-lg font-normal hover:bg-error-container/20 transition-colors duration-150 active:scale-[0.99]">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/40 shadow-sm z-20 justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <span className="text-headline-sm font-bold text-primary tracking-tight">SplitEasy</span>
          <span className="text-outline-variant/80">/</span>
          <span className="text-label-lg text-on-surface-variant capitalize">
            {pathname === "/dashboard" ? "Overview" : pathname.split("/").pop()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <Link href="/dashboard/expenses" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container hover:bg-[#065F46] text-on-primary font-label-lg font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Add Expense</span>
          </Link>
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-label-sm font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* TopNavBar Mobile */}
      <header className="md:hidden flex justify-between items-center w-full px-4 py-4 fixed top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm border-b border-outline-variant/40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
           </div>
           <h1 className="text-headline-sm font-bold text-primary">SplitEasy</h1>
        </div>
        <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      {/* BottomNavBar Mobile */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 md:hidden bg-surface-container-lowest/90 backdrop-blur-lg border-t border-outline-variant/40 shadow-[0_-4px_12px_rgba(3,4,94,0.05)]">
        {navLinks.map((link) => {
          const isActive = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-150 ${
                isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {link.icon}
              </span>
              <span className="text-[10px] mt-1 font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <main className="md:ml-64 md:pt-16 pt-20 pb-20 md:pb-8 min-h-screen bg-transparent relative z-10">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
