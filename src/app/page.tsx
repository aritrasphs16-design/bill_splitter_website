"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import LandingPageTour from "@/components/LandingPageTour";
import TestingGuideModal from "@/components/TestingGuideModal";
import { Anchor, Ship, PieChart, Users, Receipt, ArrowRight, Wallet, CheckCircle2, FlaskConical, AlertTriangle, Camera, UserCircle, Sparkles, Globe, QrCode, Bell, UserPlus, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="font-[family-name:var(--font-jakarta)] min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] selection:bg-[var(--color-primary)] selection:text-[var(--color-on-primary)] overflow-x-hidden flex flex-col">
      <LandingPageTour />
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Wallet className="w-8 h-8" />
            <span className="font-display-md text-2xl font-bold tracking-tight">SplitEasy</span>
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
          
          <motion.div 
            id="tour-hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ 
                opacity: { delay: 0.2, duration: 0.5 },
                scale: { delay: 0.2, duration: 0.5 },
                y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.7 }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-label-sm mb-8 border border-[var(--color-primary)]/20 shadow-sm"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary)]"></span>
              </span>
              SplitEasy v3.0 is Live!
            </motion.div>
            
            <h1 className="font-display-lg text-5xl md:text-7xl font-extrabold text-[var(--color-on-surface)] leading-tight mb-8">
              Split travel expenses <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)]">
                without the headache.
              </span>
            </h1>
            
            <p className="font-body-lg text-xl text-[var(--color-on-surface-variant)] max-w-2xl mx-auto mb-8">
              From weekend getaways to shared apartment bills — SplitEasy calculates exactly who owes what in seconds, supports any currency, and keeps your finances perfectly balanced.
            </p>

            
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link 
                href={isLoggedIn ? "/dashboard/expenses" : "/login"} 
                className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-8 py-4 rounded-full font-title-md text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Ship className="w-5 h-5" />
                Start Splitting Free
              </Link>
              <button 
                onClick={() => setIsTestingGuideOpen(true)}
                className="bg-white/80 backdrop-blur-md text-[#00668c] border-2 border-[#00668c] px-8 py-4 rounded-full font-title-md text-lg shadow-[0_0_15px_rgba(0,102,140,0.3)] hover:shadow-[0_0_25px_rgba(0,102,140,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#00668c] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <FlaskConical className="w-5 h-5 relative z-10 group-hover:text-white transition-colors duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">How to Test</span>
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* App Preview Showcase Section */}
        <section className="pb-24 px-6 relative z-10 -mt-10 sm:-mt-20">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-4 md:p-8"
            >
              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                <div className="relative w-full md:w-1/2 rounded-2xl overflow-hidden shadow-md border border-[var(--color-outline-variant)]/50 group">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                  <Image 
                    src="/preview1.png" 
                    alt="SplitEasy Dashboard Preview" 
                    width={800} 
                    height={600} 
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="relative w-full md:w-1/2 rounded-2xl overflow-hidden shadow-md border border-[var(--color-outline-variant)]/50 group">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                  <Image 
                    src="/preview2-v2.png" 
                    alt="SplitEasy Expenses Preview" 
                    width={800} 
                    height={600} 
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why SplitEasy Section */}
        <section className="py-20 px-6 bg-[var(--color-surface)] relative z-20 border-t border-[var(--color-outline-variant)]">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
            >
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-error-container)]/30 text-[var(--color-error)] font-label-sm border border-[var(--color-error)]/20 shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                  The Spreadsheet Problem
                </div>
                <h2 className="font-display-md text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] leading-tight">
                  Why are we still tracking shared expenses manually?
                </h2>
                <p className="font-body-lg text-[var(--color-on-surface-variant)] leading-relaxed">
                  Keeping track of payment records, partial settlements, and multi-currency conversions across group trips using traditional spreadsheets quickly becomes a chaotic, error-prone mess.
                </p>
                <p className="font-body-lg text-[var(--color-on-surface-variant)] leading-relaxed">
                  SplitEasy was built from the ground up to replace manual ledgers. We automate the complex math, instantly calculate the minimum settlements required, and keep everyone's financial records perfectly synchronized in real-time.
                </p>
              </div>
              <div className="flex-1 w-full max-w-lg mx-auto lg:max-w-none">
                <div className="relative bg-gradient-to-br from-[var(--color-surface-container-high)] to-[var(--color-surface-container-lowest)] p-8 rounded-3xl border border-[var(--color-outline-variant)] shadow-[var(--shadow-float)] overflow-hidden group">
                  {/* Decorative background glows */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-[var(--color-error)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-error)]/20 transition-colors"></div>
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 bg-[var(--color-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-primary)]/20 transition-colors"></div>
                  
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-error-container)]/50 flex items-center justify-center text-[var(--color-error)]">
                           <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span className="font-label-lg font-semibold text-[var(--color-on-surface-variant)] line-through decoration-[var(--color-error)] decoration-2">Trip_Ledger_Final_v3.xlsx</span>
                      </div>
                    </div>
                    
                    {/* Abstract Spreadsheet Rows */}
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-outline-variant)]/50 shadow-sm flex items-center justify-between transform -rotate-2 opacity-60 transition-transform duration-500 group-hover:rotate-0">
                      <div className="h-2 w-1/3 bg-[var(--color-error)]/40 rounded"></div>
                      <div className="h-2 w-1/4 bg-[var(--color-error)]/30 rounded"></div>
                    </div>
                    
                    {/* SplitEasy Row replacing it */}
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-primary)] shadow-md flex items-center justify-between transform translate-x-4 scale-[1.02] transition-transform duration-500 group-hover:scale-[1.05]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] shadow-sm">
                           <Wallet className="w-4 h-4" />
                        </div>
                        <div className="h-2.5 w-24 bg-[var(--color-on-surface)] rounded"></div>
                      </div>
                      <div className="h-2.5 w-16 bg-[var(--color-primary)] rounded"></div>
                    </div>
                    
                    {/* Abstract Spreadsheet Rows */}
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-outline-variant)]/50 shadow-sm flex items-center justify-between transform rotate-2 opacity-60 transition-transform duration-500 group-hover:rotate-0">
                      <div className="h-2 w-2/5 bg-[var(--color-error)]/40 rounded"></div>
                      <div className="h-2 w-1/5 bg-[var(--color-error)]/30 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Features Bento Grid */}
        <section id="tour-features" className="py-24 px-6 bg-[var(--color-surface-container-lowest)] relative z-20">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-display-md text-3xl md:text-5xl font-bold text-[var(--color-on-surface)] mb-4">Everything you need for financial harmony</h2>
              <p className="font-body-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">Ditch the complicated spreadsheets. We built the ultimate ledger for modern travelers.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1 - Large */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-2 bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-surface-container)] p-8 rounded-3xl shadow-sm border border-[var(--color-outline-variant)] flex flex-col justify-between overflow-hidden group"
              >
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
              </motion.div>

              {/* Feature 2 - Small */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[var(--color-tertiary-container)]/30 p-8 rounded-3xl shadow-sm border border-[var(--color-tertiary-container)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Custom Splits</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Split equally, by exact amounts, or by percentages. Complete flexibility.</p>
                </div>
              </motion.div>

              {/* Feature 3 - Small */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[var(--color-secondary-container)]/30 p-8 rounded-3xl shadow-sm border border-[var(--color-secondary-container)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Smart Settlements</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Our algorithm calculates the minimum number of transactions to get everyone paid back.</p>
                </div>
              </motion.div>

              {/* Feature 4 - Large */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="md:col-span-2 bg-[var(--color-surface-container)] p-8 rounded-3xl shadow-sm border border-[var(--color-outline-variant)] flex flex-col justify-between overflow-hidden relative"
              >
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
              </motion.div>

              {/* Feature 5 - Small */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[var(--color-primary-container)]/20 p-8 rounded-3xl shadow-sm border border-[var(--color-primary-container)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Multi-Currency</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Traveling abroad? Add expenses in any currency and we handle the exact real-time conversions instantly.</p>
                </div>
              </motion.div>

              {/* Feature 6 - Small */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-[var(--color-secondary-container)]/20 p-8 rounded-3xl shadow-sm border border-[var(--color-secondary-container)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">UPI Integration</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Settle debts seamlessly. Add your UPI ID so friends can tap and pay you back directly from their bank app.</p>
                </div>
              </motion.div>

              {/* Feature 7 - Small */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-[var(--color-tertiary-container)]/20 p-8 rounded-3xl shadow-sm border border-[var(--color-tertiary-container)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-2">Smart Nudges</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)]">Automated email notifications gently remind friends to settle up without having to have the awkward conversation.</p>
                </div>
              </motion.div>

              {/* Feature 8 - Full Width */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="md:col-span-3 bg-gradient-to-r from-[var(--color-surface-container)] to-[var(--color-surface-container-lowest)] p-8 rounded-3xl shadow-sm border border-[var(--color-outline-variant)] flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden relative"
              >
                <div className="z-10 relative md:w-1/2">
                  <div className="w-12 h-12 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-title-lg text-2xl font-bold text-[var(--color-on-surface)] mb-2">Instant Group Access</h3>
                  <p className="font-body-md text-[var(--color-on-surface-variant)] max-w-md">No complicated invites or clunky onboarding. Generate a unique 6-digit access code for your trip and let anyone join instantly from their phone.</p>
                </div>
                <div className="relative z-10 w-full md:w-auto flex justify-center mt-6 md:mt-0">
                    <div className="flex gap-3">
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white border border-[var(--color-outline-variant)] rounded-xl flex items-center justify-center text-3xl font-display-md font-bold text-gray-800 shadow-sm">X</div>
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white border border-[var(--color-outline-variant)] rounded-xl flex items-center justify-center text-3xl font-display-md font-bold text-gray-800 shadow-sm">7</div>
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white border border-[var(--color-outline-variant)] rounded-xl flex items-center justify-center text-3xl font-display-md font-bold text-gray-800 shadow-sm">K</div>
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40 rounded-xl flex items-center justify-center shadow-sm animate-pulse relative overflow-hidden">
                           <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--color-primary)] animate-pulse"></div>
                        </div>
                    </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Future Developments */}
        <section className="py-24 px-6 bg-[var(--color-surface)] relative z-20 border-t border-[var(--color-outline-variant)]">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-display-md text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] mb-4 flex items-center justify-center gap-3">
                <Sparkles className="text-[var(--color-primary)] w-8 h-8" />
                On the Horizon
              </h2>
              <p className="font-body-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">We're constantly improving SplitEasy. Here is a sneak peek at what we are building next.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[var(--color-surface-container-lowest)] p-8 rounded-3xl border border-[var(--color-outline-variant)] shadow-[var(--shadow-float)] hover:shadow-lg transition-shadow group"
              >
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-3">AI Receipt Scanning</h3>
                <p className="font-body-md text-[var(--color-on-surface-variant)]">Just snap a photo of your dinner receipt and let our AI automatically itemize and assign costs to the right people.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[var(--color-surface-container-lowest)] p-8 rounded-3xl border border-[var(--color-outline-variant)] shadow-[var(--shadow-float)] hover:shadow-lg transition-shadow group"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                  <UserCircle className="w-7 h-7" />
                </div>
                <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-3">Rich User Profiles</h3>
                <p className="font-body-md text-[var(--color-on-surface-variant)]">Save payment methods, track all-time statistics across multiple trips, and easily add frequent travel buddies.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[var(--color-surface-container-lowest)] p-8 rounded-3xl border border-[var(--color-outline-variant)] shadow-[var(--shadow-float)] hover:shadow-lg transition-shadow group"
              >
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-title-lg text-xl font-bold text-[var(--color-on-surface)] mb-3">Smart Categorization</h3>
                <p className="font-body-md text-[var(--color-on-surface-variant)]">Machine learning will auto-categorize your expenses based on descriptions and provide personalized budget insights.</p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* 4. Social Proof / CTA */}
        <section id="tour-cta" className="py-24 px-6 bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)] relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <h2 className="font-display-md text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] mb-8">Ready to get started?</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">100% Free to use</span></div>
               <div className="hidden sm:block text-[var(--color-outline-variant)]">•</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">Unlimited groups & members</span></div>
               <div className="hidden sm:block text-[var(--color-outline-variant)]">•</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="text-[var(--color-primary)] w-5 h-5"/> <span className="text-[var(--color-on-surface-variant)]">No app download required</span></div>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-10 py-5 rounded-full font-title-lg text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              Start splitting now
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
          
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
            <Wallet className="w-6 h-6" />
            <span className="font-display-sm text-xl font-bold">SplitEasy</span>
          </div>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            © {new Date().getFullYear()} SplitEasy. All rights reserved.
          </p>
          <div className="flex gap-6 items-center">
            <a href="https://github.com/aritrasphs16-design/bill_splitter_website" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
              GitHub
            </a>
            <Link href="/privacy" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TestingGuideModal isOpen={isTestingGuideOpen} onClose={() => setIsTestingGuideOpen(false)} />

    </div>
  );
}
