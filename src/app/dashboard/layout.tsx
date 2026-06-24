"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("Captain");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setEmail(session.user.email ?? "");
        const fullName = session.user.user_metadata?.full_name || "Captain";
        setFirstName(fullName.split(" ")[0]);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { name: "Home", href: "/dashboard", icon: "anchor" },
    { name: "Expenses", href: "/dashboard/expenses", icon: "receipt_long" },
    { name: "Groups", href: "/dashboard/groups", icon: "groups" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* SideNavBar (Desktop) */}
      <nav className="h-full w-64 fixed left-0 top-0 hidden md:flex flex-col bg-[#F8F3ED] shadow-sm z-40 border-r border-[#E8E0D5]">
        <div className="flex flex-col h-full py-8 pr-4">
          <div className="flex flex-col items-center mb-8 px-4">
            <div className="w-20 h-20 rounded-full border-4 border-[#E2EFF6] overflow-hidden mb-3 bg-white flex items-center justify-center shrink-0 shadow-sm relative">
               <span className="material-symbols-outlined text-4xl text-primary">sailing</span>
            </div>
            <h2 className="font-title-md text-lg font-bold text-primary text-center">{firstName}'s Log</h2>
            <p className="font-caption text-xs text-on-surface-variant text-center mt-1 uppercase tracking-wider">Rank: Captain</p>
          </div>
          <ul className="flex flex-col gap-2 flex-grow mt-4">
            {navLinks.map((link) => {
              const isActive = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-4 py-3 pl-8 pr-4 transition-all duration-200 ${
                      isActive
                        ? "text-primary font-bold border-l-[3px] border-primary bg-[#FFF9F2] rounded-r-full shadow-sm"
                        : "text-on-surface-variant hover:text-primary hover:bg-[#FFF9F2]/50 rounded-r-full border-l-[3px] border-transparent"
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {link.icon}
                    </span>
                    <span className="font-label-md text-[15px]">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="px-4 mt-auto">
            <Link 
              href="/dashboard/expenses"
              className="w-full flex items-center justify-center gap-2 bg-[#A33D14] text-white font-label-md text-[15px] py-3 px-4 rounded-lg shadow-sm hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              Add Expense
            </Link>
          </div>
        </div>
      </nav>

      {/* TopAppBar (Mobile) */}
      <header className="md:hidden flex justify-between items-center w-full px-container-padding py-4 fixed top-0 z-50 bg-[#F8F3ED]/80 backdrop-blur-md shadow-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">CruiseSplit</h1>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full px-container-padding py-section-margin mt-16 md:mt-0 pb-24 md:pb-section-margin max-w-7xl mx-auto min-h-screen bg-[#FFF9F2]">
        {children}
      </main>

      {/* Fixed Logout Button (Desktop) */}
      <button 
        onClick={handleLogout}
        className="hidden md:flex fixed bottom-8 right-8 items-center justify-center gap-2 bg-white text-[#A33D14] font-label-md text-[15px] py-3 px-6 rounded-full shadow-md border border-[#E8E0D5] hover:bg-[#F5E6E0] transition-all z-50"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Log out
      </button>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 md:hidden bg-[#F8F3ED]/90 backdrop-blur-lg shadow-[0_-4px_12px_rgba(3,4,94,0.05)] rounded-t-xl">
        {navLinks.map((link) => {
          const isActive = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 transition-all duration-150 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container rounded-full scale-90"
                  : "text-on-surface-variant hover:bg-secondary-container/50 rounded-lg"
              }`}
            >
              <span 
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {link.icon}
              </span>
              <span className="font-caption text-caption mt-1">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
