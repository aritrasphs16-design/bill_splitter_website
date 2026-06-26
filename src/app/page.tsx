"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Anchor, Ship, PieChart, Users, Receipt, ArrowRight, Wallet, CheckCircle2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] selection:bg-[var(--color-primary)] selection:text-[var(--color-on-primary)] overflow-x-hidden flex flex-col">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Anchor className="w-8 h-8" />
            <span className="font-display-md text-2xl font-bold tracking-tight">CruiseSplit</span>
          </div>
          
          <div>
            {isLoggedIn === null ? (
               <div className="w-24 h-10 bg-[var(--color-surface-variant)] rounded-full animate-pulse"></div>
            ) : isLoggedIn ? (
              <Link 
                href="/dashboard/expenses" 
                className="ticket-btn px-6 py-2.5 font-label-md text-label-md flex items-center gap-2 transition-transform hover:scale-105"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="font-label-md text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors hidden md:block">
                  Log In
                </Link>
                <Link 
                  href="/login" 
                  className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-6 py-2.5 rounded-full font-label-md shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-20">
        
        {/* 2. Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 px-6 overflow-hidden flex items-center justify-center min-h-[80vh]">
          {/* Decorative Background Elements */}
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-[var(--color-primary-container)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-[var(--color-tertiary-container)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-[var(--color-secondary-container)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-label-sm mb-8 border border-[var(--color-primary)]/20 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary)]"></span>
              </span>
              CruiseSplit v2.0 is Live!
            </div>
            
            <h1 className="font-display-lg text-5xl md:text-7xl font-extrabold text-[var(--color-on-surface)] leading-tight mb-8">
              Split travel expenses <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)]">
                without the headache.
              </span>
            </h1>
            
            <p className="font-body-lg text-xl text-[var(--color-on-surface-variant)] max-w-2xl mx-auto mb-12">
              Whether it's a weekend road trip or a massive cruise, CruiseSplit tracks who paid what, handles custom percentage splits, and gives you beautiful analytics so your crew can just focus on the adventure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href={isLoggedIn ? "/dashboard/expenses" : "/login"} 
                className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-8 py-4 rounded-full font-title-md text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Ship className="w-5 h-5" />
                Start your voyage
              </Link>
              <a 
                href="#features" 
                className="bg-[var(--color-surface-container)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] px-8 py-4 rounded-full font-title-md text-lg hover:bg-[var(--color-surface-container-high)] transition-all flex items-center justify-center w-full sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* 3. Features Bento Grid */}
        <section id="features" className="py-24 px-6 bg-[var(--color-surface-container-lowest)] relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-3xl md:text-5xl font-bold text-[var(--color-on-surface)] mb-4">Everything you need for smooth sailing</h2>
              <p className="font-body-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">Ditch the complicated spreadsheets. We built the ultimate ledger for modern travelers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1 - Large */}
              <div className="md:col-span-2 bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-surface-container)] p-8 rounded-3xl shadow-sm border border-[var(--color-outline-variant)] flex flex-col justify-between overflow-hidden group">
                <div>
                  <div className="w-12 h-12 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-2xl font-bold text-[var(--color-on-surface)] mb-2">Beautiful Spending Analytics</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)] max-w-md">See exactly where your fleet's money is going with colorful, interactive donut charts tracking every category.</p>
                </div>
                <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 opacity-50 group-hover:opacity-100 flex gap-2">
                  <div className="w-full h-24 bg-[var(--color-surface)] rounded-t-xl border border-[var(--color-outline)] shadow-lg mt-8 p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--color-tertiary)] border-t-[var(--color-primary)] border-r-[var(--color-secondary)]"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-2 bg-[var(--color-surface-variant)] rounded w-3/4"></div>
                      <div className="h-2 bg-[var(--color-surface-variant)] rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 - Small */}
              <div className="bg-[var(--color-tertiary-container)]/30 p-8 rounded-3xl shadow-sm border border-[var(--color-tertiary-container)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Custom Splits</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Split equally, by exact amounts, or by percentages. Complete flexibility.</p>
                </div>
              </div>

              {/* Feature 3 - Small */}
              <div className="bg-[var(--color-secondary-container)]/30 p-8 rounded-3xl shadow-sm border border-[var(--color-secondary-container)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Smart Settlements</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Our algorithm calculates the minimum number of transactions to get everyone paid back.</p>
                </div>
              </div>

              {/* Feature 4 - Large */}
              <div className="md:col-span-2 bg-[var(--color-surface-container)] p-8 rounded-3xl shadow-sm border border-[var(--color-outline-variant)] flex flex-col justify-between overflow-hidden relative">
                <div className="z-10 relative">
                  <div className="w-12 h-12 bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-[var(--color-outline)]">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-2xl font-bold text-[var(--color-on-surface)] mb-2">Personal & Group Dashboards</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)] max-w-md">Track shared group trips in one tab, and your own personal daily expenses in another. Complete financial clarity.</p>
                </div>
                {/* Decorative UI elements mimicking the app */}
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 rotate-[-5deg] opacity-60 pointer-events-none">
                   <div className="w-64 h-48 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-8 bg-gray-100 rounded w-full"></div>
                        <div className="h-8 bg-gray-100 rounded w-full"></div>
                        <div className="h-8 bg-gray-100 rounded w-full"></div>
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. Social Proof / CTA */}
        <section className="py-24 px-6 bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)] relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-display-md text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] mb-8">Ready to drop anchor?</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">Free forever</span></div>
               <div className="hidden sm:block text-[var(--color-outline-variant)]">•</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">No credit card required</span></div>
               <div className="hidden sm:block text-[var(--color-outline-variant)]">•</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">Setup in 30 seconds</span></div>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-10 py-5 rounded-full font-title-lg text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
          
          {/* Wave graphic bottom */}
          <div className="absolute bottom-0 left-0 w-full opacity-10 translate-y-1/2 pointer-events-none">
            <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
              <path fill="var(--color-primary)" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,128C672,107,768,117,864,138.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </section>

      </main>

      {/* 5. Footer */}
      <footer className="bg-[var(--color-surface-container-highest)] border-t border-[var(--color-outline-variant)] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[var(--color-on-surface)] opacity-70">
            <Anchor className="w-6 h-6" />
            <span className="font-display-sm text-xl font-bold">CruiseSplit</span>
          </div>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            © {new Date().getFullYear()} CruiseSplit. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="https://github.com/aritrasphs16-design/bill_splitter_website" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">GitHub</a>
            <Link href="/privacy" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
