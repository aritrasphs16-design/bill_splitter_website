"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
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
    { name: "Expenses", href: "/dashboard/expenses", icon: "receipt_long" },
    { name: "Groups", href: "/dashboard/groups", icon: "groups" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* SideNavBar (Desktop) */}
      <nav className="h-full w-64 fixed left-0 top-0 hidden md:flex flex-col bg-surface-container-low shadow-sm z-40">
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary">CruiseSplit</h1>
          </div>
          <div className="flex items-center gap-4 mb-8 p-4 bg-surface-container rounded-xl shadow-sm overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-title-md text-[16px] leading-[24px] font-semibold text-on-surface truncate">Captain</h2>
              <p className="font-caption text-caption text-on-surface-variant truncate">{email}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 flex-grow">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-primary font-bold border-r-4 border-primary bg-surface-container-high translate-x-1"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {link.icon}
                    </span>
                    <span className="font-label-md text-label-md">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <button 
            onClick={handleLogout}
            className="mt-auto flex items-center justify-center gap-2 bg-surface text-error font-label-md text-label-md py-3 px-4 rounded-full shadow-sm border border-outline-variant hover:bg-error-container hover:text-on-error-container transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        </div>
      </nav>

      {/* TopAppBar (Mobile) */}
      <header className="md:hidden flex justify-between items-center w-full px-container-padding py-4 fixed top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">CruiseSplit</h1>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full px-container-padding py-section-margin mt-16 md:mt-0 pb-24 md:pb-section-margin max-w-7xl mx-auto">
        {children}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 md:hidden bg-surface/90 backdrop-blur-lg shadow-[0_-4px_12px_rgba(3,4,94,0.05)] rounded-t-xl">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
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
