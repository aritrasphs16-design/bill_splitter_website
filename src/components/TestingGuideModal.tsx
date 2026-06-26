"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Users, Receipt, HandCoins } from "lucide-react";

interface TestingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestingGuideModal({ isOpen, onClose }: TestingGuideModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-surface-container-lowest)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--color-outline-variant)] overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between sticky top-0 bg-[var(--color-surface-container-lowest)] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-variant)] flex items-center justify-center text-[var(--color-primary)]">
                    <span className="material-symbols-outlined">science</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-bold text-[var(--color-primary)]">Quick Testing Guide</h2>
                    <p className="text-sm text-[var(--color-on-surface-variant)] font-medium">How to experience the magic of CruiseSplit</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--color-surface-variant)] rounded-full transition-colors text-[var(--color-on-surface-variant)]"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Step 1 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2EFF6] border-2 border-[#00668c] flex items-center justify-center text-[#00668c] font-bold z-10 group-hover:scale-110 transition-transform">
                      1
                    </div>
                    <div className="w-0.5 h-full bg-[var(--color-outline-variant)] mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
                      <UserPlus size={20} className="text-[#00668c]" /> The Setup
                    </h3>
                    <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                      CruiseSplit connects real users! To see it in action, you need two accounts. <br/>
                      <strong className="text-[var(--color-primary)]">Create two separate accounts</strong> (e.g., <code className="bg-[var(--color-surface-variant)] px-1 py-0.5 rounded text-sm">user1@test.com</code> and <code className="bg-[var(--color-surface-variant)] px-1 py-0.5 rounded text-sm">user2@test.com</code>). You can use two different browsers or an Incognito window.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2EFF6] border-2 border-[#00668c] flex items-center justify-center text-[#00668c] font-bold z-10 group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <div className="w-0.5 h-full bg-[var(--color-outline-variant)] mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
                      <Users size={20} className="text-[#00668c]" /> The Group
                    </h3>
                    <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                      Log in as User 1. Navigate to <strong>Groups</strong> and create a new group called "Goa Trip". <br/>
                      Click into the group, and use the <strong>Add Member</strong> feature to invite User 2 using their exact email address.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2EFF6] border-2 border-[#00668c] flex items-center justify-center text-[#00668c] font-bold z-10 group-hover:scale-110 transition-transform">
                      3
                    </div>
                    <div className="w-0.5 h-full bg-[var(--color-outline-variant)] mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
                      <Receipt size={20} className="text-[#00668c]" /> The Split
                    </h3>
                    <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                      Time to spend! Add a new expense (e.g., "Hotel Booking"). <br/>
                      Change the currency to <strong>USD</strong> to see the live automatic exchange rate conversion to INR in action!
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2EFF6] border-2 border-[#00668c] flex items-center justify-center text-[#00668c] font-bold z-10 group-hover:scale-110 transition-transform">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
                      <HandCoins size={20} className="text-[#00668c]" /> The Payoff
                    </h3>
                    <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                      Switch over to User 2's browser window. You'll immediately see the new expense synced in real-time. <br/>
                      Look at the <strong>Settlement Summary</strong>—User 2 now owes money! Click the shiny red <strong>"Pay Now"</strong> button to reveal the UPI QR Code.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                >
                  Got it, let's go!
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
